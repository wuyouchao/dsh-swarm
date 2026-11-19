window.__ModuleLoader__.load({ id: '@local/dsh-swarm', factory(require) {
const dictionaries = {"zh":{"panel":"Swarm","subtitle":"留言板、成员与协作图","open":"打开 Swarm 面板","network":"无法连接 Swarm 服务","loading":"正在加载…","retry":"重试","refresh":"刷新","notSwarm":"当前会话不是 Swarm","notSwarmHint":"在当前会话输入 /swarm-mode 启用协作后，这里会显示留言板。","notLive":"未加载","notLiveHint":"Lead 会话尚未加载，成员信息来自存储，暂不能切换模型。","active":"活跃","activeCount":"活跃","board":"留言板","members":"成员","graph":"协作图","user":"我","monitor":"监视器","everyone":"所有人","boardOnly":"仅发板","kind_brief":"任务简报","kind_report":"报告","kind_monitor":"停滞提醒","more":"展开","less":"收起","search":"搜索留言","filterMember":"按成员筛选","allMembers":"全部成员","follow":"跟随最新","followHint":"有新留言时自动滚动到底部","emptyBoard":"还没有留言","emptyBoardHint":"Lead 创建成员后，任务简报和成员之间的消息会显示在这里。","noMatch":"没有符合条件的留言","clearFilters":"清除筛选","newDivider":"新留言","newPosts":"条新留言","jumpLatest":"跳到最新","to":"发给","composerPlaceholder":"以「我」的身份发帖，Enter 发送，Shift+Enter 换行","send":"发送","sending":"发送中","chooseRecipients":"先选择收件人","tasks":"任务","noTasks":"还没有任务","unowned":"未认领","task_pending":"待办","task_in_progress":"进行中","task_completed":"已完成","lead":"协调者","current":"当前","standby":"待命","failed":"失败","retired":"已移除","remove":"移除","removeHint":"永久移除该成员，不能恢复","confirmRemove":"确认移除","cancel":"取消","status_running":"运行中","status_provisioning":"启动中","status_inactive":"待命","status_failed":"失败","noPosts":"尚未发帖","openConversation":"打开该成员的会话","tier":"档位","setTier":"切换模型档位","memberNotLive":"该成员尚未加载，无法切换模型。先打开它的会话再试。","replay":"回放","stepBack":"上一帖","stepForward":"下一帖","play":"播放","pause":"暂停","live":"实时","replayAt":"回放至","posts":"帖","graphEmpty":"还没有点名往来","graphHint":"箭头从发帖人指向被点名的成员，线越粗表示帖子越多。"},"en":{"panel":"Swarm","subtitle":"Board, members, and collaboration graph","open":"Open the Swarm panel","network":"Cannot reach the Swarm service","loading":"Loading…","retry":"Retry","refresh":"Refresh","notSwarm":"This session is not a swarm","notSwarmHint":"Enter /swarm-mode in this conversation to activate its board.","notLive":"Not loaded","notLiveHint":"The lead session is not loaded. Members come from storage and models cannot be changed yet.","active":"Active","activeCount":"active","board":"Board","members":"Members","graph":"Graph","user":"Me","monitor":"Monitor","everyone":"Everyone","boardOnly":"board only","kind_brief":"Brief","kind_report":"Report","kind_monitor":"Stall alert","more":"Show more","less":"Show less","search":"Search posts","filterMember":"Filter by member","allMembers":"All members","follow":"Follow","followHint":"Keep the newest post in view","emptyBoard":"No posts yet","emptyBoardHint":"Briefs and messages between members appear here once the lead spawns teammates.","noMatch":"No posts match","clearFilters":"Clear filters","newDivider":"New","newPosts":"new posts","jumpLatest":"Jump to latest","to":"To","composerPlaceholder":"Post as Me, Enter to send, Shift+Enter for a new line","send":"Send","sending":"Sending","chooseRecipients":"Choose recipients first","tasks":"Tasks","noTasks":"No tasks yet","unowned":"Unowned","task_pending":"Pending","task_in_progress":"In progress","task_completed":"Completed","lead":"Coordinator","current":"Current","standby":"Standing by","failed":"Failed","retired":"Retired","remove":"Remove","removeHint":"Remove this member permanently; it cannot be restored","confirmRemove":"Confirm remove","cancel":"Cancel","status_running":"Running","status_provisioning":"Starting","status_inactive":"Standing by","status_failed":"Failed","noPosts":"No posts yet","openConversation":"Open this member's conversation","tier":"Tier","setTier":"Change model tier","memberNotLive":"This member is not loaded, so its model cannot change. Open its conversation and try again.","replay":"Replay","stepBack":"Previous post","stepForward":"Next post","play":"Play","pause":"Pause","live":"Live","replayAt":"Replay at","posts":"posts","graphEmpty":"No mentions yet","graphHint":"Arrows point from the poster to each addressed member. Thicker lines mean more posts."}};
const css = ".sw {\n  --sw-bg: var(--dsw-alias-bg-base);\n  --sw-surface: var(--dsw-alias-bg-layer-1);\n  --sw-hover: var(--dsw-alias-bg-layer-2);\n  --sw-border: var(--dsw-alias-border-l1);\n  --sw-border-strong: var(--dsw-alias-border-l2);\n  --sw-text: var(--dsw-alias-label-primary);\n  --sw-muted: var(--dsw-alias-label-secondary);\n  --sw-accent: var(--dsw-alias-brand-primary);\n  --sw-warn: var(--dsw-alias-state-warn-primary);\n  --sw-error: var(--dsw-alias-state-error-primary);\n  --sw-success: var(--dsw-alias-state-success-primary);\n  --sw-idle: var(--dsw-alias-state-idle-primary);\n  box-sizing: border-box; width: 100%; height: 100%; min-width: 0; min-height: 0;\n  container: swarm / inline-size; overflow: hidden; color: var(--sw-text); background: var(--sw-bg);\n  font: inherit; font-size: 13px; line-height: 1.5;\n}\n.sw *, .sw *::before, .sw *::after { box-sizing: border-box; }\n.sw [hidden], .sw[hidden] { display: none !important; }\n.sw h2, .sw h3, .sw p, .sw ul { margin: 0; }\n.sw ul { padding: 0; list-style: none; }\n.sw h2 { font-size: 15px; font-weight: 650; letter-spacing: -.2px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.sw h3 { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--sw-muted); }\n.sw svg, .sw-trigger svg { flex-shrink: 0; }\n.sw button, .sw input, .sw textarea, .sw select { font: inherit; color: inherit; }\n.sw button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 28px; padding: 3px 9px; border: 1px solid var(--sw-border); border-radius: 7px; background: var(--sw-bg); cursor: pointer; white-space: nowrap; }\n.sw button:hover:not(:disabled) { background: var(--sw-hover); border-color: var(--sw-border-strong); }\n.sw button:disabled { opacity: .48; cursor: default; }\n.sw :focus-visible, .sw-trigger:focus-visible { outline: 2px solid var(--sw-accent); outline-offset: 2px; }\n.sw button.sw-primary { background: var(--sw-accent); color: var(--sw-bg); border-color: var(--sw-accent); font-weight: 600; }\n.sw button.sw-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--sw-accent) 88%, var(--sw-bg)); border-color: var(--sw-accent); }\n.sw button.sw-icon-button { width: 28px; height: 28px; min-height: 28px; padding: 5px; border-color: transparent; background: transparent; color: var(--sw-muted); }\n.sw button.sw-text-button { min-height: 22px; padding: 1px 4px; border-color: transparent; background: transparent; color: var(--sw-muted); font-size: 12px; }\n.sw input, .sw textarea, .sw select { min-width: 0; max-width: 100%; border: 1px solid var(--sw-border); border-radius: 6px; background: var(--sw-bg); padding: 5px 8px; }\n.sw textarea { resize: vertical; line-height: 1.5; }\n.sw input::placeholder, .sw textarea::placeholder { color: var(--sw-muted); }\n.sw option { color: var(--sw-text); background: var(--sw-bg); }\n.sw .sw-muted, .sw small { color: var(--sw-muted); }\n.sw small { font-size: 11px; }\n.sw-shell { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 14px 16px 0; gap: 10px; }\n.sw-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; min-height: 30px; }\n.sw-heading { display: flex; align-items: center; gap: 8px; min-width: 0; }\n.sw-heading > svg { color: var(--sw-accent); }\n.sw-summary { white-space: nowrap; }\n.sw-tag { display: inline-flex; align-items: center; padding: 0 5px; border-radius: 4px; background: var(--sw-surface); color: var(--sw-muted); font-size: 11px; font-weight: 500; white-space: nowrap; }\n.sw-tag-current { color: var(--sw-accent); background: color-mix(in srgb, var(--sw-accent) 10%, var(--sw-bg)); }\n.sw-tag-warn { color: var(--sw-warn); background: color-mix(in srgb, var(--sw-warn) 10%, var(--sw-bg)); }\n.sw-count { color: var(--sw-muted); font-size: 11px; font-weight: 500; min-width: 18px; padding: 0 5px; background: var(--sw-hover); border-radius: 4px; text-align: center; font-variant-numeric: tabular-nums; }\n.sw .sw-segment { display: flex; flex-shrink: 0; padding: 2px; border: 1px solid var(--sw-border); border-radius: 8px; background: var(--sw-surface); }\n.sw .sw-segment button { flex: 1; min-height: 27px; padding: 3px 8px; border: 0; background: transparent; color: var(--sw-muted); font-size: 12px; }\n.sw .sw-segment button[aria-pressed=true] { color: var(--sw-text); background: var(--sw-bg); box-shadow: 0 1px 3px color-mix(in srgb, var(--sw-text) 10%, transparent); }\n.sw-content { display: flex; flex-direction: column; flex: 1; min-height: 0; }\n.sw-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding-bottom: 14px; }\n.sw-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 160px; padding: 24px; text-align: center; color: var(--sw-muted); }\n.sw-empty p { max-width: 300px; font-size: 12px; }\n.sw-error { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 7px; border: 1px solid var(--sw-border); font-size: 12px; overflow-wrap: anywhere; flex-shrink: 0; color: var(--sw-error); background: color-mix(in srgb, var(--sw-error) 6%, var(--sw-bg)); }\n.sw-error > span { flex: 1; min-width: 0; }\n\n.sw-board { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 8px; }\n.sw-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex-shrink: 0; }\n.sw-search { display: flex; align-items: center; gap: 6px; flex: 1 1 140px; min-width: 110px; padding: 0 8px; border: 1px solid var(--sw-border); border-radius: 7px; color: var(--sw-muted); }\n.sw-search:focus-within { border-color: var(--sw-accent); }\n.sw .sw-search input { width: 100%; padding: 5px 0; border: 0; outline: none; background: transparent; color: var(--sw-text); }\n.sw .sw-member-filter { width: auto; max-width: 140px; padding: 4px 6px; font-size: 12px; }\n.sw-check { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--sw-muted); cursor: pointer; white-space: nowrap; }\n.sw .sw-check input { width: 14px; height: 14px; margin: 0; accent-color: var(--sw-accent); }\n.sw-feed-wrap { position: relative; flex: 1; min-height: 0; display: flex; }\n.sw-feed { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; display: flex; flex-direction: column; border-top: 1px solid var(--sw-border); }\n.sw-bee { image-rendering: pixelated; object-fit: contain; flex-shrink: 0; }\n.sw-avatar { display: inline-grid; place-items: center; align-self: start; border-radius: 8px; background: var(--sw-surface); border: 1px solid var(--sw-border); color: var(--sw-muted); }\n.sw-post > .sw-avatar { grid-column: 1; grid-row: 1 / span 2; width: 32px; height: 32px; }\n.sw-post > :not(.sw-avatar) { grid-column: 2; }\n.sw-post > button { justify-self: start; }\n.sw-post { display: grid; grid-template-columns: 32px minmax(0, 1fr); column-gap: 9px; flex: none; padding: 9px 4px 9px 7px; border-bottom: 1px solid var(--sw-border); border-left: 3px solid transparent; min-width: 0; }\n.sw-post:hover { background: color-mix(in srgb, var(--sw-surface) 60%, var(--sw-bg)); }\n.sw-post[data-kind=brief] { border-left-color: var(--sw-accent); background: color-mix(in srgb, var(--sw-accent) 4%, var(--sw-bg)); }\n.sw-post[data-kind=report] { border-left-color: var(--sw-success); }\n.sw-post[data-kind=monitor] { border-left-color: var(--sw-warn); background: color-mix(in srgb, var(--sw-warn) 6%, var(--sw-bg)); }\n.sw-post-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 5px; font-size: 12px; min-width: 0; }\n.sw-seq { color: var(--sw-muted); font-size: 11px; font-variant-numeric: tabular-nums; }\n.sw .sw-name { min-height: 0; padding: 0; border: 0; border-radius: 3px; background: transparent; font-weight: 600; }\n.sw .sw-name:hover:not(:disabled) { background: transparent; color: var(--sw-accent); }\n.sw .sw-name-to { font-weight: 500; }\n.sw-arrow { color: var(--sw-muted); }\n.sw-to { min-width: 0; overflow-wrap: anywhere; }\n.sw-kind { padding: 0 5px; border-radius: 4px; font-size: 11px; font-weight: 500; background: var(--sw-surface); color: var(--sw-muted); }\n.sw-post[data-kind=brief] .sw-kind { color: var(--sw-accent); background: color-mix(in srgb, var(--sw-accent) 10%, var(--sw-bg)); }\n.sw-post[data-kind=report] .sw-kind { color: var(--sw-success); background: color-mix(in srgb, var(--sw-success) 10%, var(--sw-bg)); }\n.sw-post[data-kind=monitor] .sw-kind { color: var(--sw-warn); background: color-mix(in srgb, var(--sw-warn) 12%, var(--sw-bg)); }\n.sw-time { margin-left: auto; color: var(--sw-muted); font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }\n.sw-body { margin-top: 3px; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12.5px; }\n.sw-clamped { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 8; overflow: hidden; }\n.sw-divider { display: flex; align-items: center; gap: 8px; margin: 2px 0; color: var(--sw-error); font-size: 11px; font-weight: 600; }\n.sw-divider::before, .sw-divider::after { content: ''; flex: 1; height: 1px; background: var(--sw-error); opacity: .55; }\n.sw .sw-jump { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); min-height: 26px; padding: 2px 10px; border-radius: 13px; font-size: 12px; background: var(--sw-bg); box-shadow: 0 2px 8px color-mix(in srgb, var(--sw-text) 14%, transparent); }\n.sw-filter-note { display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-shrink: 0; }\n.sw-composer { display: grid; gap: 6px; flex-shrink: 0; padding: 8px 0 12px; border-top: 1px solid var(--sw-border); }\n.sw-recipients { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; }\n.sw .sw-chip { min-height: 22px; padding: 0 7px; border-radius: 11px; font-size: 11px; color: var(--sw-muted); }\n.sw .sw-chip[aria-pressed=true] { color: var(--sw-accent); border-color: var(--sw-accent); background: color-mix(in srgb, var(--sw-accent) 8%, var(--sw-bg)); }\n.sw-compose-row { display: flex; gap: 6px; align-items: flex-end; }\n.sw-compose-row textarea { flex: 1; min-height: 52px; max-height: 200px; }\n\n.sw-tasks { display: grid; gap: 4px; padding: 2px 0 10px; border-bottom: 1px solid var(--sw-border); }\n.sw-task { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto auto; align-items: center; gap: 7px; padding: 3px 2px; font-size: 12px; }\n.sw-task-subject { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.sw-task[data-status=completed] .sw-task-subject { color: var(--sw-muted); text-decoration: line-through; }\n.sw-task-owner { max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.sw-group { display: grid; gap: 2px; padding-top: 10px; }\n.sw-group > h3 { padding: 0 2px 2px; }\n.sw-member { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 4px 6px; padding: 2px; border-radius: 8px; }\n.sw-member:hover { background: var(--sw-surface); }\n.sw-member-current { background: color-mix(in srgb, var(--sw-accent) 5%, var(--sw-bg)); }\n.sw-member-main > .sw-avatar { grid-row: 1 / span 4; grid-column: 1; }\n.sw-member-main > :not(.sw-avatar) { grid-column: 2; }\n.sw .sw-member-main { display: grid; grid-template-columns: auto minmax(0, 1fr); justify-items: start; gap: 1px 8px; min-width: 0; min-height: 0; padding: 6px 8px; border: 0; background: transparent; text-align: left; white-space: normal; }\n.sw .sw-member-main:hover:not(:disabled) { background: transparent; border: 0; }\n.sw .sw-member-main:disabled { opacity: 1; cursor: default; }\n.sw .sw-member-main:hover:not(:disabled) strong { color: var(--sw-accent); }\n.sw-member-line { display: flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; }\n.sw-member-line strong { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.sw-member-route { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.sw-member-desc, .sw-member-latest { max-width: 100%; font-size: 12px; overflow: hidden; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }\n.sw-member-desc { color: var(--sw-text); }\n.sw-member-latest { color: var(--sw-muted); -webkit-line-clamp: 1; }\n.sw .sw-tier-select { width: auto; margin-top: 6px; padding: 2px 4px; font-size: 11px; color: var(--sw-muted); border-color: transparent; background: transparent; cursor: pointer; }\n.sw .sw-tier-select:hover:not(:disabled) { border-color: var(--sw-border); background: var(--sw-bg); }\n.sw-member-error { grid-column: 1 / -1; margin: 0 8px 4px; }\n.sw-member-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }\n.sw button.sw-danger { min-height: 22px; padding: 1px 6px; font-size: 12px; color: var(--sw-error); border-color: color-mix(in srgb, var(--sw-error) 50%, var(--sw-border)); }\n.sw-retired > summary { list-style: none; cursor: pointer; padding: 0 2px 2px; }\n.sw-retired > summary::-webkit-details-marker { display: none; }\n.sw-retired .sw-member { opacity: .6; }\n.sw-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; background: var(--sw-idle); }\n.sw-dot.sw-running, .sw-dot.sw-provisioning, .sw-dot.sw-task-in_progress { background: var(--sw-accent); }\n.sw-dot.sw-running { box-shadow: 0 0 0 3px color-mix(in srgb, var(--sw-accent) 22%, transparent); }\n.sw-dot.sw-failed { background: var(--sw-error); }\n.sw-dot.sw-task-completed { background: var(--sw-success); }\n.sw-dot.sw-task-pending-blocked { background: var(--sw-warn); }\n\n.sw-graph { display: flex; flex-direction: column; gap: 6px; }\n.sw-replay { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }\n.sw .sw-range { flex: 1; min-width: 60px; padding: 0; border: 0; accent-color: var(--sw-accent); }\n.sw .sw-live { min-height: 24px; margin-left: 4px; padding: 1px 8px; font-size: 12px; color: var(--sw-muted); }\n.sw .sw-live-on { color: var(--sw-success); border-color: color-mix(in srgb, var(--sw-success) 50%, var(--sw-border)); }\n.sw-replay-state { font-variant-numeric: tabular-nums; }\n.sw-graph-empty { min-height: 60px; flex: 0; padding: 8px; }\n.sw-svg { width: 100%; max-width: 520px; height: auto; align-self: center; overflow: visible; }\n.sw-edge path { fill: none; stroke: var(--sw-border-strong); }\n.sw-edge-hot path { stroke: var(--sw-accent); }\n.sw-marker { fill: var(--sw-border-strong); }\n.sw-marker-hot { fill: var(--sw-accent); }\n.sw-edge-label { fill: var(--sw-muted); font-size: 10px; text-anchor: middle; dominant-baseline: middle; paint-order: stroke; stroke: var(--sw-bg); stroke-width: 3px; }\n.sw-node circle { fill: var(--sw-surface); stroke: var(--sw-idle); stroke-width: 1.5; }\n.sw-node[data-status=running] circle, .sw-node[data-status=provisioning] circle { stroke: var(--sw-accent); }\n.sw-node[data-status=failed] circle { stroke: var(--sw-error); }\n.sw-node[data-status=external] circle { stroke-dasharray: 3 2; }\n.sw-node-hot circle { fill: color-mix(in srgb, var(--sw-accent) 18%, var(--sw-bg)); stroke: var(--sw-accent); stroke-width: 2.5; }\n.sw-node[data-status=retired] > circle { stroke-dasharray: 3 2; }\n.sw-node[data-status=retired] > image { opacity: .55; }\n.sw-node[data-status=retired] > text { text-decoration: line-through; }\n.sw-node-label { fill: var(--sw-text); font-size: 11px; text-anchor: middle; }\n.sw-focus { border: 1px solid var(--sw-border); border-radius: 8px; overflow: hidden; }\n.sw-focus .sw-post { border-bottom: 0; }\n.sw-graph-hint { font-size: 11px; }\n\n.sw-trigger { display: inline-flex; align-items: center; gap: 5px; min-height: 28px; font: inherit; font-size: 12px; color: var(--dsw-alias-label-secondary); background: transparent; border: 0; border-radius: 6px; padding: 3px 7px; cursor: pointer; }\n.sw-trigger:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); }\n@container (max-width: 480px) { .sw-trigger-label { display: none; } }\n\n@container swarm (max-width: 360px) {\n  .sw-shell { padding: 10px 10px 0; gap: 8px; }\n  .sw-summary { display: none; }\n  .sw .sw-member-filter { max-width: 110px; }\n  .sw-time { margin-left: 0; }\n  .sw-task { grid-template-columns: 8px minmax(0, 1fr) auto; }\n  .sw-task-owner { grid-column: 2 / -1; }\n  .sw-compose-row { flex-direction: column; align-items: stretch; }\n  .sw-member { grid-template-columns: minmax(0, 1fr); }\n  .sw .sw-tier-select { margin: 0 8px 4px; justify-self: start; }\n}\n@container swarm (min-width: 560px) {\n  .sw-shell { padding: 16px 20px 0; }\n  .sw-scroll .sw-group { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); column-gap: 8px; }\n  .sw-group > h3 { grid-column: 1 / -1; }\n}\n";
const bees = {"lead":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACqklEQVR42u2cPyhFURzHz/NMXolJWRgoyWCh/CkLdovFoN5g0BvtktVg0CsGZbApkwWLEqUUmzJZlIkURYnJu79X7+eec+8513t8PtN1nXvedfX99Dt/3jUGAAAAAAAAAAD+C7nQHzAyOPn5fXx+dZzjkVfTxCPgH4CCslKQJI2OQmtNu2df908CUBAEVZCM8NnaR802o0v52DjbqCCNFrT+t0+PYq8tjk95uQcSgIL+N831Nphy1dfixkb0i1Lp00VrNqrR0K4tjk85PSsSgIJQkPdBiqYOrc3oUrx2bHDVkSt9hej45oUEoCDISEEywlqVIisTjae9LkVHd7HXqpWPo45sKh+pGokv7ZAAFASJq6A0lY/K8KJFo02nLsulkkmqnRCqIQEoCIIqyEYjbcPih4ty7WOVvPc/3pd25NQ009EoCEzIFTGb6eI02AzoQuO6IpZmrokEoCAUZLJavfI26NvprBwvLLfEtt9aeY1X3/y9CbkBgASgIAiqIBtdpKqOFEX40pGrgnzpiASgIMNckO/KJARa/1IdA909Xvq30VF1++T7pkgACkJByQdfgbXjiqxwtIpInrcZoJEAFAR1tTta1U7/elQVDM1mVilp1Uuaish1YKhVRCQABUFmAzFNO2B+nDsiASgIBUGgqXKbKWsSgIJQ0J+Jf/XqWNjP3Z+L9jLO7BYSr5SRABSEgpx4PGmtef6gGJ1vn3j2fqMPh7eV447pXhM31WwCLMpL7fhaoCcBKAgFOfH+dmnRqte7dvTzBS99av1I7Uj1SWWxLwgFgfmNL2i4Vghp0OJvs/K1OnZd87wcQNmoht3RKAjq9q2JUk2+dGSjApPh6hUJQEHQcC9u/S0VhH7pKwlAQdAQr69vRC2QABQEAAAAAAAAAAAAAAB/iC95pBFNPBOYqQAAAABJRU5ErkJggg==","mint":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACdUlEQVR42u2cvy+DQRjHr2KRMNoMEhIdJCUiyihWQ0WINCKM0sVk6tTJwtJYRURsDFax6obN0r+CxFjbm0f0vPf07t635fOZLq/r9c0r30+e+9HXGAAAAAAAAAAAAACA6BR4BD9ZnlvrpPV5enkI8uyGeNz5wj8ABfmpwEcLtvGvnm9TP7s7vxHkHkgACkJBuSjFFlXZ57DZVI1/XqsZzfguqtEi1eSiIxKAgv43w7Y/rN5cpFYgjzv7hV4rDdt1rXasn63VOqEnTVNmLGm3zTsJQEEQT0E+ExkZednWTqx8sOnIpfKRqpGE0g4JQEEQREFastSRnJRptRNDNSQABYFKQT6TrEEhlHa06z8kAAVBkCpIW9WEUpascLSKcEG7I+az1kQCUJBhR8xktIFevmsk7Val3vN3yXE+ji5T+4+e7aX20d4P54JQEOSuIK12fLApIpSOfJRIFYSCIPfl6FCq0Y4v1TE7OR1kfBcdfbufiumwFoSCIBMFycontna0yArHVhHJ6y4TNBKAgiB3Bblo53RiJmmvLG5lVinZqhefikg7MbRVRCQABUFmEzGbdsD8unZEAlAQCoJIS+UuS9YkAAWhoD8Tf+3umA8jx9Wk/Xly3fNOGQlAQShIRf2+e9zMQTFpNtarwW/0tfWWtEvloklbajYRNuWldkJt0JMAFISCVGyOL6T2KUXQjst1nzFdtCPVJ5XFuSAUBCaro4m244guFYIPtvi77Hy1t5e6XpcTKBfVcDoaBcFA/EAjlI5cVGAy3L0iASgIBuKtiTF+QR/qpax5qYYEoCDoqxe39rMWSAAKAgAAAAAAAAAAAACAP8QXUz3s7fxK/ZwAAAAASUVORK5CYII=","iris":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACa0lEQVR42u2crU8DMRiHO4IlwcwjEAiWYSb4GIqBRxCWTJEgIAOBQk6iEEBAYJfgcAg+HBAEBrI/AwEJf8BwtyasXN/17W4bz6Oa0nWXI78nb9vbGQMAAAAAAAAAAAAAEJ0ct+A383Mr7bQxL28PKvdujNudLfwDUFCYCkK04Jr/9u4+9bNrqxWVayABKAgFZaIUV1TtMbtnZ6L5z+t1I5nfRzVSbDX56IgEoKD/zbjrDyfbT6kVyP7lUq7XSsPVL9WO87P1elt70TSR77S/P0gACoKICgpZyNiRt9vShVUILh35VD62amy0tEMCUBCoKEhKP3VkL8qk2omhGhKAgkCkoJBF1rCgpR3p/g8JQEGgUgVJqxotZdkVjlQRPkhPxEL2mkgACjKciJk+HaAfHXSifXhc6fm77Hma1zup42vrF6ljpNfDc0EoCDJXkFQ7IbgUoaWjECVSBaEgyFxBWqoJUdPs1HTfKiJXRcdeEAoCE3MvaBC046MXV0Vk9/voiASgIMi8CvLRznL1M2kvlDaiLspiV0TSRVnIHhcJQEFUQSq4tAPmz70jEoCCUBBE2ir32bImASgIBY1M/KWnYyFUS42kffXa6PmkjASgIBQkovC117X/ZmsmabcmT9Uv9P3xOWkXy4smbavZRNj/sbWjdUBPAlAQChLRbG2mjimW9bXj0x8yp492bPWFHMSTABQEptfnglyPI/pUCCG44u9z8lXI17r22wsoH9XwdDQKgqH4gYaWjnxUYPp4ekUCUBAMxVsTY/yCXuulrFmphgSgIBioF7cOshZIAAoCAAAAAAAAAAAAAIAR4gcNiO4c6GyCIwAAAABJRU5ErkJggg==","sky":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACdklEQVR42u2cPy8EQRiH50TpKxCFhMLFRSJCXOcaH+A6BZHcYVU0Er2Gyr+oFDofQENHIroTlZYPIBKd4nR7r7ix897M7t6d56kma25us/J78s6fW2MAAAAAAAAAAAAAAFKnwCP4zVxpsZnU56FxG+TZDfC484V/AAryU4GPFmzjX9zdJH52pVwJcg8kAAWhoFyUYouq7LNxfKwa/zSKjGZ8F9VokWpy0REJQEH/m0HbH6qHjcQK5Gq7VOi00rBd12rH+tkoaoaeNI0PtdovnyQABUGKCvKZyMjIy7Z2YuWDTUculY9UjSSUdkgACoIgCtKSpY7kpEyrnTRUQwJQEKgU5DPJ6hVCaUe7/kMCUBAEqYK0VU0oZckKR6sIF7Q7Yj5rTSQABRl2xExGG+hL561oX9cqHX+XHOd1fz2x/8juWWIf7f1wLggFQe4K0mrHB5siQunIR4lUQSgIcl+ODqUa7fhSHZOjY0HGd9HRj/upVZqsBaEgyERBsvJJWztaZIVjq4jkdZcJGglAQZC7gly0szf9HrfnZ6qZVUq26sWnItJODG0VEQlAQZDZRMymHTB/rh2RABSEgiClpXKXJWsSgIJQUN/EX7s75sPw8kHcfrvc6XinjASgIBSkYvNxq/311Ym4fTJ7FPxGn++f4nZxYcokLTWbFDblpXZCbdCTABSEglTUv9YS+xRT0I7LdZ8xXbQj1SeVxbkgFAQmq6OJtuOILhWCD7b4u+x8fZTrba/LCZSLajgdjYKgJ36gEUpHLiowGe5ekQAUBD3x1sQ0fkEf6qWseamGBKAg6KoXt3azFkgACgIAAAAAAAAAAAAAgD7iG1mG8FAWj1brAAAAAElFTkSuQmCC","rose":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACbklEQVR42u2cMUvDQBiGr+IfKLgVRFRQoYKLgrqqHQRHNxcHEQm66eTkpJtQRLr6GzpUnSs4CQpOjt0Ef0LdmhN75r7cl6StzzOFmF5D5H347r5rjAEAAAAAAAAAAAAAyJwSj+A3q0sb3aRrnl4eVZ7dGI+7WPgHoKAwFYRowTV+++E28bNrm4cq90ACUBAKKkQprqja1xzV66Lxb6LISMb3UY0UW00+OiIBKOh/M+76w+vZVWIFsnh5WkpbabjOS7Xj/GwUdbUnTWZiJj7+/CABKAiyU1DIRMaOvH0snViF4NKRV+Vjq8ZGSTskAAWBioKk5Kkje1Im1k4GqiEBKAhECgqZZA0NStqRrv+QABQEKlWQtKrRUpZd4UgV4YO0Ixay1kQCUJChI2ZyaqC3z0/iCF9cp/4ue5yDu2bi9Y297WSlCO+HfUEoCApXkFQ7IbgUoaWjECVSBaEgKFxBWqoJUVN1aja3ishV0bEWhILAZLkWNAja8dGLqyKyz/voiASgIChcQV7a2VmPq4Ll3UwnZT7ViE9FpFV9/bwH0yUBKAhy3xfk0g6YP9eOSAAKQkGQ0VK5z5I1CUBBKGhk4i/tjoXQqG3F39W6T90pIwEoCAWJ+Oq0+p5v7s/3jsuVmvqNvj2/946rKwsmaak5i6a8rR2tBj0JQEEoSESnM5l4Tbmirx2f8yFj+mjHVl9II54EoCAwafcFubYj+lQIIbji79P5Op6b7l81WRMoH9WwOxoFwVD8QENLRz4qMDl2r0gACoKheGtiFr+g13opa1GqIQEoCAbqxa2DrAUSgIIAAAAAAAAAAAAAAGCE+AZEoO4w3xG+OAAAAABJRU5ErkJggg=="};
function remoteDescriptor(commandExecute) {
  const text = commandExecute?.parameters.find(p => p.name === 'line')?.codec;
  if (text?.mode !== 'strict' || typeof text.create !== 'function') throw new Error('Swarm requires the registered strict string codec');
  const codec = { ...text, typeSymbol: '@local/dsh-swarm#Json' };
  return {
    id: '@local/dsh-swarm#swarmBoard/call', service: 'swarmBoard', namespace: 'swarmBoard', method: 'call',
    invocation: { kind: 'direct' },
    parameters: [{ name: 'requestJson', wire: 'requestJson', source: 'json', codec, strictCodec: codec }],
    result: codec,
  };
}
const MAX_POSTS = 2000;
const TASK_STATUSES = ['pending', 'in_progress', 'completed'];
const MEMBER_GROUP = { running: 'active', provisioning: 'active', inactive: 'standby', failed: 'failed' };

function lastSeq(posts) {
  return posts.length ? posts[posts.length - 1].seq : 0;
}

// A nextSeq at or below what we hold means the board was recreated; dropping the posts makes the next poll fetch it in full.
function mergeView(state, view) {
  if (!view.swarmId) return null;
  const base = state?.swarmId === view.swarmId && view.nextSeq > lastSeq(state.posts) ? state.posts : [];
  const after = lastSeq(base);
  const fresh = view.posts.filter(p => p.seq > after).sort((a, b) => a.seq - b.seq);
  return { ...view, posts: fresh.length ? base.concat(fresh).slice(-MAX_POSTS) : base };
}

function postInvolves(post, member) {
  return post.from === member || post.to.includes(member);
}

function filterPosts(posts, { member = '', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return posts.filter(p => (!member || postInvolves(p, member))
    && (!q || p.body.toLowerCase().includes(q) || p.from.toLowerCase().includes(q) || p.to.some(n => n.toLowerCase().includes(q))));
}

function newDividerSeq(posts, seenSeq) {
  if (seenSeq == null) return null;
  return posts.find(p => p.seq > seenSeq && p.from !== 'user')?.seq ?? null;
}

function replayPosts(posts, cursor) {
  return cursor == null ? posts : posts.filter(p => p.seq <= cursor);
}

function stepCursor(posts, cursor, delta) {
  if (!posts.length) return null;
  let index = cursor == null ? posts.length - 1 : posts.findIndex(p => p.seq >= cursor);
  if (index < 0) index = posts.length - 1;
  return posts[Math.max(0, Math.min(posts.length - 1, index + delta))].seq;
}

function graphEdges(posts) {
  const edges = new Map();
  for (const post of posts) for (const to of post.to) {
    if (to === post.from) continue;
    const key = `${post.from}\u0000${to}`;
    const edge = edges.get(key);
    if (edge) { edge.count++; edge.lastSeq = post.seq; } else edges.set(key, { from: post.from, to, count: 1, lastSeq: post.seq });
  }
  return [...edges.values()];
}

function graphNodes(members, edges) {
  const names = members.map(m => m.name);
  for (const edge of edges) for (const name of [edge.from, edge.to]) if (!names.includes(name)) names.push(name);
  return names;
}

function layoutGraph(names, lead, width) {
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

function beeVariant(name) {
  if (name === 'lead') return 'lead';
  if (name === 'user' || name === 'monitor') return null;
  let hash = 0;
  for (const char of name) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return ['mint', 'iris', 'sky', 'rose'][hash % 4];
}

function groupMembers(members) {
  const groups = { lead: [], active: [], standby: [], failed: [], retired: [] };
  for (const member of members) {
    const group = member.role === 'lead' ? 'lead' : member.retired ? 'retired' : MEMBER_GROUP[member.status] ?? 'standby';
    groups[group].push(member);
  }
  return groups;
}

function mentionsIn(body, names) {
  const found = [];
  for (const match of body.matchAll(/(?:^|[^\w@])@([a-z0-9][a-z0-9-]*)/gi)) {
    const name = match[1].toLowerCase();
    if ((name === 'all' || names.includes(name)) && !found.includes(name)) found.push(name);
  }
  return found;
}

function toggleRecipient(to, name) {
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

function pluginFactory(require) {
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

return pluginFactory(require);
} });
