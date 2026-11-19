# Swarm 插件契约

Host 与 Client 共用的数据形状和接口。两边只依赖本文件，不互相读实现。改契约先改这里。

## 角色与作用域

- 在顶层会话执行 `/swarm-mode [任务]` 启用协作。Lead 的持久看板标识已启用，只有 `spawn_teammate` 创建并登记的子会话加入队伍。重复命令复用看板和成员，任务文本送入当前会话。
- Swarm 以 Lead 会话 id 为主键，记为 `swarmId`。

## 成员模型

成员在创建时继承协调者当前的 provider、model 和 reasoningEffort。项目可通过派工参数 `route` 指定 `{ provider, model, reasoningEffort? }`，也可传入 `tier` 引用插件配置 `tiers` 中的路由别名。两者互斥。默认别名表为空。选模政策由用户和项目 playbook 维护。

创建成员使用 `startActivation.agentOptions`。运行中通过 `agent.model.select(route)` 切换单个成员的模型。视图里的 `Tier` 是别名字符串，`Route` 是上述模型选择对象。

## 留言板

```ts
interface Post {
  seq: number            // 从 1 开始，单个 swarm 内单调递增
  at: string             // ISO 时间
  from: string           // 成员名：'lead' | teammate 名 | 'monitor' | 'user'
  to: string[]           // 解析后的收件人成员名；空数组表示只发板不点名
  mentions: string[]     // 原始点名：成员名、组名（如 'fix'）或 'all'
  kind: 'brief' | 'message' | 'report' | 'monitor'
  body: string           // 最多 16000 字符
}
interface Board { swarmId: string; title: string; nextSeq: number; posts: Post[] }
```

- 存储：`ctx.storageDomain` domain `local_swarm_board`，per-record，表 `boards`，key 为 swarmId。不向会话日志写新事件类型。单个 board 最多保留 2000 帖，超出丢弃最早的。同一 swarm 的写入串行。
- 点名解析：`all` 为除发送者外所有 active 成员和 lead；精确名匹配成员；组名 `g` 匹配所有 `g-<数字>` 成员。收件人去重并去掉发送者。无法解析的点名使发帖失败。
- 投递：发帖先落盘，再对每个收件人调 `ctx.subagents.sendMessage(caller, targetId, content, {signal})` 唤醒。正文格式：`Board #<seq> from <from> to <to.join(', ')>:\n<body>`。投递失败不回滚帖子，在工具结果里列出失败的收件人。monitor 帖没有成员 Agent，用 Lead Agent 自身的唤醒机制投递。
- `spawn_teammate` 自动发一条 `kind: 'brief'` 帖（from lead，to 新成员），只落盘不投递，初始提示已由 spawn 送达。

## Host Remote

服务 key `swarmBoard`，namespace `swarmBoard`，单方法 `call(requestJson: string): Promise<string>`，Remote 描述符 id `@local/dsh-swarm#swarmBoard/call`，编码复用 `commands/execute` 的 strict string codec。响应一律为 `{ok: true, data}` 或 `{ok: false, error: {code, message}}` 的 JSON 字符串。

请求：

```ts
type Request =
  | { action: 'view'; sessionId: string; afterSeq?: number }   // sessionId 可以是 lead 或任一成员会话
  | { action: 'setModel'; sessionId: string; member: string; tier: Tier }
  | { action: 'post'; sessionId: string; to: string[]; body: string }  // 用户从面板发帖，from = 'user'
  | { action: 'remove'; sessionId: string; member: string }           // 永久移除成员，重复调用为空操作
```

`view` 返回：

```ts
interface SwarmView {
  swarmId: string | null           // 不是 swarm 会话时为 null，其余字段为空
  title: string
  live: boolean                    // lead Agent 是否已加载；未加载时 members 只有存储中的信息
  members: Array<{
    name: string; role: 'lead' | 'teammate'
    status: 'running' | 'inactive' | 'provisioning' | 'failed'
    sessionId: string; description?: string
    tier?: Tier; provider?: string; model?: string
    lastPostSeq?: number           // 该成员最后一帖
  }>
  tasks: Array<{ id: string; subject: string; status: string; ownerName?: string; ready: boolean }>
  posts: Post[]                    // seq > afterSeq 的帖子，最多 500 条
  nextSeq: number
  tiers: Record<Tier, Route>
}
```

`setModel` 与工具 `set_teammate_model` 调同一个 Host 方法，成员必须已加载，否则返回 `MEMBER_NOT_LIVE`。不允许改 lead。

## 模型可见工具

只安装在 Swarm 成员的 agent 作用域。任务交给 `ctx.agentTeams`，成员创建、点名和中断交给 `ctx.subagents`。

| 工具 | 谁可用 | 说明 |
|---|---|---|
| `spawn_teammate(name, description, prompt, tier?, route?)` | lead | 默认继承协调者，创建后自动发 brief 帖 |
| `set_teammate_model(target, tier?, route?)` | lead | 见 setModel |
| `remove_teammate(target)` | lead | 运行中先中断，再释放本次创建的活动实例；成员标记 `retired: true`，之后点名报 `MEMBER_RETIRED`，组名和 all 跳过它；名字不可复用 |
| `board_post(to, body, kind?)` | 所有成员 | kind 默认 message，可为 report |
| `board_read(after_seq?, limit?)` | 所有成员 | 默认最近 50 条，最多 200 |
| `list_agents()` | 所有成员 | 含 tier 与 model |
| `wait_agent(timeout_ms?)` | 所有成员 | 等待当前成员收件箱或超时 |
| `interrupt_agent(target)` | lead | 按祖先身份中断成员 |
| `team_task_create/list/get/update` | 所有成员 | 同 Agent Teams |

没有 `send_message`：成员之间只通过留言板交流。

## Monitor

Host 端定时检查，不是 LLM 成员。每 30 秒检查每个已加载的 swarm：存在未完成任务，且所有成员（含 lead）都不是 running/provisioning，且距最后一帖或最后一次成员状态变化超过 `monitorIdleMs`（默认 90000）时，发一条 `from: 'monitor', to: ['lead'], kind: 'monitor'` 帖并唤醒 lead，正文列出未完成任务。自上次 monitor 帖以来若无任何新帖，不再重复发；同一 swarm 连续最多 3 次。
