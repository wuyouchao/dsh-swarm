# DSH Swarm

DSH Swarm 是一个 DeepSeek Harness 社区插件。在现有对话里创建命名队友，并行分析同一任务，再由当前对话的协调者汇总证据。右侧面板可以查看每位成员的任务书、留言和协作过程。

## 安装并试用

在 DSH Desktop 的「插件 → 添加插件」中粘贴仓库地址，安装并启用 Swarm。

```text
https://github.com/wuyouchao/dsh-swarm.git
```

命令行安装到 Web 配置时，运行下面的命令。其他配置请将 `web` 替换为实际的 profile 名称。

```sh
dsh plugin --profile web add https://github.com/wuyouchao/dsh-swarm.git
```

此地址从 `main` 分支安装，后续版本沿用同一地址。需要固定版本时，可从 [Releases](https://github.com/wuyouchao/dsh-swarm/releases) 下载对应的 `.tgz` 安装包。已验证环境为 Windows 和 DSH `0.2.2-rc.5`。

安装后，在普通对话发送以下命令。执行成功后，右侧面板会打开。在「成员」查看队友，在「留言板」查看任务书和报告。

```text
/swarm-mode 请创建两名只读队友。docs 检查项目文档里推荐了哪些测试命令，tests 检查代码库实际定义了哪些测试命令。请两人分别在留言板报告依据，由你核对差异。
```

单独发送 `/swarm-mode` 可以先启用协作。再次调用会复用该会话的看板和成员。命令由插件注册，无需另外安装 skill。

## 工作区与费用

队友共用当前工作目录，按 DSH 为其提供的工具和权限工作。任务中的写入范围是分工约定。需要隔离修改时，请为成员准备独立工作副本。留言对同一队伍可见，由 DSH 持久化，每个看板保留最近 2000 帖。派工和点名唤醒成员会增加所选模型的调用量。

## 行为

- 当前会话是协调者（lead）。它拆任务、建任务板条目、用 `spawn_teammate` 创建命名 worker。Lead 负责派工、核对争议证据和汇总裁决。
- 成员只通过公共留言板交流：`board_post` 支持成员名、组名（`fix` 匹配 `fix-1`…）和 `all`，被点名者被唤醒。没有私信。
- 实现任务由 verifier 读 diff、跑测试。审计任务按证据来源分工，任务书列明输入、基线和复算方法。Lead 对照原始证据裁决切片间的冲突，按需增加独立复核。
- Host 端 monitor 每 30 秒检查：任务未完成、全员空闲超过 90 秒时发帖唤醒 lead，等待期间不耗 token。
- 会话标题旁的 Swarm 按钮打开右侧面板：留言板、成员页和协作图共用蜜蜂头像。戴皇冠的是协调者（`@lead`），在成员页首位和图的顶部。协作图可逐帖回放，点击回放帖中的成员名可查看其收发的留言。

## 模型与项目规则

默认继承协调者派工时选择的模型和推理强度。项目 playbook 可以要求协调者显式传 `route`，或由用户在插件配置 `tiers` 中定义自己的模型别名。面板只列出已配置的别名。模型切换仅作用于指定成员。

## 结构

| 文件 | 职责 |
|---|---|
| `cordis.patch.yml` | 加载 Swarm 插件 |
| `index.js` | 配置、注册命令与会话工具、Remote、monitor 定时器 |
| `lib/board.js`、`lib/monitor.js` | 纯逻辑：点名解析、序号与裁剪、停滞判断 |
| `lib/storage.js`、`lib/runtime.js`、`lib/tools.js` | 存储、成员与投递、模型可见工具 |
| `client-source.js`、`client.css`、`build.js` | Web 面板源码，`node build.js` 生成 `client.js` |

## 构建与验证

从源码构建使用 Node.js 24 和 pnpm 10.15.1，在仓库根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
npm pack --ignore-scripts
```

已安装 DSH CLI 的开发者可在 PowerShell 运行 `./tests/smoke/packed.ps1 -Tarball <安装包路径>`。脚本在临时 DSH 用户目录安装实际发行包，检查命令、队友的父会话、模型继承、留言工具和派工帖。

报告问题时，请附 DSH 版本、操作系统、插件版本及最短复现步骤。接口细节见[插件契约](CONTRACT.md)。项目使用 [MIT 许可证](LICENSE)。
