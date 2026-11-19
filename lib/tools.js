import { swarmPolicy } from './policy.js';
import { z } from 'zod';
import { slicePosts } from './board.js';
import { tierSchema, routeSchema } from './storage.js';

const text = max => z.string().min(1).max(max);
const optional = schema => schema.nullish().transform(value => value ?? undefined);
const strings = z.array(z.string());
const schema = fields => z.object(fields).strict();
const empty = schema({});
const target = text(64);
const taskFields = {
  subject: optional(text(200)), description: optional(text(16384)),
  blocked_by: optional(strings), write_scopes: optional(strings), owner: optional(z.string()),
};
export function failure(error) {
  return { ok: false, error: { code: error instanceof z.ZodError ? 'INVALID_INPUT' : error.code ?? 'FAILED',
    message: error instanceof z.ZodError ? `参数无效：${error.issues.map(i => i.path.join('.')).join('、')}` : error.message ?? '操作失败' } };
}

export function installTools(agent, runtime) {
  const ctx = agent.ctx;
  const team = runtime.ctx.agentTeams;
  const disposers = [];
  const add = (name, description, input, execute, readOnly = false) => {
    if (ctx.tools.get(name, agent)) return;
    disposers.push(ctx.tools.register({
      name, description, parameters: z.toJSONSchema(input, { io: 'input' }),
      isConcurrencySafe: () => readOnly,
      async execute(args, exec) {
        try {
          return await runtime.run(async () => {
            if (exec.agent !== agent) throw new Error('调用者身份不匹配');
            runtime.requireMember(agent);
            const signal = AbortSignal.any([exec.signal, runtime.controller.signal]);
            return { ok: true, data: await execute(input.parse(args), signal) };
          });
        } catch (error) { return failure(error); }
      },
      output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
      presentCall: () => ({ card: 'generic', title: description.split('。')[0], kind: 'other' }),
    }));
  };
  let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; for (const stop of disposers.reverse()) stop(); };
  try {
    disposers.push(ctx.systemPrompt.section({ name: 'swarm:policy', order: ctx.systemPrompt.getSectionOrder('TEAM_POLICY'),
      text: swarmPolicy + '\n成员共享文件系统，拆分互不重叠的写入范围，并用任务依赖安排顺序。成员间只通过公共留言板沟通。inactive 只表示当前未执行，不代表任务完成。发帖成功只代表已受理；检查 failedRecipients 确认投递失败者。任务先读取当前 revision 再 claim。完成后 complete 并发 report，受阻时保持任务开放并点名 lead。等待前确认其他必要成员正在运行，否则先点名发帖唤醒。',
    }));
    disposers.push(ctx.systemPrompt.context({ name: 'swarm:identity', order: ctx.systemPrompt.getContextOrder('SUBAGENT_DELEGATION'), required: true,
      text: () => {
        const membership = runtime.requireMember(agent);
        return `你是 Swarm ${membership.root.id} 的${membership.role === 'lead' ? '协调者' : '成员'}，名字为 ${membership.name}。协调者名字为 lead。用 list_agents 查成员，用 board_post 的 to 指定成员名、组名或 all，支持 @ 前缀。用 board_read 查看公共留言。`;
      },
    }));
    const modelChoice = {
      tier: optional(tierSchema).describe(`可选的配置别名：${Object.keys(runtime.config.tiers).join('、') || '无'}。`),
      route: optional(routeSchema).describe('可按项目 playbook 提供模型路由；与 tier 互斥。省略两者继承协调者当前模型。'),
    };
    add('spawn_teammate', '创建命名成员并把任务书记录到公共留言板。仅协调者可用。', schema({
      name: target.describe('唯一的英文小写短横线名称，例如 fix-1。'), description: text(200), prompt: text(16000),
      ...modelChoice,
    }), (args, signal) => runtime.spawn(agent, args, signal));
    add('set_teammate_model', '切换已加载成员的模型档位。仅协调者可用，不能修改 lead。', schema({ target, ...modelChoice }), args => {
      runtime.requireMember(agent, true);
      return runtime.setModel(agent.id, args.target, args.tier, args.route);
    });
    add('remove_teammate', '永久移除成员：中断并释放它，之后不能再点名或恢复，名字也不能复用。仅协调者可用；移除前先确认它的改动已完成或不再需要。', schema({ target }), args => {
      runtime.requireMember(agent, true);
      return runtime.removeMember(agent.id, args.target);
    });
    add('board_post', '发布公共留言并唤醒点名成员，返回帖子与投递失败列表。', schema({
      to: z.array(target).max(64).describe('成员名、组名或 all；空数组只写板不唤醒。'), body: text(16000),
      kind: optional(z.enum(['message', 'report'])).describe('默认 message；完成或验证结果用 report。'),
    }), (args, signal) => {
      const membership = runtime.requireMember(agent);
      return runtime.post(membership.root, membership.name, args.to, args.body, args.kind ?? 'message', agent, signal);
    });
    add('board_read', '读取公共留言板，返回有序帖子和下一序号。', schema({
      after_seq: optional(z.number().int().nonnegative()).describe('只读该序号之后的帖子；不填读取最近帖子。'),
      limit: optional(z.number().int().min(1).max(200)).describe('默认 50，最多 200 条。'),
    }), args => {
      const membership = runtime.requireMember(agent);
      const board = runtime.store.read(membership.root.id);
      return { posts: slicePosts(board, { afterSeq: args.after_seq, limit: args.limit ?? 50 }), nextSeq: board.nextSeq };
    }, true);
    add('list_agents', '列出成员身份、状态、档位与当前模型。', empty, async () => (await runtime.view(agent.id)).members.map(member => ({ ...member, target: member.name })), true);
    add('wait_agent', '等待后续团队变化；没有运行中的其他成员时立即返回 noProgress，不会唤醒成员。', schema({
      timeout_ms: optional(z.number().int().min(10000).max(3600000)).describe('默认 30000 毫秒。'),
    }), (args, signal) => {
      const root = runtime.requireMember(agent).root;
      if (!runtime.snapshot(root, runtime.store.read(root.id)).members.some(m => m.sessionId !== agent.id && !m.retired && m.status === 'running')) return {
        timedOut: false, noProgress: { reason: 'no-active-peer', message: '其他成员均未运行，请先读取任务并通过留言板唤醒需要的成员。' },
      };
      return new Promise((resolve, reject) => {
        const finish = timedOut => {
          clearTimeout(timer);
          off();
          signal.removeEventListener('abort', abort);
          if (signal.aborted) reject(signal.reason);
          else resolve({ timedOut });
        };
        const abort = () => finish(false);
        const off = ctx.on('agent/inbox/inserted', ({ agent: recipient }) => { if (recipient === agent) finish(false); });
        const timer = setTimeout(() => finish(true), args.timeout_ms ?? 30000);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted || agent.inbox.nextStep.length) finish(false);
      });
    });
    add('interrupt_agent', '中断成员当前工作并保留待处理消息。仅协调者可用。', schema({ target }), (args, signal) => {
      runtime.requireMember(agent, true);
      return runtime.ctx.subagents.resolveName(agent, args.target, signal).then(id => {
        if (id === agent.id) throw new Error('不能中断协调者');
        runtime.ctx.subagents.interrupt(id, { kind: 'ancestor', agent });
        return { accepted: true };
      });
    });
    add('team_task_create', '创建未分配的共享任务。', schema({ subject: text(200), description: text(16384), blocked_by: optional(strings), write_scopes: optional(strings) }), async args => {
      const result = await team.createTask(agent, { subject: args.subject, description: args.description, blockedBy: args.blocked_by, writeScopes: args.write_scopes });
      await runtime.refresh(runtime.requireMember(agent).root);
      return result;
    });
    add('team_task_list', '列出共享任务及版本、依赖、负责人和可开始状态。', schema({
      status: optional(z.enum(['pending', 'in_progress', 'completed'])), owner: optional(z.string()).describe('成员名；unowned 表示未分配。'),
      ready: optional(z.boolean()), cursor: optional(z.number().int().nonnegative()), limit: optional(z.number().int().min(1).max(100)).describe('默认 50。'),
    }), args => {
      const tasks = team.listTasks(agent).filter(t => (args.status === undefined || args.status === t.status)
        && (args.owner === undefined || (args.owner === 'unowned' ? !t.ownerName : args.owner === t.ownerName))
        && (args.ready === undefined || args.ready === t.ready));
      const cursor = args.cursor ?? 0, limit = args.limit ?? 50;
      return { tasks: tasks.slice(cursor, cursor + limit), ...(cursor + limit < tasks.length ? { nextCursor: cursor + limit } : {}) };
    }, true);
    add('team_task_get', '读取共享任务最新详情及 revision。', schema({ task_id: text(200) }), args => team.getTask(agent, args.task_id), true);
    add('team_task_update', '用最新 revision 更新任务，权限由任务负责人和协调者角色决定。', schema({
      task_id: text(200), expected_revision: z.number().int().positive(),
      action: z.enum(['claim', 'release', 'edit', 'set_dependencies', 'complete', 'reopen', 'reassign', 'delete']), ...taskFields,
    }), async (args, signal) => {
      const request = { taskId: args.task_id, expectedRevision: args.expected_revision, action: args.action,
        subject: args.subject, description: args.description, blockedBy: args.blocked_by, writeScopes: args.write_scopes, owner: args.owner == null ? undefined : await runtime.ctx.subagents.resolveName(agent, args.owner, signal) };
      const result = await team.updateTask(agent, Object.fromEntries(Object.entries(request).filter(([, value]) => value !== undefined)));
      await runtime.refresh(runtime.requireMember(agent).root);
      return result;
    });
  } catch (error) { dispose(); throw error; }
  return dispose;
}
