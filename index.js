import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { remoteDescriptor } from './remote.js';
import { BoardStore, domainSpec, routeSchema, tierSchema } from './lib/storage.js';
import { SwarmRuntime } from './lib/runtime.js';
import { failure, installTools } from './lib/tools.js';

export const name = 'local-swarm';
export const inject = ['agents', 'agentTeams', 'commands', 'subagents', 'storageDomain', 'typert', 'tools', 'systemPrompt'];
export const Config = z.object({
  tiers: z.record(tierSchema, routeSchema).default({}),
  monitorIdleMs: z.number().int().positive().max(2147483647).default(90000),
  monitorIntervalMs: z.number().int().positive().max(2147483647).default(30000),
  maxPosts: z.number().int().min(1).max(2000).default(2000),
}).strict();
const sessionId = z.string().min(1).max(200);
const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('view'), sessionId, afterSeq: z.number().int().nonnegative().optional() }).strict(),
  z.object({ action: z.literal('setModel'), sessionId, member: z.string().min(1).max(64), tier: tierSchema }).strict(),
  z.object({ action: z.literal('post'), sessionId, to: z.array(z.string().min(1).max(64)).max(64), body: z.string().min(1).max(16000) }).strict(),
  z.object({ action: z.literal('remove'), sessionId, member: z.string().min(1).max(64) }).strict(),
]);

export async function apply(ctx, config = {}) {
  const resolved = Config.parse(config);
  const domain = await ctx.storageDomain.open(domainSpec);
  const runtime = new SwarmRuntime(ctx, new BoardStore(domain.table('boards')), resolved);
  const installed = new Map();
  let timer, ticking;
  ctx.effect(() => async () => {
    clearInterval(timer);
    for (const { dispose } of installed.values()) dispose();
    installed.clear();
    await runtime.close();
    await domain.close();
  });
  const installing = new Map();
  const install = async agent => {
    if (installed.has(agent) || !runtime.membership(agent)) return;
    await runtime.created(agent);
    if (runtime.controller.signal.aborted || ctx.agents.get(agent.id) !== agent) return;
    const swarmId = runtime.requireMember(agent).root.id;
    installed.set(agent, { swarmId, dispose: installTools(agent, runtime) });
  };
  const maybeInstall = agent => {
    if (installing.has(agent)) return installing.get(agent);
    const operation = install(agent).finally(() => installing.delete(agent));
    installing.set(agent, operation);
    return operation;
  };
  const uninstall = agent => {
    const entry = installed.get(agent);
    entry?.dispose();
    installed.delete(agent);
    if (entry) runtime.statusAt.set(entry.swarmId, Date.now());
  };
  ctx.on('agent/created', async ({ agent }) => { await runtime.run(() => maybeInstall(agent)); });
  ctx.effect(() => ctx.commands.register({
    definitionId: '@local/dsh-swarm#swarm', name: 'swarm-mode',
    description: '在当前会话启用 Swarm 协作或追加任务', input: { hint: '[任务]' },
    handler: ({ agent, rawInput, signal }) => runtime.run(async () => {
      if (ctx.subagents.rootOf(agent) !== agent) return { kind: 'error', text: '请在协调者的会话中使用 /swarm-mode。' };
      signal.throwIfAborted();
      if (!ctx.agentTeams.isEnabled(agent)) await ctx.agentTeams.setEnabled(agent, true, signal);
      if (!runtime.store.has(agent.id)) await runtime.refresh(agent);
      await maybeInstall(agent);
      signal.throwIfAborted();
      const task = rawInput.trim();
      if (task) agent.steer({ id: randomUUID(), role: 'user', content: [{ type: 'text', text: task }], source: { kind: 'user' } });
      return { kind: 'success', text: task ? '任务已交给当前会话的 Swarm 协调者。' : 'Swarm 已就绪。直接发消息即可派工。' };
    }),
  }));
  ctx.on('agent/disposed', ({ agent }) => uninstall(agent));
  ctx.on('agent/status', ({ agent }) => {
    const membership = runtime.membership(agent);
    if (!membership) return;
    runtime.statusAt.set(membership.root.id, Date.now());
    if (!installed.has(agent)) runtime.run(() => maybeInstall(agent)).catch(() => {});
  });
  for (const agent of ctx.agents.list()) await runtime.run(() => maybeInstall(agent));

  const remote = {
    async call(requestJson) {
      try {
        if (typeof requestJson !== 'string' || requestJson.length > 65536) throw new Error('请求过大或格式错误');
        const request = requestSchema.parse(JSON.parse(requestJson));
        const data = await runtime.run(() => {
          if (request.action === 'view') return runtime.view(request.sessionId, request.afterSeq);
          if (request.action === 'setModel') return runtime.setModel(request.sessionId, request.member, request.tier);
          if (request.action === 'remove') return runtime.removeMember(request.sessionId, request.member);
          return runtime.remotePost(request.sessionId, request.to, request.body);
        });
        return JSON.stringify({ ok: true, data });
      } catch (error) { return JSON.stringify(failure(error)); }
    },
  };
  remote.typertRemote = Object.freeze({ service: remote, serviceKey: 'swarmBoard', namespace: 'swarmBoard' });
  ctx.provide('swarmBoard', remote);
  ctx.effect(() => ctx.typert.register({
    package: '@local/dsh-swarm', face: 'host', schemas: [],
    model: { services: [{ key: 'swarmBoard', exportName: 'SwarmBoard', tags: [], description: 'Swarm 公共留言板与成员模型',
      members: [{ kind: 'method', name: 'call', signature: 'call(requestJson: string): Promise<string>' }], types: [] }], events: [], objects: [] },
    invocations: [remoteDescriptor(ctx.typert.local.get('commands/execute'))],
  }));
  ctx.effect(() => {
    timer = ctx.agents.withoutInitiator(() => setInterval(() => {
      if (ticking) return;
      ticking = runtime.run(() => runtime.tick()).catch(error => {
        if (!runtime.controller.signal.aborted) console.warn('Swarm 监控检查失败', error);
      }).finally(() => { ticking = undefined; });
    }, resolved.monitorIntervalMs));
    timer.unref?.();
    return () => clearInterval(timer);
  });
}
