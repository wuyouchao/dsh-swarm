import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, Config } from '../index.js';
import { BoardStore, domainSpec } from '../lib/storage.js';
import { appendPost } from '../lib/board.js';

const projectTiers = { review: { provider: 'test', model: 'review-model' }, analysis: { provider: 'test', model: 'analysis-model' } };

function fixture() {
  const rows = new Map(), live = new Map(), listeners = new Map(), effects = [], roster = [], sent = [], steered = [], tasks = [], drained = [], interrupted = [];
  let closed = false, contribution;
  const table = { get: key => rows.get(key), entries: () => rows.entries(), async put(key, value) { rows.set(key, structuredClone(domainSpec.tables.boards.valueSchema.parse(value))); } };
  const makeAgent = (id, preset = 'default') => {
    let selection = { provider: 'original', model: 'original' };
    const tools = new Map(), sections = new Map(), contexts = new Map();
    const register = map => value => { assert.ok(!map.has(value.name)); map.set(value.name, value); return () => map.delete(value.name); };
    const agent = { id, session: { id, preset }, status: 'idle',
      model: { current: () => selection, select: route => { selection = { ...route }; } },
      steer: message => steered.push({ id, message }),
      ctx: { tools: { get: name => tools.get(name), register: register(tools) }, systemPrompt: {
        section: register(sections), context: entry => {
          assert.ok(Number.isFinite(entry.order), `无效的上下文排序：${entry.name}`);
          return register(contexts)(entry);
        },
        getSectionOrder: name => ({ TEAM_POLICY: 600 })[name],
        getContextOrder: name => ({ SUBAGENT_DELEGATION: 120 })[name],
      } }, tools, contexts, sections,
    };
    live.set(id, agent);
    return agent;
  };
  const root = makeAgent('root'), other = makeAgent('other', 'default');
  const membership = agent => {
    if (live.get(agent.id) !== agent) return undefined;
    if (agent === root || agent === other) return { root: agent, role: 'lead', name: 'lead', id: agent.id };
    const row = roster.find(row => row.id === agent.id);
    return row ? { root, role: 'teammate', name: row.name, id: root.id } : undefined;
  };
  const emit = async (event, agent) => { for (const listener of listeners.get(event) ?? []) await listener({ agent }); };
  const ctx = {
    agents: { list: () => [...live.values()], get: id => live.get(id), withoutInitiator: fn => fn() },
    commands: { register(command) { ctx.command = command; return () => { delete ctx.command; }; } },
    agentTeams: { listTasks: () => tasks, isEnabled: agent => !!agent.team, setEnabled: async agent => { agent.team = true; } },
    subagents: {
      rootOf: agent => membership(agent).root,
      namesOf: agent => ({ self: membership(agent).name }),
      resolveMaxDepth: () => 1,
      async startActivation(request) {
        assert.equal(request.parent, root);
        const row = { id: request.childId, name: request.name, description: request.label };
        roster.push(row);
        const child = makeAgent(row.id);
        child.model.select(request.agentOptions);
        await emit('agent/created', child);
        assert.deepEqual(child.model.current(), request.agentOptions);
        return { childId: row.id, result: new Promise(() => {}), dispose: async () => drained.push(row.id) };
      },
      interrupt(id, authority) { assert.equal(authority.agent, root); interrupted.push(roster.find(r => r.id === id).name); },
      async sendMessage(caller, id, content) {
        assert.ok(membership(caller));
        if (id === 'broken-id') throw new Error('模拟投递失败');
        sent.push({ caller: caller.id, id, content });
      },
    },
    storageDomain: { async open(spec) { assert.equal(spec.name, 'local_swarm_board'); return { table: () => table, async close() { closed = true; } }; } },
    typert: { local: { get: () => ({ parameters: [{ name: 'line', codec: { mode: 'strict', create: () => ({ parse: v => v }) } }] }) }, register(value) { contribution = value; return () => {}; } },
    effect(fn) { const dispose = fn(); effects.push(dispose); return dispose; },
    on(event, fn) {
      const entries = listeners.get(event) ?? []; entries.push(fn); listeners.set(event, entries); return () => {};
    },
    provide(key, value) { ctx[key] = value; },
  };
  const swarm = (agent = root, rawInput = '') => ctx.command.handler({agent, rawInput, signal: new AbortController().signal});
  return { swarm, ctx, root, other, rows, live, roster, sent, steered, tasks, table, makeAgent, emit, drained, interrupted,
    get closed() { return closed; }, get contribution() { return contribution; },
    async close() { for (const dispose of effects.reverse()) await dispose?.(); },
    async call(request) { return JSON.parse(await ctx.swarmBoard.call(JSON.stringify({ sessionId: 'root', ...request }))); },
    async tool(agent, name, args) { return agent.tools.get(name).execute(args, { agent, signal: new AbortController().signal }); },
  };
}

test('配置默认档位与边界在 apply 前验证', async () => {
  assert.deepEqual(Config.parse({}).tiers, {});
  assert.equal(Config.parse({}).monitorIdleMs, 90000);
  assert.equal(Config.parse({}).monitorIntervalMs, 30000);
  assert.equal(Config.parse({}).maxPosts, 2000);
  assert.throws(() => Config.parse({ maxPosts: 2001 }));
  assert.throws(() => Config.parse({ monitorIntervalMs: 0 }));
  assert.throws(() => Config.parse({ tiers: { heavy: { provider: '', model: 'x' } } }));
  assert.deepEqual(Config.parse({ tiers: projectTiers }).tiers, projectTiers);
  await assert.rejects(apply({}, { maxPosts: 0 }));
});

test('工具仅在 Swarm 成员作用域安装，身份上下文必需，卸载清理', async () => {
  const f = fixture(); await apply(f.ctx); await f.swarm();
  assert.equal(f.other.tools.size, 0);
  assert.equal(f.root.tools.size, 12);
  assert.equal(f.root.tools.has('send_message'), false);
  assert.equal(f.root.contexts.get('swarm:identity').required, true);
  assert.match(f.root.contexts.get('swarm:identity').text(), /lead/);
  assert.equal(f.contribution.invocations[0].id, '@local/dsh-swarm#swarmBoard/call');
  assert.equal((await f.call({ action: 'view', sessionId: 'other' })).data.swarmId, null);
  await f.close();
  assert.equal(f.root.tools.size, 0);
  assert.equal(f.root.contexts.size, 0);
  assert.equal(f.closed, true);
});

test('普通对话中 /swarm-mode 原地启用，追加任务只投递一次并复用队伍', async () => {
  const f = fixture(); await apply(f.ctx);
  assert.equal(f.ctx.command.name, 'swarm-mode');
  assert.equal(f.root.tools.size, 0);
  await f.swarm();
  const first = await f.call({ action: 'view' });
  await f.tool(f.root, 'spawn_teammate', { name:'reader', description:'检查', prompt:'查看入口' });
  await f.swarm(f.root, '  继续前面的问题  ');
  assert.deepEqual(f.steered.map(x => [x.id, x.message.content[0].text]), [['root','继续前面的问题']]);
  const second = await f.call({ action:'view' });
  assert.equal(second.data.swarmId, first.data.swarmId);
  assert.equal(second.data.members.length, 2);
  assert.equal(f.other.tools.size, 0);
  assert.equal((await f.swarm(f.live.get(f.roster[0].id))).kind, 'error');
  await f.close();
});

test('移除成员：中断并释放、进 Retired、不再被点名，协调者不可移除', async () => {
  const f = fixture(); await apply(f.ctx); await f.swarm();
  const spawned = await f.tool(f.root, 'spawn_teammate', { name: 'fix-1', description: '实现', prompt: '完成' });
  const child = f.live.get(spawned.data.member.sessionId);
  child.status = 'running';
  const denied = await f.tool(child, 'remove_teammate', { target: 'fix-1' });
  assert.equal(denied.error.code, 'LEAD_REQUIRED');
  const removed = await f.tool(f.root, 'remove_teammate', { target: 'fix-1' });
  assert.equal(removed.ok, true, JSON.stringify(removed));
  assert.equal(removed.data.retired, true);
  assert.deepEqual(f.interrupted, ['fix-1'], '运行中先中断');
  assert.deepEqual(f.drained, [child.id], '释放活动子代理');
  const view = await f.call({ action: 'view' });
  assert.equal(view.data.members.find(m => m.name === 'fix-1').retired, true);
  const direct = await f.tool(f.root, 'board_post', { to: ['fix-1'], body: '继续' });
  assert.equal(direct.error.code, 'MEMBER_RETIRED');
  const group = await f.tool(f.root, 'board_post', { to: ['fix'], body: '继续' });
  assert.equal(group.error.code, 'UNKNOWN_MENTION', '组点名跳过已移除成员');
  const again = await f.call({ action: 'remove', member: 'fix-1' });
  assert.equal(again.ok, true, '重复移除是空操作');
  assert.equal(f.drained.length, 1);
  assert.equal((await f.call({ action: 'remove', member: 'lead' })).error.code, 'LEAD_REMOVE_FORBIDDEN');
  await f.close();
});

test('无配置时继承当前协调者，可按 playbook 指定路由且不影响其他成员', async () => {
  const f = fixture(); await apply(f.ctx); await f.swarm();
  const lead = { provider: 'host', model: 'selected', reasoningEffort: 'medium' };
  f.root.model.select(lead);
  const spawn = (name, choice) => f.tool(f.root, 'spawn_teammate', { name, description: name, prompt: 'check', ...choice });
  const inherited = await spawn('one');
  assert.equal(inherited.ok, true, JSON.stringify(inherited));
  assert.deepEqual(f.live.get(inherited.data.member.sessionId).model.current(), lead);
  const override = await spawn('two', { route: projectTiers.review });
  assert.deepEqual(f.live.get(override.data.member.sessionId).model.current(), projectTiers.review);
  assert.equal((await spawn('bad', { tier: 'unknown' })).error.code, 'UNKNOWN_TIER');
  assert.equal((await spawn('both', { tier: 'any', route: projectTiers.review })).error.code, 'INVALID_INPUT');
  assert.deepEqual(f.root.model.current(), lead);
  assert.equal(f.roster.length, 2);
  assert.deepEqual((await f.call({action:'view'})).data.tiers, {});
  await f.close();
});

test('创建前记录档位，创建事件选择模型，brief 只落盘，重启后可读档位', async () => {
  const f = fixture(); await apply(f.ctx, { tiers: projectTiers }); await f.swarm();
  const result = await f.tool(f.root, 'spawn_teammate', { name: 'fix-1', description: '实现模块', prompt: '完成任务', tier: 'analysis' });
  assert.equal(result.ok, true, JSON.stringify(result));
  const child = f.live.get(result.data.member.sessionId);
  assert.equal(child.tools.size, 12);
  assert.equal(f.sent.length, 0);
  assert.equal(result.data.brief.kind, 'brief');
  assert.equal(result.data.member.tier, 'analysis');
  const denied = await f.tool(child, 'set_teammate_model', { target: 'fix-1', tier: 'review' });
  assert.equal(denied.error.code, 'LEAD_REQUIRED');
  const changed = await f.call({ action: 'setModel', member: 'fix-1', tier: 'review' });
  assert.equal(changed.ok, true);
  assert.deepEqual(child.model.current(), projectTiers.review);
  assert.equal((await f.call({ action: 'setModel', member: 'lead', tier: 'review' })).error.code, 'LEAD_MODEL_FORBIDDEN');
  f.live.delete(child.id); await f.emit('agent/disposed', child);
  assert.equal(child.tools.size, 0);
  assert.equal((await f.call({ action: 'setModel', member: 'fix-1', tier: 'review' })).error.code, 'MEMBER_NOT_LIVE');
  f.live.delete(f.root.id); await f.emit('agent/disposed', f.root);
  await f.close();
  await apply(f.ctx);
  const cold = await f.call({ action: 'view', sessionId: child.id });
  assert.equal(cold.data.live, false);
  assert.equal(cold.data.members.find(m => m.name === 'fix-1').tier, 'review');
  assert.equal(cold.data.members.find(m => m.name === 'fix-1').model, projectTiers.review.model);
  await f.close();
});

test('先持久化再投递，未知点名不写入，失败不回滚，面板可唤醒 lead 与成员', async () => {
  const f = fixture(); await apply(f.ctx); await f.swarm();
  f.rows.get('root').members.push({ sessionId: 'broken-id', name: 'broken', role: 'teammate', status: 'inactive' });
  const before = f.ctx.subagents.sendMessage;
  f.ctx.subagents.sendMessage = async (...args) => {
    assert.equal(f.rows.get('root').posts.at(-1).body, '请检查');
    return before(...args);
  };
  const failed = await f.tool(f.root, 'board_post', { to: ['broken'], body: '请检查' });
  assert.equal(failed.ok, true);
  assert.equal(failed.data.failedRecipients[0].target, 'broken');
  assert.equal(f.rows.get('root').posts.length, 1);
  const unknown = await f.call({ action: 'post', to: ['missing'], body: '请检查' });
  assert.equal(unknown.error.code, 'UNKNOWN_MENTION');
  assert.equal(f.rows.get('root').posts.length, 1);
  const human = await f.call({ action: 'post', to: ['lead'], body: '请继续' });
  assert.equal(human.data.failedRecipients.length, 0);
  assert.match(f.steered[0].message.content[0].text, /^Board #2 from user to lead:\n请继续$/);
  f.rows.get('root').members.push({ sessionId: 'worker-id', name: 'worker', role: 'teammate', status: 'inactive' });
  const peer = await f.call({ action: 'post', to: ['worker'], body: '请检查' });
  assert.deepEqual(peer.data.failedRecipients, []);
  assert.equal(f.sent[0].caller, 'root');
  assert.match(f.sent[0].content[0].text, /from user to worker/);
  await f.close();
});

test('监控定时器落帖并唤醒 lead，未有新帖不重复，卸载后停止', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1000 });
  const f = fixture();
  await apply(f.ctx, { monitorIdleMs: 90000, monitorIntervalMs: 30000 }); await f.swarm();
  f.tasks.push({ id: 'task-1', subject: '实现接口', status: 'pending', ready: true });
  t.mock.timers.tick(120000);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.rows.get('root').posts.length, 1);
  assert.equal(f.rows.get('root').posts[0].from, 'monitor');
  assert.match(f.steered[0].message.content[0].text, /from monitor to lead/);
  t.mock.timers.tick(180000);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.rows.get('root').posts.length, 1);
  await f.call({ action: 'post', to: [], body: '已检查，仍有阻塞' });
  t.mock.timers.tick(120000);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.rows.get('root').posts.filter(p => p.from === 'monitor').length, 2);
  await f.close();
  t.mock.timers.tick(300000);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.steered.length, 2);
});

test('同一 Swarm 并发写入不丢帖子，裁剪之后序号仍连续', async () => {
  const f = fixture();
  const store = new BoardStore(f.table);
  await Promise.all(Array.from({ length: 30 }, (_, i) => store.change('root', async board => {
    await Promise.resolve();
    const next = appendPost(board, { from: 'lead', to: [], mentions: [], body: String(i) }, 10);
    return { board: next.board };
  })));
  assert.equal(store.read('root').nextSeq, 31);
  assert.deepEqual(store.read('root').posts.map(p => p.seq), Array.from({ length: 10 }, (_, i) => i + 21));
  await store.close();
  await assert.rejects(store.change('root', () => {}), { code: 'DISPOSED' });
});
