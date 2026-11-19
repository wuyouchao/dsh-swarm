export const MAX_POSTS = 2000;
const TASK_STATUSES = ['pending', 'in_progress', 'completed'];
const MEMBER_GROUP = { running: 'active', provisioning: 'active', inactive: 'standby', failed: 'failed' };

export function lastSeq(posts) {
  return posts.length ? posts[posts.length - 1].seq : 0;
}

// A nextSeq at or below what we hold means the board was recreated; dropping the posts makes the next poll fetch it in full.
export function mergeView(state, view) {
  if (!view.swarmId) return null;
  const base = state?.swarmId === view.swarmId && view.nextSeq > lastSeq(state.posts) ? state.posts : [];
  const after = lastSeq(base);
  const fresh = view.posts.filter(p => p.seq > after).sort((a, b) => a.seq - b.seq);
  return { ...view, posts: fresh.length ? base.concat(fresh).slice(-MAX_POSTS) : base };
}

export function postInvolves(post, member) {
  return post.from === member || post.to.includes(member);
}

export function filterPosts(posts, { member = '', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return posts.filter(p => (!member || postInvolves(p, member))
    && (!q || p.body.toLowerCase().includes(q) || p.from.toLowerCase().includes(q) || p.to.some(n => n.toLowerCase().includes(q))));
}

export function newDividerSeq(posts, seenSeq) {
  if (seenSeq == null) return null;
  return posts.find(p => p.seq > seenSeq && p.from !== 'user')?.seq ?? null;
}

export function replayPosts(posts, cursor) {
  return cursor == null ? posts : posts.filter(p => p.seq <= cursor);
}

export function stepCursor(posts, cursor, delta) {
  if (!posts.length) return null;
  let index = cursor == null ? posts.length - 1 : posts.findIndex(p => p.seq >= cursor);
  if (index < 0) index = posts.length - 1;
  return posts[Math.max(0, Math.min(posts.length - 1, index + delta))].seq;
}

export function graphEdges(posts) {
  const edges = new Map();
  for (const post of posts) for (const to of post.to) {
    if (to === post.from) continue;
    const key = `${post.from}\u0000${to}`;
    const edge = edges.get(key);
    if (edge) { edge.count++; edge.lastSeq = post.seq; } else edges.set(key, { from: post.from, to, count: 1, lastSeq: post.seq });
  }
  return [...edges.values()];
}

export function graphNodes(members, edges) {
  const names = members.map(m => m.name);
  for (const edge of edges) for (const name of [edge.from, edge.to]) if (!names.includes(name)) names.push(name);
  return names;
}

export function layoutGraph(names, lead, width) {
  const workers = names.filter(name => name !== lead);
  const positions = new Map();
  if (names.includes(lead)) positions.set(lead, { x: width / 2, y: 45 });
  workers.forEach((name, i) => {
    const column = i % 3, row = Math.floor(i / 3);
    const columns = Math.min(3, workers.length - row * 3);
    const x = width * (column + .5) / columns;
    const y = (positions.has(lead) ? 136 : 45) + row * 100 + (columns === 3 && column === 1 ? 34 : 0);
    positions.set(name, { x, y });
  });
  return positions;
}

export function beeVariant(name) {
  if (name === 'lead') return 'lead';
  if (name === 'user' || name === 'monitor') return null;
  let hash = 0;
  for (const char of name) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return ['mint', 'iris', 'sky', 'rose'][hash % 4];
}

export function groupMembers(members) {
  const groups = { lead: [], active: [], standby: [], failed: [], retired: [] };
  for (const member of members) {
    const group = member.role === 'lead' ? 'lead' : member.retired ? 'retired' : MEMBER_GROUP[member.status] ?? 'standby';
    groups[group].push(member);
  }
  return groups;
}

export function mentionsIn(body, names) {
  const found = [];
  for (const match of body.matchAll(/(?:^|[^\w@])@([a-z0-9][a-z0-9-]*)/gi)) {
    const name = match[1].toLowerCase();
    if ((name === 'all' || names.includes(name)) && !found.includes(name)) found.push(name);
  }
  return found;
}

export function toggleRecipient(to, name) {
  if (name === 'all') return to.includes('all') ? [] : ['all'];
  const rest = to.filter(n => n !== 'all');
  return rest.includes(name) ? rest.filter(n => n !== name) : [...rest, name];
}

function edgeGeometry(a, b, bend, radiusA, radiusB) {
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1, ux = dx / length, uy = dy / length;
  const sx = a.x + ux * radiusA, sy = a.y + uy * radiusA, ex = b.x - ux * (radiusB + 4), ey = b.y - uy * (radiusB + 4);
  const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
  return { d: `M${sx.toFixed(1)},${sy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`, lx: (sx + 2 * mx + ex) / 4, ly: (sy + 2 * my + ey) / 4 };
}

export default function pluginFactory(require) {
  const React = require('react');
  const { useState, useEffect, useRef, useMemo, useId, useSyncExternalStore } = React;
  const h = React.createElement;
  const id = '@local/dsh-swarm', kind = 'swarm';
  const swarmIds = new Map();
  const seen = {
    get(swarmId) { try { const v = localStorage.getItem(`${id}:seen:${swarmId}`); return v == null ? undefined : Number(v); } catch { return undefined; } },
    set(swarmId, seq) { try { localStorage.setItem(`${id}:seen:${swarmId}`, String(seq)); } catch {} },
  };
  function Icon({ size = 18, name = 'lead' }) {
    const variant = beeVariant(name);
    if (!variant) return h(Glyph, { name, size });
    return h('img', { src: bees[variant], alt: '', width: size, height: size, className: 'sw-bee' });
  }
  function Glyph({ name, size = 16 }) {
    const paths = {
      user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0', monitor: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0',
      search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', refresh: 'M20 7v5h-5M4 17v-5h5M5.6 7a7 7 0 0 1 11.6-2L20 8M4 16l2.8 3A7 7 0 0 0 18.4 17',
      prev: 'M15 6l-6 6 6 6', next: 'M9 6l6 6-6 6', play: 'M7 5l12 7-12 7z', pause: 'M8 5v14M16 5v14', down: 'M12 5v14M6 13l6 6 6-6',
      send: 'M4 12l16-8-6 16-2-7z', live: 'M12 12h.01M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8',
    };
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: paths[name] }));
  }
  const button = (label, onClick, props = {}) => h('button', { type: 'button', onClick, ...props }, label);
  return {
    inject: ['slots', 'sidebarRightTabs', 'sidebarRight', 'remote', 'typert', 'locale', 'uiWorkspace'],
    apply(ctx) {
      ctx.effect(() => ctx.locale.register('localSwarm', 'zh', dictionaries.zh));
      ctx.effect(() => ctx.locale.register('localSwarm', 'en', dictionaries.en));
      const t = ctx.locale.bind('localSwarm');
      const descriptor = remoteDescriptor(ctx.typert.remotes.get('commands/execute'));
      ctx.effect(() => ctx.remote.$mount({ package: id, descriptors: [descriptor] }));
      ctx.inject(['remote.swarmBoard'], ctx => {
        function useText() {
          useSyncExternalStore(fn => ctx.locale.subscribe(fn), () => ctx.locale.getSnapshot());
          return t;
        }
        async function call(request) {
          const rpc = await ctx.remote.swarmBoard.call(JSON.stringify(request));
          if (!rpc?.ok) throw new Error(rpc?.error?.message || t('network'));
          const response = JSON.parse(rpc.value);
          if (!response.ok) throw Object.assign(new Error(response.error.message), { code: response.error.code });
          return response.data;
        }
        const iconButton = (name, label, onClick, props = {}) => button(h(Glyph, { name }), onClick, { className: 'sw-icon-button', title: label, 'aria-label': label, ...props });
        const memberLabel = name => name === 'user' ? t('user') : name === 'monitor' ? t('monitor') : name === 'all' ? t('everyone') : name;
        const time = at => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const statusDot = status => h('span', { className: `sw-dot sw-${status}`, 'aria-hidden': true });

        function Header({ sessionId }) {
          useText();
          const [swarmId, setSwarmId] = useState(() => swarmIds.get(sessionId) ?? null);
          useEffect(() => {
            if (!sessionId) return;
            let cancelled = false, timer;
            async function probe() {
              try {
                const view = await call({ action: 'view', sessionId, afterSeq: Number.MAX_SAFE_INTEGER });
                if (cancelled) return;
                swarmIds.set(sessionId, view.swarmId);
                setSwarmId(view.swarmId);
                if (view.swarmId) return;
              } catch { if (cancelled) return; }
              timer = setTimeout(probe, 15000);
            }
            probe();
            return () => { cancelled = true; clearTimeout(timer); };
          }, [sessionId]);
          if (!swarmId) return null;
          return h(React.Fragment, null, h('style', null, css),
            button(h(React.Fragment, null, h(Icon, { size: 14 }), h('span', { className: 'sw-trigger-label' }, t('panel'))), () => ctx.sidebarRight.openTab(kind), { className: 'sw-trigger', title: t('open'), 'aria-label': t('open') }));
        }

        function PostItem({ post, onMember }) {
          const [open, setOpen] = useState(false);
          const long = post.body.length > 600 || post.body.split('\n').length > 10;
          return h('article', { className: 'sw-post', 'data-kind': post.kind },
            h('span', { className: 'sw-avatar' }, h(Icon, { name: post.from, size: 28 })),
            h('header', { className: 'sw-post-head' },
              h('span', { className: 'sw-seq' }, `#${post.seq}`),
              button(memberLabel(post.from), () => onMember(post.from), { className: 'sw-name', title: `${t('filterMember')} · ${memberLabel(post.from)}` }),
              h('span', { className: 'sw-arrow', 'aria-hidden': true }, '→'),
              post.to.length ? h('span', { className: 'sw-to' }, ...post.to.map((name, i) => h(React.Fragment, { key: name }, i ? ', ' : '', button(memberLabel(name), () => onMember(name), { className: 'sw-name sw-name-to' }))))
                : h('span', { className: 'sw-to sw-muted' }, t('boardOnly')),
              post.kind !== 'message' ? h('span', { className: 'sw-kind' }, t(`kind_${post.kind}`)) : null,
              h('time', { className: 'sw-time', dateTime: post.at, title: new Date(post.at).toLocaleString() }, time(post.at))),
            h('div', { className: `sw-body ${long && !open ? 'sw-clamped' : ''}` }, post.body),
            long ? button(t(open ? 'less' : 'more'), () => setOpen(v => !v), { className: 'sw-text-button' }) : null);
        }

        function BoardView({ data, looking, sessionId, onPosted, member, setMember }) {
          const [query, setQuery] = useState('');
          const [follow, setFollow] = useState(true);
          const [atBottom, setAtBottom] = useState(true);
          const [divider, setDivider] = useState(null);
          const [to, setTo] = useState(['lead']);
          const [body, setBody] = useState('');
          const [sending, setSending] = useState(false);
          const [sendError, setSendError] = useState('');
          const feed = useRef(null);
          const posts = data.posts;
          const latest = lastSeq(posts);
          const reading = follow || atBottom;
          useEffect(() => {
            if (looking) setDivider(newDividerSeq(posts, seen.get(data.swarmId)));
          }, [looking, data.swarmId]);
          useEffect(() => {
            if (!looking) return;
            if (reading) seen.set(data.swarmId, latest);
            else setDivider(d => d ?? newDividerSeq(posts, seen.get(data.swarmId)));
          }, [looking, latest, reading, data.swarmId]);
          const shown = useMemo(() => filterPosts(posts, { member, query }), [posts, member, query]);
          useEffect(() => {
            const el = feed.current;
            if (follow && looking && el) el.scrollTop = el.scrollHeight;
          }, [follow, looking, shown]);
          const names = useMemo(() => {
            const list = data.members.map(m => m.name);
            for (const p of posts) for (const n of [p.from, ...p.to]) if (!list.includes(n)) list.push(n);
            return list;
          }, [data.members, posts]);
          const unread = divider == null ? 0 : shown.filter(p => p.seq >= divider && p.from !== 'user').length;
          const dividerAt = divider == null ? -1 : shown.findIndex(p => p.seq >= divider);
          function onScroll(e) {
            const el = e.currentTarget;
            const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
            setAtBottom(bottom);
            if (!bottom && follow) setFollow(false);
          }
          function jumpToLatest() { setFollow(true); setDivider(null); }
          async function send(event) {
            event?.preventDefault();
            const recipientsNow = targets();
            if (sending || !recipientsNow.length || !body.trim()) return;
            setSending(true); setSendError('');
            try { await call({ action: 'post', sessionId, to: recipientsNow, body }); setBody(''); setFollow(true); onPosted(); }
            catch (e) { setSendError(e.message); }
            finally { setSending(false); }
          }
          const recipients = ['all', ...data.members.filter(m => m.status !== 'failed' && !m.retired).map(m => m.name)];
          const typed = mentionsIn(body, recipients);
          const targets = () => to.includes('all') || typed.includes('all') ? ['all'] : [...new Set([...to, ...typed])];
          const effective = targets();
          const narrowed = !!member || !!query.trim();
          return h('div', { className: 'sw-board' },
            h('div', { className: 'sw-toolbar' },
              h('label', { className: 'sw-search' }, h(Glyph, { name: 'search', size: 14 }), h('input', { type: 'search', value: query, placeholder: t('search'), 'aria-label': t('search'), onChange: e => setQuery(e.target.value) })),
              h('select', { className: 'sw-member-filter', value: member, 'aria-label': t('filterMember'), onChange: e => setMember(e.target.value) },
                h('option', { value: '' }, t('allMembers')), ...names.map(n => h('option', { key: n, value: n }, memberLabel(n)))),
              h('label', { className: 'sw-check', title: t('followHint') }, h('input', { type: 'checkbox', checked: follow, onChange: e => setFollow(e.target.checked) }), t('follow'))),
            h('div', { className: 'sw-feed-wrap' },
              h('div', { ref: feed, className: 'sw-feed', onScroll, role: 'log', 'aria-live': 'polite', 'aria-label': t('board') },
                !posts.length ? h('div', { className: 'sw-empty' }, h(Icon, { size: 26 }), h('h3', null, t('emptyBoard')), h('p', null, t('emptyBoardHint'))) :
                  !shown.length ? h('div', { className: 'sw-empty' }, h('h3', null, t('noMatch')), button(t('clearFilters'), () => { setMember(''); setQuery(''); })) :
                    shown.map((post, i) => h(React.Fragment, { key: post.seq },
                      i === dividerAt ? h('div', { className: 'sw-divider', role: 'separator' }, h('span', null, `${t('newDivider')} · ${unread}`)) : null,
                      h(PostItem, { post, onMember: setMember })))),
              !follow && !atBottom && shown.length ? button(h(React.Fragment, null, h(Glyph, { name: 'down', size: 13 }), unread ? `${unread} ${t('newPosts')}` : t('jumpLatest')), jumpToLatest, { className: 'sw-jump' }) : null),
            narrowed ? h('div', { className: 'sw-filter-note' }, h('small', null, `${shown.length} / ${posts.length}`), button(t('clearFilters'), () => { setMember(''); setQuery(''); }, { className: 'sw-text-button' })) : null,
            h('form', { className: 'sw-composer', onSubmit: send },
              h('div', { className: 'sw-recipients', role: 'group', 'aria-label': t('to') },
                h('span', { className: 'sw-muted' }, t('to')),
                ...recipients.map(name => button(memberLabel(name), () => setTo(current => toggleRecipient(current, name)), { key: name, className: 'sw-chip', 'aria-pressed': effective.includes(name) }))),
              h('div', { className: 'sw-compose-row' },
                h('textarea', { rows: 2, maxLength: 16000, value: body, placeholder: t('composerPlaceholder'), 'aria-label': t('composerPlaceholder'), onChange: e => setBody(e.target.value),
                  onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) send(e); } }),
                button(h(React.Fragment, null, h(Glyph, { name: 'send', size: 14 }), h('span', null, t(sending ? 'sending' : 'send'))), null,
                  { type: 'submit', className: 'sw-primary', disabled: sending || !effective.length || !body.trim(), title: effective.length ? t('send') : t('chooseRecipients') })),
              sendError ? h('div', { role: 'alert', className: 'sw-error' }, sendError) : null));
        }

        function MemberRow({ member, data, sessionId, onChanged }) {
          const [pending, setPending] = useState(false);
          const [error, setError] = useState('');
          const latest = data.posts.filter(p => p.from === member.name).at(-1);
          const current = member.sessionId === sessionId;
          const [confirming, setConfirming] = useState(false);
          const inert = current || member.status === 'provisioning' || member.status === 'failed';
          async function remove() {
            setPending(true); setError('');
            try { await call({ action: 'remove', sessionId, member: member.name }); setConfirming(false); onChanged(); }
            catch (e) { setError(e.message); }
            finally { setPending(false); }
          }
          function open() {
            try {
              if (member.role === 'lead') ctx.uiWorkspace.openSession(data.swarmId);
              else ctx.uiWorkspace.openSession({ parentSessionId: data.swarmId, childSessionId: member.sessionId, mode: 'continuable' });
            } catch (e) { setError(String(e?.message || e)); }
          }
          async function changeTier(tier) {
            setPending(true); setError('');
            try { await call({ action: 'setModel', sessionId, member: member.name, tier }); onChanged(); }
            catch (e) { setError(e.code === 'MEMBER_NOT_LIVE' ? t('memberNotLive') : e.message); }
            finally { setPending(false); }
          }
          const tiers = Object.keys(data.tiers || {});
          const route = [member.tier, member.model].filter(Boolean).join(' · ');
          return h('div', { className: `sw-member ${current ? 'sw-member-current' : ''}`, 'data-status': member.status },
            button(h(React.Fragment, null,
              h('span', { className: 'sw-avatar' }, h(Icon, { name: member.name, size: member.role === 'lead' ? 44 : 32 })),
              h('span', { className: 'sw-member-line' }, statusDot(member.status), h('strong', null, member.name),
                member.role === 'lead' ? h('span', { className: 'sw-tag' }, t('lead')) : null,
                current ? h('span', { className: 'sw-tag sw-tag-current' }, t('current')) : null,
                h('small', { className: 'sw-member-status' }, t(`status_${member.status}`))),
              route ? h('small', { className: 'sw-member-route', title: member.provider ? `${member.provider} / ${member.model}` : route }, route) : null,
              member.description ? h('span', { className: 'sw-member-desc', title: member.description }, member.description) : null,
              h('span', { className: 'sw-member-latest' }, latest ? h(React.Fragment, null, h('span', { className: 'sw-seq' }, `#${latest.seq}`), ' ', latest.body.replace(/\s+/g, ' ').slice(0, 160)) : h('span', { className: 'sw-muted' }, t('noPosts')))),
              open, { className: 'sw-member-main', disabled: inert, title: inert ? undefined : t('openConversation') }),
            member.role === 'teammate' && !member.retired ? h('div', { className: 'sw-member-actions' },
              tiers.length ? h('select', { className: 'sw-tier-select', value: tiers.includes(member.tier) ? member.tier : '', disabled: !data.live || pending || member.status === 'failed', 'aria-label': `${member.name} ${t('setTier')}`, title: t('setTier'), onChange: e => changeTier(e.target.value) },
                h('option', { value: '', disabled: true }, member.tier || t('tier')), ...tiers.map(tier => h('option', { key: tier, value: tier }, tier))) : null,
              confirming
                ? h(React.Fragment, null, button(t('confirmRemove'), remove, { className: 'sw-danger', disabled: pending }), button(t('cancel'), () => setConfirming(false), { disabled: pending }))
                : button(t('remove'), () => setConfirming(true), { className: 'sw-text-button', disabled: pending, title: t('removeHint') })) : null,
            error ? h('div', { role: 'alert', className: 'sw-error sw-member-error' }, error) : null);
        }

        function MembersView({ data, sessionId, onChanged }) {
          const groups = groupMembers(data.members);
          const rows = members => members.map(m => h(MemberRow, { key: m.name, member: m, data, sessionId, onChanged }));
          const heading = (key, members) => h(React.Fragment, null, t(key), h('span', { className: 'sw-count' }, members.length));
          const section = (key, members) => !members.length ? null : key === 'retired'
            ? h('details', { key, className: 'sw-group sw-retired' }, h('summary', null, h('h3', null, heading(key, members))), ...rows(members))
            : h('section', { key, className: 'sw-group' }, key !== 'lead' ? h('h3', null, heading(key, members)) : null, ...rows(members));
          return h('div', { className: 'sw-scroll' },
            section('lead', groups.lead),
            h('section', { className: 'sw-tasks' }, h('h3', null, t('tasks'), h('span', { className: 'sw-count' }, data.tasks.length)),
              data.tasks.length ? h('ul', null, ...data.tasks.map(task => h('li', { key: task.id, className: 'sw-task', 'data-status': task.status },
                statusDot(`task-${task.status}${task.status === 'pending' && !task.ready ? '-blocked' : ''}`),
                h('span', { className: 'sw-task-subject', title: task.subject }, task.subject),
                h('small', null, TASK_STATUSES.includes(task.status) ? t(`task_${task.status}`) : task.status),
                h('small', { className: 'sw-task-owner' }, task.ownerName || t('unowned'))))) : h('p', { className: 'sw-muted' }, t('noTasks'))),
            section('active', groups.active), section('standby', groups.standby), section('failed', groups.failed), section('retired', groups.retired));
        }

        function GraphView({ data, visible, onMember }) {
          const [cursor, setCursor] = useState(null);
          const [playing, setPlaying] = useState(false);
          const marker = `sw-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
          const posts = data.posts;
          const seek = seq => setCursor(seq == null || seq >= lastSeq(posts) ? null : seq);
          useEffect(() => {
            if (!playing || !visible) return;
            if (cursor == null) { setPlaying(false); return; }
            const timer = setTimeout(() => seek(stepCursor(posts, cursor, 1)), 700);
            return () => clearTimeout(timer);
          }, [playing, visible, posts, cursor]);
          const cut = useMemo(() => replayPosts(posts, cursor), [posts, cursor]);
          const edges = useMemo(() => graphEdges(cut), [cut]);
          const nodes = useMemo(() => graphNodes(data.members, edges), [data.members, edges]);
          const lead = data.members.find(m => m.role === 'lead')?.name ?? 'lead';
          const width = 360;
          const positions = layoutGraph(nodes, lead, width);
          const height = Math.max(92, ...[...positions.values()].map(p => p.y + 42));
          const sent = new Map();
          for (const p of cut) sent.set(p.from, (sent.get(p.from) || 0) + 1);
          const radius = name => name === lead ? 23 : 16 + Math.min(4, Math.sqrt(sent.get(name) || 0));
          const focus = cut.at(-1);
          const status = new Map(data.members.map(m => [m.name, m.retired ? 'retired' : m.status]));
          const keys = new Set(edges.map(e => `${e.from}\u0000${e.to}`));
          function play() {
            if (playing) { setPlaying(false); return; }
            if (cursor == null) setCursor(posts[0].seq);
            setPlaying(true);
          }
          const index = cursor == null ? posts.length - 1 : posts.findIndex(p => p.seq >= cursor);
          return h('div', { className: 'sw-scroll sw-graph' },
            h('div', { className: 'sw-replay', role: 'group', 'aria-label': t('replay') },
              iconButton('prev', t('stepBack'), () => { setPlaying(false); seek(stepCursor(posts, cursor, -1)); }, { disabled: !posts.length || index <= 0 }),
              iconButton(playing ? 'pause' : 'play', t(playing ? 'pause' : 'play'), play, { disabled: posts.length < 2 }),
              iconButton('next', t('stepForward'), () => { setPlaying(false); seek(stepCursor(posts, cursor, 1)); }, { disabled: cursor == null }),
              h('input', { type: 'range', className: 'sw-range', min: 0, max: Math.max(0, posts.length - 1), value: Math.max(0, index), disabled: posts.length < 2, 'aria-label': t('replay'),
                onChange: e => { setPlaying(false); seek(posts[Number(e.target.value)]?.seq); } }),
              button(h(React.Fragment, null, h(Glyph, { name: 'live', size: 13 }), t('live')), () => { setPlaying(false); setCursor(null); }, { className: `sw-live ${cursor == null ? 'sw-live-on' : ''}`, 'aria-pressed': cursor == null })),
            h('small', { className: 'sw-replay-state' }, cursor == null ? `${t('live')} · ${posts.length} ${t('posts')}` : `${t('replayAt')} #${cursor} · ${index + 1} / ${posts.length}`),
            !edges.length ? h('div', { className: 'sw-empty sw-graph-empty' }, h(Icon, { size: 26 }), h('h3', null, t('graphEmpty'))) : null,
            h('svg', { className: 'sw-svg', viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': t('graph') },
              h('defs', null, ...['', '-hot'].map(suffix => h('marker', { key: suffix, id: marker + suffix, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' },
                h('path', { d: 'M0,0 L10,5 L0,10 z', className: `sw-marker${suffix}` })))),
              ...edges.map(edge => {
                const a = positions.get(edge.from), b = positions.get(edge.to);
                const hot = focus && focus.seq === edge.lastSeq;
                const geometry = edgeGeometry(a, b, keys.has(`${edge.to}\u0000${edge.from}`) ? 16 : 6, radius(edge.from), radius(edge.to));
                return h('g', { key: `${edge.from}>${edge.to}`, className: `sw-edge ${hot ? 'sw-edge-hot' : ''}` },
                  h('title', null, `${memberLabel(edge.from)} → ${memberLabel(edge.to)} · ${edge.count}`),
                  h('path', { d: geometry.d, strokeWidth: 1 + Math.min(4, Math.log2(edge.count + 1)), markerEnd: `url(#${marker}${hot ? '-hot' : ''})` }),
                  edge.count > 1 ? h('text', { x: geometry.lx, y: geometry.ly, className: 'sw-edge-label' }, edge.count) : null);
              }),
              ...nodes.map(name => {
                const p = positions.get(name), r = radius(name);
                return h('g', { key: name, className: `sw-node ${focus?.from === name ? 'sw-node-hot' : ''}`, 'data-status': status.get(name) || 'external' },
                  h('title', null, `${memberLabel(name)} · ${sent.get(name) || 0} ${t('posts')}`),
                  h('circle', { cx: p.x, cy: p.y, r }),
                  beeVariant(name)
                    ? h('image', { href: bees[beeVariant(name)], x: p.x - r + 2, y: p.y - r + 2, width: 2 * r - 4, height: 2 * r - 4, className: 'sw-bee' })
                    : h('g', { transform: `translate(${p.x - 9},${p.y - 9})` }, h(Glyph, { name, size: 18 })),
                  h('text', { x: p.x, y: name === lead ? p.y - r - 5 : p.y + r + 13, className: 'sw-node-label' }, name === lead ? t('lead') : memberLabel(name).length > 13 ? `${memberLabel(name).slice(0, 12)}…` : memberLabel(name)));
              })),
            focus ? h('div', { className: 'sw-focus' }, h(PostItem, { key: focus.seq, post: focus, onMember })) : null,
            h('p', { className: 'sw-muted sw-graph-hint' }, t('graphHint')));
        }

        function Panel({ sessionId, visible }) {
          useText();
          const [data, setData] = useState(undefined);
          const [error, setError] = useState('');
          const [view, setView] = useState('board');
          const [member, setMember] = useState('');
          function openMemberPosts(name) { setMember(name); setView('board'); }
          const [refresh, setRefresh] = useState(0);
          const dataRef = useRef(undefined);
          useEffect(() => {
            if (!visible || !sessionId) return;
            let cancelled = false, timer;
            async function load() {
              const after = lastSeq(dataRef.current?.posts ?? []);
              try {
                const result = await call({ action: 'view', sessionId, ...(after ? { afterSeq: after } : {}) });
                if (cancelled) return;
                const next = mergeView(dataRef.current, result);
                dataRef.current = next; setData(next); setError('');
                swarmIds.set(sessionId, next?.swarmId ?? null);
                timer = setTimeout(load, !next ? 10000 : result.posts.length >= 500 ? 0 : 2000);
              } catch (e) {
                if (cancelled) return;
                setError(e.message);
                timer = setTimeout(load, 2000);
              }
            }
            load();
            return () => { cancelled = true; clearTimeout(timer); };
          }, [sessionId, visible, refresh]);
          const reload = () => setRefresh(n => n + 1);
          const counts = data ? { board: data.posts.length, members: data.members.length, graph: null } : {};
          const running = data ? data.members.filter(m => m.status === 'running' || m.status === 'provisioning').length : 0;
          return h('section', { hidden: !visible, className: 'sw', 'aria-label': t('panel') }, h('style', null, css),
            h('div', { className: 'sw-shell' },
              h('header', { className: 'sw-header' },
                h('div', { className: 'sw-heading' }, h(Icon, { size: 18 }), h('h2', { title: data?.title || t('panel') }, data?.title || t('panel')),
                  data ? h('small', { className: 'sw-summary' }, `${running} / ${data.members.length} ${t('activeCount')}`) : null,
                  data && !data.live ? h('span', { className: 'sw-tag sw-tag-warn', title: t('notLiveHint') }, t('notLive')) : null),
                iconButton('refresh', t('refresh'), reload)),
              data ? h('div', { className: 'sw-segment', role: 'tablist', 'aria-label': t('panel') },
                ...['board', 'members', 'graph'].map(key => button(h(React.Fragment, null, t(key), counts[key] != null ? h('span', { className: 'sw-count' }, counts[key]) : null), () => setView(key),
                  { key, role: 'tab', 'aria-selected': view === key, 'aria-pressed': view === key }))) : null,
              error ? h('div', { role: 'alert', className: 'sw-error' }, h('span', null, error), button(t('retry'), reload)) : null,
              data === undefined ? h('div', { className: 'sw-empty' }, h(Icon, { size: 26 }), h('p', null, error ? t('network') : t('loading'))) :
                data === null ? h('div', { className: 'sw-empty' }, h(Icon, { size: 26 }), h('h3', null, t('notSwarm')), h('p', null, t('notSwarmHint'))) :
                  h('div', { className: 'sw-content' },
                    view === 'board' ? h(BoardView, { data, looking: visible, sessionId, onPosted: reload, member, setMember }) : null,
                    view === 'members' ? h(MembersView, { data, sessionId, onChanged: reload }) : null,
                    view === 'graph' ? h(GraphView, { data, visible, onMember: openMemberPosts }) : null)));
        }

        const swarmTabs = new Set();
        ctx.on('command/executed', (sessionId, name, result) => {
          if (name !== 'swarm-mode' || result.kind !== 'success' || ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return;
          let existing;
          for (const entry of swarmTabs) {
            if (entry.sessionId !== sessionId) continue;
            if (entry.visible) return;
            existing = entry;
          }
          if (existing) existing.actions.openTab(kind);
          else ctx.sidebarRight.openTab(kind);
        });

        function Side(props) {
          const { tab } = props.useTabInfo();
          React.useLayoutEffect(() => {
            const entry = { sessionId: props.sessionId, visible: tab.visible, actions: tab.actions };
            swarmTabs.add(entry);
            return () => swarmTabs.delete(entry);
          }, [props.sessionId, tab.visible, tab.actions]);
          return h(Panel, { key: props.sessionId, sessionId: props.sessionId, visible: tab.visible });
        }
        ctx.effect(() => ctx.sidebarRightTabs.register({ id, kind, title: () => t('panel'), keepMounted: true,
          guide: [{ id: 'swarm', order: 66, title: () => t('panel'), description: () => t('subtitle'), icon: Icon }] }));
        ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({ name: 'conversation.session.header.actions', id: 'swarm', order: -20, label: () => t('panel') }, Header));
        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id }, Side));
      });
    },
  };
}
