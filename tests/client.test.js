import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { beeVariant, layoutGraph, filterPosts, graphEdges, graphNodes, groupMembers, mentionsIn, mergeView, newDividerSeq, replayPosts, stepCursor, toggleRecipient } from '../client-source.js';

let seq = 0;
const post = (from, to, extra = {}) => ({ seq: ++seq, at: '2026-11-12T03:00:00.000Z', from, to, mentions: to, kind: 'message', body: `${from} says hi`, ...extra });
const reset = () => { seq = 0; };
const view = (posts, extra = {}) => ({ swarmId: 'lead-1', title: 'T', live: true, members: [], tasks: [], posts, nextSeq: (posts.at(-1)?.seq ?? 0) + 1, tiers: {}, ...extra });

test('graph edges count posts per directed pair and ignore self mentions', () => {
  reset();
  const posts = [post('lead', ['fix-1', 'fix-2']), post('fix-1', ['lead']), post('lead', ['fix-1']), post('fix-1', ['fix-1'])];
  const edges = graphEdges(posts);
  const byPair = Object.fromEntries(edges.map(e => [`${e.from}>${e.to}`, e]));
  assert.deepEqual(Object.keys(byPair).sort(), ['fix-1>lead', 'lead>fix-1', 'lead>fix-2']);
  assert.equal(byPair['lead>fix-1'].count, 2);
  assert.equal(byPair['lead>fix-1'].lastSeq, 3);
  assert.equal(byPair['fix-1>lead'].count, 1);
  assert.deepEqual(graphEdges([post('user', [])]), [], 'a board-only post draws no edge');
});

test('replay cut keeps posts up to the chosen seq and the graph rebuilds from it', () => {
  reset();
  const posts = [post('lead', ['a']), post('a', ['lead']), post('lead', ['b']), post('b', ['a'])];
  assert.equal(replayPosts(posts, null), posts, 'live shows everything');
  assert.deepEqual(replayPosts(posts, 2).map(p => p.seq), [1, 2]);
  const edges = graphEdges(replayPosts(posts, 2)).map(e => `${e.from}>${e.to}`).sort();
  assert.deepEqual(edges, ['a>lead', 'lead>a']);
  assert.deepEqual(graphNodes([{ name: 'lead' }], graphEdges(posts)), ['lead', 'a', 'b'], 'unknown senders still get a node');
});

test('step cursor moves one post at a time within bounds, including across seq gaps', () => {
  const posts = [{ seq: 3 }, { seq: 7 }, { seq: 9 }];
  assert.equal(stepCursor(posts, null, -1), 7, 'step back from live goes to the second last post');
  assert.equal(stepCursor(posts, 7, 1), 9);
  assert.equal(stepCursor(posts, 3, -1), 3, 'cannot step before the first post');
  assert.equal(stepCursor(posts, 5, 0), 7, 'a seq between posts snaps to the next post');
  assert.equal(stepCursor([], null, 1), null);
});

test('member filter matches posts the member sent or received, and search matches body and names', () => {
  reset();
  const posts = [post('lead', ['fix-1']), post('fix-2', ['lead'], { body: 'Tests PASS' }), post('fix-1', ['verifier']), post('verifier', ['fix-2'])];
  assert.deepEqual(filterPosts(posts, { member: 'fix-1' }).map(p => p.seq), [1, 3]);
  assert.deepEqual(filterPosts(posts, { member: 'fix' }).map(p => p.seq), [], 'a group prefix is not a member');
  assert.deepEqual(filterPosts(posts, { query: 'pass' }).map(p => p.seq), [2]);
  assert.deepEqual(filterPosts(posts, { member: 'fix-2', query: 'verifier' }).map(p => p.seq), [4]);
  assert.equal(filterPosts(posts, {}).length, 4);
});

test('new divider sits at the first unseen post that the user did not write', () => {
  reset();
  const posts = [post('lead', ['a']), post('user', ['lead']), post('a', ['lead']), post('lead', ['a'])];
  assert.equal(newDividerSeq(posts, undefined), null, 'first visit shows no divider');
  assert.equal(newDividerSeq(posts, 1), 3, 'own post is skipped');
  assert.equal(newDividerSeq(posts, 4), null, 'nothing new');
  assert.equal(newDividerSeq(posts, 0), 1);
});

test('merge appends incremental posts and drops a recreated board', () => {
  reset();
  const first = mergeView(null, view([post('lead', ['a']), post('a', ['lead'])]));
  assert.deepEqual(first.posts.map(p => p.seq), [1, 2]);
  const next = mergeView(first, view([post('lead', ['b'])], { nextSeq: 4 }));
  assert.deepEqual(next.posts.map(p => p.seq), [1, 2, 3]);
  assert.deepEqual(mergeView(next, view([], { nextSeq: 4 })).posts.map(p => p.seq), [1, 2, 3], 'an empty poll keeps history');
  assert.deepEqual(mergeView(next, view([], { nextSeq: 1 })).posts, [], 'a board whose nextSeq went backwards is refetched');
  assert.deepEqual(mergeView(next, view([], { swarmId: 'other', nextSeq: 9 })).posts, [], 'another swarm does not inherit posts');
  assert.equal(mergeView(next, { swarmId: null, posts: [] }), null);
});

test('coordinator stays centered above workers as the team grows', () => {
  for (const size of [0, 1, 2, 3, 4, 12]) {
    const workers = Array.from({ length: size }, (_, i) => `w-${i}`);
    const positions = layoutGraph([...workers, 'lead'], 'lead', 360);
    assert.equal(positions.get('lead').x, 180);
    assert.equal(new Set([...positions.values()].map(p => `${p.x},${p.y}`)).size, size + 1);
    for (const worker of workers) assert.ok(positions.get(worker).y > positions.get('lead').y);
  }
  assert.equal(beeVariant('lead'), 'lead');
  const variants = Array.from({ length: 4 }, (_, i) => beeVariant(`w-${i}`));
  assert.equal(new Set(variants).size, 4);
  assert.ok(!variants.includes('lead'));
  assert.equal(beeVariant('user'), null);
  assert.equal(beeVariant('monitor'), null);
});

test('members group lead first, then active, standing by, failed, retired', () => {
  const g = groupMembers([
    { name: 'a', role: 'teammate', status: 'inactive' }, { name: 'lead', role: 'lead', status: 'running' },
    { name: 'b', role: 'teammate', status: 'provisioning' }, { name: 'c', role: 'teammate', status: 'failed' }, { name: 'd', role: 'teammate', status: 'running' },
    { name: 'e', role: 'teammate', status: 'inactive', retired: true },
  ]);
  assert.deepEqual(Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.map(m => m.name)])), { lead: ['lead'], active: ['b', 'd'], standby: ['a'], failed: ['c'], retired: ['e'] });
});

test('typed @mentions resolve to known members only', () => {
  const names = ['all', 'lead', 'w-1', 'verifier'];
  assert.deepEqual(mentionsIn('@w-1 请修复，再让 @verifier 复查', names), ['w-1', 'verifier']);
  assert.deepEqual(mentionsIn('邮件 a@w-1.com 不算，@ghost 也不算', names), []);
  assert.deepEqual(mentionsIn('@ALL 停一下', names), ['all']);
});

test('recipient toggle keeps all exclusive', () => {
  assert.deepEqual(toggleRecipient(['lead'], 'fix-1'), ['lead', 'fix-1']);
  assert.deepEqual(toggleRecipient(['lead', 'fix-1'], 'lead'), ['fix-1']);
  assert.deepEqual(toggleRecipient(['lead'], 'all'), ['all']);
  assert.deepEqual(toggleRecipient(['all'], 'fix-1'), ['fix-1']);
  assert.deepEqual(toggleRecipient(['all'], 'all'), []);
});

test('built client.js registers the swarm tab, header action and Remote without importing DSH packages', async () => {
  const code = await readFile(new URL('../client.js', import.meta.url), 'utf8');
  let loaded;
  new Script(code).runInNewContext({ window: { __ModuleLoader__: { load: m => { loaded = m; } } } });
  assert.equal(loaded.id, '@local/dsh-swarm');
  const required = [];
  const React = { createElement: () => null, Fragment: 'f', useState: v => [v, () => {}], useEffect() {}, useRef: v => ({ current: v }), useMemo: f => f(), useId: () => 'x', useSyncExternalStore() {} };
  const plugin = loaded.factory(name => { required.push(name); return React; });
  assert.equal(JSON.stringify(required), '["react"]');
  const record = { tabs: [], slots: [], mounts: [], locales: [] };
  const ctx = {
    effect: f => f(), inject: (keys, f) => { record.injected = keys; f(ctx); },
    locale: { register: (ns, lang, dict) => record.locales.push([ns, lang, Object.keys(dict).length]), bind: () => k => k, subscribe() {}, getSnapshot() {} },
    typert: { remotes: { get: name => name === 'commands/execute' ? { parameters: [{ name: 'line', codec: { mode: 'strict', create() {} } }] } : undefined } },
    on: (event, fn) => { record[event] = fn; },
    sidebarRight: { mounted: { getSnapshot: () => 'lead' }, openTab: kind => record.opened.push(kind) },
    remote: { $mount: m => record.mounts.push(m) },
    sidebarRightTabs: { register: tab => record.tabs.push(tab) },
    slots: { inject: (name, f) => f(), register: (decl, component) => record.slots.push({ ...decl, component }) },
  };
  plugin.apply(ctx);
  assert.equal(JSON.stringify(record.injected), '["remote.swarmBoard"]');
  assert.equal(record.mounts[0].descriptors[0].id, '@local/dsh-swarm#swarmBoard/call');
  assert.equal(record.tabs[0].kind, 'swarm');
  const header = record.slots.find(s => s.name === 'conversation.session.header.actions');
  assert.equal(header.id, 'swarm');
  const side = record.slots.find(s => s.name === 'sidebar.right.pane.tab').component;
  const executed = record['command/executed'];
  record.opened = [];
  executed('lead', 'swarm', { kind: 'success' });
  executed('other', 'swarm-mode', { kind: 'success' });
  executed('lead', 'swarm-mode', { kind: 'error' });
  assert.deepEqual(record.opened, []);
  const activate = () => executed('lead', 'swarm-mode', { kind: 'success' });
  activate();
  let unmount;
  React.useLayoutEffect = effect => { unmount = effect(); };
  const actions = { openTab: kind => record.opened.push(`existing:${kind}`) };
  const mountSide = visible => side({ sessionId: 'lead', useTabInfo: () => ({ tab: { visible, actions } }) });
  mountSide(false);
  activate();
  unmount();
  mountSide(true);
  activate();
  unmount();
  assert.deepEqual(record.opened, ['swarm', 'existing:swarm']);
  assert.deepEqual(record.locales.map(l => l[1]), ['zh', 'en']);
  assert.equal(record.locales[0][2], record.locales[1][2]);
  assert.doesNotMatch(code, /require\(["']@deepseek-ai\//);
});
