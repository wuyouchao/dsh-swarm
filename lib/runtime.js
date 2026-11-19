import { randomUUID } from 'node:crypto';
import { appendPost, boardView, postText, resolveMentions, SwarmError } from './board.js';
import { monitorDecision } from './monitor.js';

const contentOf = text => [{ type: 'text', text }];
const fail = (code, message) => { throw new SwarmError(code, message); };

export class SwarmRuntime {
  constructor(ctx, store, config) {
    this.ctx = ctx; this.store = store; this.config = config;
    this.activations = new Map(); this.pending = new Map(); this.statusAt = new Map(); this.operations = new Set();
    this.controller = new AbortController();
  }
  run(operation) {
    if (this.controller.signal.aborted) return Promise.reject(new SwarmError('DISPOSED', 'Swarm 已卸载'));
    const promise = Promise.resolve().then(operation);
    this.operations.add(promise);
    promise.then(() => this.operations.delete(promise), () => this.operations.delete(promise));
    return promise;
  }
  membership(agent) {
    let root, name;
    try {
      root = this.ctx.subagents.rootOf(agent);
      name = this.ctx.subagents.namesOf(agent).self;
    } catch (error) {
      // The host publishes a new child's ownership after agent/created.
      if (error.code === 'UNAUTHORIZED') {
        const entry = [...this.pending.values()].find(p => p.id === agent.id);
        const parent = entry && this.ctx.agents.get(entry.swarmId);
        return parent ? { root: parent, role: 'teammate', name: entry.name } : undefined;
      }
      throw error;
    }
    if (!this.store.has(root.id)) return undefined;
    if (root !== agent && this.pending.get(`${root.id}/${name}`)?.id !== agent.id &&
        !this.store.read(root.id).members.some(m => m.sessionId === agent.id && !m.retired)) return undefined;
    return { root, name, role: root === agent ? 'lead' : 'teammate' };
  }
  requireMember(agent, leadOnly = false) {
    const member = agent && this.membership(agent);
    if (!member) fail('NOT_SWARM_MEMBER', '调用者不是当前 Swarm 成员');
    if (leadOnly && member.role !== 'lead') fail('LEAD_REQUIRED', '仅协调者可执行此操作');
    return member;
  }
  resolve(sessionId) {
    const live = this.ctx.agents.get(sessionId);
    if (live) {
      const membership = this.membership(live);
      if (!membership) return {};
      return { root: membership.root, board: this.store.read(membership.root.id) };
    }
    const board = this.store.find(sessionId);
    if (!board) return {};
    const root = this.ctx.agents.get(board.swarmId);
    return { board, root: root && this.membership(root)?.role === 'lead' ? root : undefined };
  }
  snapshot(root, board) {
    const rows = new Map(board.members.map(m => [m.sessionId, { id: m.sessionId, name: m.name, role: m.role, description: m.description }]));
    rows.set(root.id, { id: root.id, name: 'lead', role: 'lead' });
    for (const entry of this.pending.values()) {
      if (entry.swarmId === root.id && this.ctx.agents.get(entry.id)) rows.set(entry.id, { id: entry.id, name: entry.name, role: 'teammate', description: entry.description });
    }
    const members = [...rows.values()].map(row => {
      const saved = board.members.find(m => m.sessionId === row.id);
      const live = this.ctx.agents.get(row.id);
      const selection = live?.model.current();
      return { name: row.name, role: row.role, status: live?.status === 'running' ? 'running' : 'inactive', sessionId: row.id,
        ...(row.description === undefined ? {} : { description: row.description }),
        ...(saved?.tier ? { tier: saved.tier } : {}),
        ...(selection?.provider ?? saved?.provider ? { provider: selection?.provider ?? saved.provider } : {}),
        ...(selection?.model ?? saved?.model ? { model: selection?.model ?? saved.model } : {}),
        ...(saved?.lastPostSeq ? { lastPostSeq: saved.lastPostSeq } : {}),
        ...(saved?.retired ? { retired: true } : {}),
      };
    });
    if (members.length !== board.members.length || members.some(m => board.members.find(old => old.sessionId === m.sessionId)?.status !== m.status)) {
      this.statusAt.set(root.id, Date.now());
    }
    const tasks = this.ctx.agentTeams.listTasks(root).map(({ id, subject, status, ownerName, ready }) => ({ id, subject, status, ready, ...(ownerName === undefined ? {} : { ownerName }) }));
    return { ...board, members, tasks };
  }
  async refresh(root) {
    return this.store.change(root.id, board => {
      const next = this.snapshot(root, board);
      const changed = JSON.stringify(next) !== JSON.stringify(board);
      return { board: changed ? next : board, value: next };
    });
  }
  async created(agent) {
    const membership = this.membership(agent);
    if (!membership) return false;
    const swarmId = membership.root.id;
    if (membership.role === 'lead' && !this.ctx.agentTeams.isEnabled(agent)) await this.ctx.agentTeams.setEnabled(agent, true, this.controller.signal);
    this.statusAt.set(swarmId, Date.now());
    const pending = this.pending.get(`${swarmId}/${membership.name}`);
    if (membership.role === 'teammate' && pending) {
      // The activation supplies the initial model before the child starts.
      await this.store.change(swarmId, board => {
        const next = this.snapshot(membership.root, board);
        next.members = next.members.map(m => m.sessionId === agent.id ? { ...m, tier: pending.tier } : m);
        return { board: next };
      });
    } else await this.refresh(membership.root);
    return true;
  }
  async spawn(caller, input, signal) {
    const membership = this.requireMember(caller, true);
    const key = `${membership.root.id}/${input.name}`;
    if (this.pending.has(key)) fail('NAME_PENDING', '该成员正在创建');
    if (['all', 'monitor', 'user'].includes(input.name)) fail('INVALID_NAME', '该名称保留给广播或系统身份');
    const id = randomUUID();
    if (this.store.read(caller.id).members.some(m => m.name === input.name)) fail('NAME_TAKEN', '成员名已使用');
    const route = this.memberRoute(caller, input.tier, input.route);
    this.pending.set(key, { id, swarmId: membership.root.id, ...input });
    try {
      const service = this.ctx.subagents;
      const activation = await service.startActivation({ childId: id, parent: caller, provider: 'spawn', label: input.description,
        name: input.name, prompt: contentOf(input.prompt), agentOptions: route,
        maxDepth: service.resolveMaxDepth(), signal, delivery: 'caller' });
      this.activations.set(id, activation);
      activation.result.catch(error => console.warn('Swarm 成员运行失败', error)).finally(() => this.activations.delete(id));
      await this.store.change(caller.id, board => {
        const next = this.snapshot(caller, board);
        next.members = next.members.map(m => m.sessionId === id ? { ...m, tier: input.tier } : m);
        if (!next.members.some(m => m.sessionId === id)) next.members.push({ sessionId: id, name: input.name, role: 'teammate', status: 'inactive', tier: input.tier, description: input.description });
        return { board: next };
      });
      const brief = await this.post(membership.root, 'lead', [input.name], input.prompt, 'brief', undefined, signal, false);
      const member = this.store.read(membership.root.id).members.find(m => m.sessionId === id);
      return { member, brief: brief.post };
    } finally {
      this.pending.delete(key);
      await this.refresh(membership.root);
    }
  }
  memberRoute(root, tier, route) {
    if (tier && route) fail('INVALID_INPUT', '请选择档位或模型路由之一');
    if (tier && !Object.hasOwn(this.config.tiers, tier)) fail('UNKNOWN_TIER', `未配置档位 ${tier}`);
    const selected = tier ? this.config.tiers[tier] : route ?? root.model.current();
    if (!selected?.provider || !selected.model) fail('MODEL_REQUIRED', '请先为协调者选择模型');
    return selected;
  }
  async setModel(sessionId, target, tier, route) {
    const { root, board } = this.resolve(sessionId);
    if (target === 'lead') fail('LEAD_MODEL_FORBIDDEN', '不能修改协调者模型');
    if (!root || !board) fail('MEMBER_NOT_LIVE', '成员尚未加载');
    return this.store.change(root.id, current => {
      const next = this.snapshot(root, current);
      const member = next.members.find(m => m.name === target && m.role === 'teammate');
      const live = member && this.ctx.agents.get(member.sessionId);
      if (!live || this.membership(live)?.root !== root) fail('MEMBER_NOT_LIVE', '成员尚未加载');
      const selected = this.memberRoute(root, tier, route);
      live.model.select(selected);
      const updated = { ...member, tier, provider: selected.provider, model: selected.model };
      next.members = next.members.map(m => m === member ? updated : m);
      return { board: next, value: updated };
    });
  }
  async removeMember(sessionId, target) {
    const { root, board } = this.resolve(sessionId);
    if (target === 'lead') fail('LEAD_REMOVE_FORBIDDEN', '不能移除协调者');
    if (!root || !board) fail('MEMBER_NOT_LIVE', '协调者尚未加载');
    const member = this.snapshot(root, board).members.find(m => m.name === target && m.role === 'teammate');
    if (!member) fail('MEMBER_NOT_FOUND', `没有成员 ${target}`);
    if (member.retired) return member;
    const live = this.ctx.agents.get(member.sessionId);
    if (live?.status === 'running') this.ctx.subagents.interrupt(member.sessionId, { kind: 'ancestor', agent: root });
    await this.activations.get(member.sessionId)?.dispose();
    const retired = { ...member, retired: true };
    await this.store.change(root.id, current => {
      const next = this.snapshot(root, current);
      next.members = next.members.map(m => m.sessionId === member.sessionId ? { ...m, retired: true } : m);
      return { board: next };
    });
    return retired;
  }
  async view(sessionId, afterSeq) {
    const { root, board } = this.resolve(sessionId);
    if (!board) return { swarmId: null, title: '', live: false, members: [], tasks: [], posts: [], nextSeq: 0, tiers: this.config.tiers };
    const current = root ? await this.refresh(root) : board;
    const members = root ? current.members : current.members.map(m => ({ ...m, status: m.status === 'failed' ? 'failed' : 'inactive' }));
    return boardView(current, { live: !!root, members, afterSeq, tiers: this.config.tiers });
  }
  async post(root, from, mentions, body, kind, caller, signal, deliver = true) {
    const post = await this.store.change(root.id, board => {
      const current = this.snapshot(root, board);
      const to = resolveMentions(mentions, current.members, from);
      const appended = appendPost(current, { from, to, mentions, body, kind }, this.config.maxPosts);
      return { board: appended.board, value: appended.post };
    });
    return { post, failedRecipients: deliver ? await this.deliver(root, post, caller, signal) : [] };
  }
  async deliver(root, post, caller, signal) {
    const failures = [];
    for (const target of post.to) {
      try {
        signal.throwIfAborted();
        if (!caller && target === 'lead') {
          if (this.ctx.agents.get(root.id) !== root) fail('MEMBER_NOT_LIVE', '协调者尚未加载');
          const message = Object.freeze({ id: randomUUID(), role: 'user',
            content: Object.freeze(contentOf(postText(post)).map(Object.freeze)), source: Object.freeze({ kind: 'user' }) });
          root.steer(message);
        } else {
          const member = this.store.read(root.id).members.find(m => m.name === target && !m.retired);
          if (!member) fail('MEMBER_NOT_FOUND', target);
          await this.ctx.subagents.sendMessage(caller ?? root, member.sessionId, contentOf(postText(post)), { signal });
        }
      } catch (error) { failures.push({ target, message: error.message }); }
    }
    return failures;
  }
  async remotePost(sessionId, to, body) {
    const { root } = this.resolve(sessionId);
    if (!root) fail('MEMBER_NOT_LIVE', '协调者尚未加载，无法发帖');
    return this.post(root, 'user', to, body, 'message', undefined, this.controller.signal);
  }
  async tick() {
    for (const root of this.ctx.agents.list()) {
      if (this.membership(root)?.role !== 'lead') continue;
      const post = await this.store.change(root.id, board => {
        const current = this.snapshot(root, board);
        const decision = monitorDecision({ ...current, now: Date.now(), idleMs: this.config.monitorIdleMs, lastStatusAt: this.statusAt.get(root.id) ?? Date.now() });
        if (!decision.post) return { board: { ...current, monitor: decision.monitor } };
        const appended = appendPost(current, decision.post, this.config.maxPosts);
        appended.board.monitor = { ...decision.monitor, lastSeq: appended.post.seq };
        return { board: appended.board, value: appended.post };
      });
      if (post) {
        const failed = await this.deliver(root, post, undefined, this.controller.signal);
        if (failed.length) console.warn('Swarm 监控投递失败', failed);
      }
    }
  }
  async close() {
    this.controller.abort();
    await Promise.allSettled([...this.operations]);
    await this.store.close();
  }
}
