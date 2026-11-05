可以把第一波定义为：

> **W1 = 真实 PostgreSQL（seed 固定 fixture 业务数据 + fixture 知识向量）+ 单实例后端 + 可替换前端 + AI 桩实现，完成全部用户交互闭环。**

W1 使用真实 PostgreSQL 与 pgvector 扩展，数据集是固定 fixture，AI 是确定性桩；**真实双节点、真实 Embedding/知识索引、真实模型、真实数据接入和性能验收全部后置**。W1 的 fixture 结果不得表述为真实模型或生产验收结论。

## W1 基线（方案 B，2026-11-04）

`DATA_MODE` 与 `AI_MODE` 正交：`DATA_MODE` 决定业务数据/会话存哪里，`AI_MODE` 决定生成与 Embedding 由谁提供。W1 固定为 `DATA_MODE=database` + `AI_MODE=fixture`。

| 落地点 | 内容 |
|---|---|
| `src/config/env.js`、`src/compositionRoot.js` | 新增 `AI_MODE=real\|fixture`；fixture 模式强制使用 `fixture-generate-1` / `fixture-deterministic-1536`，避免沿用 `.env` 中的真实模型名；生产模式拒绝 `AI_MODE=fixture` |
| `src/components/ai-orchestration/infrastructure/fixtureModelClient.js` | 八类任务确定性返回合法 schema、引用与证据，`generate` + `embed` 同源，仍走 `/api/ai/generate` 与全部既有校验；响应带 `execution_mode: "fixture"`，页面显示"演示桩 fixture" |
| `src/fixtures/fixtureVector.js`、`scripts/seed/fixtureKnowledge.js` | 确定性 1536 维向量（强正基线 + hash 扰动），满足 `<=>` 召回、0.2 相关性下限与 Top-1 自召回回归；`npm run seed` 在 `AI_MODE=fixture` 时注入向量并激活 ACTIVE 知识版本 |
| `db/seeds/001_demo.sql` | W1/W2 共用同一份 seed，SQL 中知识版本保持 `STAGING` / `pending-real-embedding`，**W2 的真实 `knowledge:index` 与 STAGING→ACTIVE 导入流程未被改写** |
| `tests/unit/fixture-parity.test.js` | 校验 JS fixture 与 SQL seed 的产品/持仓/规则/知识片段 ID、持仓金额与收益率、版本标识一致 |
| `.github/workflows/pr-merge-gate.yml` | `ci-static` / `ci-unit-api` / `ci-db-smoke` → `ci-merge-gate`；DB job 使用 `pgvector/pgvector:pg16` service，跑 migrate、两次 seed 与 `test:integration` |

本地验证（2026-11-04，真实 PostgreSQL 16.1 + 本机编译的 pgvector 0.8.0 + Chromium 1248）：`node --check` 全量 0 错误；`npm test` 83 项（73 通过、10 项 DB 集成本地跳过、0 失败，且在 `AI_MODE=fixture` 环境污染模拟下仍 73/0）；`W1_DB_SMOKE=true npm run test:integration` **10/10 通过**；`npm run test:e2e` **15/15 通过**（含 C 类真状态、刷新恢复与兜底失败态）。本机 Docker 引擎 API 返回 500 不可用，验证改由本机 PostgreSQL 承载，步骤见 `docs/operations.md`。**GitHub Actions 已实跑（2026-11-05）**：PR #1 两轮 CI，第二轮 run `42049768111` 的 6 个 job 与 `ci-merge-gate` 全绿；PR 已合并，`origin/main` = `5022fbe`。详见 `docs/pr-merge-gate-ci.md` §9。

> **历史重写说明（2026-11-05）**：为移除随初始提交带入的三份内部文档，仓库历史已压成**单一初始 commit**。上文及本文件中出现的 `d5fd39e`、`c0142fa`、`78ebbfa`、`beaf08a`、`e3aff11`、`5022fbe`、`25e8713`、PR #1、两轮 Actions run 编号等，均为**旧历史中的事实记录**，对应 commit / PR / tag / run 在当前仓库已不存在。当前一律以 `origin/main` 的 HEAD 为唯一基线，AO Worker 必须从它创建 worktree；`w1-baseline-2026-11-05` / `w1-baseline-2026-11-04` 两个 tag 均已删除，仅作历史记录，不得作为分叉依据（旧 tag 的 tree 含过时的分支保护描述）。

正式启动前的 P0 应收敛为以下内容。当前状态逐项标注如下。

1. **冻结 W1 页面与流程范围** —— ✅ 已落地

   以 [public/app.js](C:/Users/jerry/projects/ai_wealth/public/app.js:131) 的 `pcNav`、`mobileNav` 和实际路由为准，建立"路由—操作—后端接口—状态—验收用例"清单。

   必须明确：

   - 手机闭环：助手 → 持仓 → 诊断 → 配置 → 候选 → 比较 → 投后陪伴；
   - PC 闭环：工作台/研究 → 产品解释 → 候选 → 比较 → 保存；
   - 基金、保险、理财、存款、私行、报告阅读、智能写作等页面的完成条件；
   - 哪些页面和操作明确排除在 W1 之外。

   **受限/静态页面定性（2026-11-04）**：30 个运行路由中，`pc/product-private`、`m/private`（当前显示"请先完成合格投资者认定"），以及基金、保险、理财、存款、报告阅读、智能写作等以静态演示数据为主的页面，**不是有意保留的产品限制，而是 W1 要补的功能**。完成条件由状态契约表逐页定义（与 P0 #3 合并推进），Worker 按"待补功能"领取，不得把现有演示态当作既定验收基线。

   **界面边界已冻结（2026-11-04，同日修正）**：12 个已退出运行前端的路由（`pc/delivery`、`pc/model-delivery`、`pc/rollout`、`pc/acceptance`、`pc/models`、`pc/orchestration`、`pc/standards`、`pc/integration`、`pc/select-fund`、`pc/select-wealth`、`pc/select-insurance`、`pc/sources`）**不恢复**；V2.3 架构文档 0.2 / 2.2 的"不得补建"与"不因 A–G 指标新增运行页面"保持有效，运行路由仍为 30 个。

   **这 12 个路由对应的承载能力整体延后，不属于 W1 并行研发的工作范围**：不实现、不建入口、不写脚本、不纳入 W1 验收用例，AO 的 Worker 不得据此领取任务。延后不改变它们在总体需求规格 A–G 列中的存在性——按 V2.3 的 0.3 分级与第 11 章，C/D/E 类指标由行方环境、承诺书、统一评测集或后续波次判定，不由 W1 的 fixture 结果替代。

   | 能力域（对应退出路由） | 规格归属 | W1 范围 | 延后到 |
   |---|---|---|---|
   | 交付、实施、验收、模型交付（`delivery` / `model-delivery` / `rollout` / `acceptance`） | C / D，R25–R30 / R35 / R38 / R59 | **排除** | W2 预发布前集成流水线与行方交付物评审 |
   | 模型运营、意图矩阵、专业评测（`models`） | B / E | **排除** | W2 真实模型与行方统一评测集 |
   | 编排、标准体系、渠道集成（`orchestration` / `standards` / `integration`） | C | **排除** | W2 受控脚本与设计文档评审 |
   | 选品、来源接入（`select-fund` / `select-wealth` / `select-insurance` / `sources`） | B / C | **排除** | W2 数据包导入与产品同步（`docs/pr-merge-gate-ci.md` §7） |

   W1 只保留对这些能力的**存在性登记**（架构文档 0.2 白名单与附录 A 台账），不投入实现工时。`app.js` 里这 12 个路由的残留渲染函数（`pageSources()`、`pageIntegration()`、`selectPage()`、`pageModels()`、`pageOrchestration()`、`pageStandards()`、`deliveryPage()`）及其 11 个未挂载按钮（`advance`、`api-docs`、`evaluations`、`export`、`new-eval`、`new-flow`、`preview-score`、`run-flow`、`run-update`、`skill`、`source-new`）属死代码、用户不可达，**2026-11-04 已从 `public/app.js` 直接删除（7 个函数、79 行）**，物理杜绝被重新挂到路由的可能（架构文档 A33 的运行时断言同时保留）。

   **假闭环已收敛（2026-11-04）**：新增明确业务命令 `record_activity`（`src/components/sessions/domain/session.js` 的 `ACTIVITY_KINDS` 白名单，服务端生成 `activity_id` / `created_at` / `data_version`，上限 50；浏览器只能通过命令选 `kind`，通用 PATCH 不能写 `activities`）。C 类 14 个操作全部改为调用该命令，结果页显示真实服务端记录而非静态"已生成"文案，刷新可恢复；4 个孤儿 spec（`download`、`apply-filter`、`reset-filter`、`select-writing`）及其 handler 分支已删除；`app.js` 兜底 `openLanding(action||'save')` 已改为显式 `not-implemented` 失败态并新增同名结果页 spec。7 个已退出路由的残留渲染函数已从 `public/app.js` 物理删除。

   | 类别 | 操作（kind） | 入口 | 命令 → 服务端权威状态 | 成功 / 失败 / 空 | 验收 |
   |---|---|---|---|---|---|
   | C 类 14 项（W1 实现） | `task-center`、`source-detail`、`new-supply`、`subscribe`、`brief`、`upload`、`extract`、`templates`、`review-writing`、`workspace`、`research-plan`、`save`、`mobile-search`、`filter-panel` | PC 工作台/投研/阅读/写作/产品页、手机诊断页、任意页筛选图标 | `record_activity` → `state.activities[]`（服务端生成 ID/时间/数据版本） | 成功=`APPLIED` 且结果页显示记录 ID；失败=白名单外/未授权/上限触发 `action-error`；空=结果页显示"尚未写入服务端记录" | `tests/unit/activities.test.js`、`tests/e2e/work-items.spec.js` |
   | D 类 4 项（删除） | `download`、`apply-filter`、`reset-filter`、`select-writing` | 删死代码后已无入口 | 无；spec 与 handler 分支已删除 | 点击落到 `not-implemented` 失败态 | `work-items.spec.js` 未知操作用例 |
   | A 类 15 项 / B 类 8 项 | 真业务闭环与错误/空状态 | 见各运行路由 | 八个 AI 任务、六个业务命令、`patch` / 校验失败路径 | 既有成功/失败/空状态 | 既有 15 项 E2E |

   `not-implemented` 结果页明确写"该操作在当前 W1 范围尚未实现，系统没有写入任何状态，也没有展示成功结果"，杜绝兜底伪造成功。

   另需按产品逐个核对知识片段覆盖：fixture 知识库只有 `fund` / `wealthplus` / `insurance` / `deposit` 四个片段，`product_explain`、`candidate_explain` 等带 `product_ids` 的任务在 `wealth` / `bondfund` / `cash` 上会走"证据不足"错误路径。这是 P0 #5 要求的可见空/失败状态，不是流程断裂，但必须写入验收清单。

2. **统一并提交基线** —— ✅ 已落地

   [wealth-prototype-demo-architecture.md](C:/Users/jerry/projects/ai_wealth/wealth-prototype-demo-architecture.md:3) 已统一为 V2.3、日期 2026-11-04，测试数量统一为 57（47 单元/API + 10 DB 集成），W1 范围以本文件为准。

   **已完成**：2026-11-04 提交基线 `c0142fa`（62 个文件，4120 insertions / 641 deletions），并打 annotated tag `w1-baseline-2026-11-04`。`README.md` 已恢复并重写为 V2.3；3 个 `__extract*` 临时文件加入 `.gitignore` 排除，误提交的 Office 锁文件已删除；`.env` 与 `qwen.key` 未纳入。沿用初始提交的 `Agent Orchestrator <ao@example.com>` 身份（仅本次命令环境变量，未写任何 git config）。**未 push**：`origin/main` 仍停在 `d5fd39e`。AO 的所有 Worker 必须从 `origin/main` 的 HEAD 创建 worktree；`w1-baseline-2026-11-05` / `w1-baseline-2026-11-04` 两个 tag 均已删除，仅作历史记录，不得作为分叉依据（旧 tag 的 tree 含过时的分支保护描述）。

3. **冻结前后端状态契约** —— ✅ 已落地

   保留 API v1 和现有会话版本控制（`expected_version` + `request_id` 幂等），但补齐 W1 需要持久化的状态：

   - 目标、授权、方案、候选、比较、提醒、陪伴；
   - 诊断结果、研究回答、报告摘要、写作草稿；
   - 刷新页面后是否恢复；
   - 哪些是服务端权威状态，哪些只是 UI 临时状态。

   **已冻结（2026-11-05）**：`docs/api-contract.md` 新增「共享会话状态契约（W1 冻结）」，把 `defaultSessionState()` 的 36 个 key 逐项归为 A 服务端权威（8 + 命令写入的 `candidateCalculation`）、B 浏览器可写（19 个 PATCH 字段）、C 只读元数据（9 个），并写明写入途径、校验、撤权清理、刷新恢复与 12 小时 TTL 生命周期。`tests/unit/session-contract.test.js` 锁定 19 个白名单字段、7 个命令、36 个状态 key、11 个 `downstreamReset` key；改动这些集合必须同步改文档，视为契约变更。

   按拍板：AI 结果投影（`lastAnswer`、`researchAnswer`、`diagnosis`、`ruleMatch`、`aiRequests`）保持前端写回，但 `validateSessionState` 补了结构与大小校验（text ≤ 20000、aiRequests ≤ 100、UI 对象 ≤ 64KB 等）；无写入方的 `qualified`、`acceptanceAdvanced` 已从 `SESSION_PATCH_FIELDS` 移除并归为只读。刷新恢复、409、幂等、撤权清理仍由 `tests/integration/w1-flow.test.js` 覆盖。

4. **受控 AI fixture/stub 模式** —— ✅ 已落地

   仍使用 `/api/ai/generate` 和现有响应结构；八类任务都返回确定性的 schema、引用、证据和状态；`rule_match` 返回目录内可验证的规则 ID，配置与候选仍由后端确定性执行；响应带 `execution_mode: "fixture"`，页面显示"演示桩 fixture"（前端所有"真实模型"文案已中性化）；生产模式拒绝启用 fixture；失败、超时、证据不足、409 等错误仍走真实错误路径。

   注意 stub 必须同时实现 `embed()`：fixture 模式下 `hasActiveKnowledge` 为真，知识类任务会调用 Embedding 并校验 1536 维与模型名，只做 `generate()` 仍会失败。

5. **一致的 fixture 业务数据** —— ✅ 已落地

   W1 使用真实 PostgreSQL：客户、持仓、产品、规则、知识片段、会话、AI 审计全部由 `db/migrations` + `db/seeds/001_demo.sql` 落库，不再依赖后端内存 `Map` 作为业务真源。

   - 产品 ID、产品详情、候选、比较字段由 `fixture-parity` 测试保证 JS 与 SQL 一致；
   - 持仓合计、资产占比、存款利息、候选筛选等计算由后端完成；
   - 前端不再用静态数字冒充后端结果；
   - 授权取消、目标变化、重新生成和比较失效逻辑可重复验证；
   - 空结果、未授权、无证据和版本冲突都有可见状态。

6. **W1 专用 CI 门禁** —— ⚠️ 本地已跑绿，CI 未实跑

   `.github/workflows/pr-merge-gate.yml` 已建立：

   - `ci-static`：Node 20、`npm ci`、全量语法检查；
   - `ci-unit-api`：`npm test`（73 项，不依赖数据库/模型）+ Node 原生覆盖率报告 artifact（仅报告、不阻断）；
   - `ci-db-smoke`：pgvector service + `migrate` + 两次 `seed`（幂等）+ `test:integration`（10 项，覆盖 vector(1536)、hnsw、ACTIVE 版本、会话持久化、409、重复提交、撤权清理、pgvector 召回）；
   - `ci-e2e-smoke`：pgvector service + `migrate`/`seed` + `npx playwright install --with-deps chromium` + `npm run test:e2e`（15 项浏览器用例），失败上传 `playwright-report/` 与 `test-results/`；
   - `ci-ownership`：按分支名 `ao/<agent-id>/<topic>` 声明的 Agent 身份，校验 PR 的 changed files 是否在其授权路径内（`scripts/ci/check-ownership.mjs`，默认拒绝未登记路径）；
   - `ci-security`：`npm audit --omit=dev --audit-level=high` + `scripts/ci/check-secrets.mjs` 扫描 tracked 密钥与 `.gitignore` 规则（本地实测 0 漏洞 / 91 文件 0 违规）；
   - `ci-merge-gate`：`if: always()` 汇总六项，作为主分支 required check。

   Playwright 已落地：`@playwright/test` 1.64.1（devDependency，`package-lock.json` 已更新）、`playwright.config.js`（pc / mobile 两个 project、webServer 自动拉起单实例应用、`/ready` 作为就绪探针）、`tests/e2e/{contract,mobile-flow,pc-flow}.spec.js`。覆盖契约标记与 fixture 模式、session 刷新恢复、409、证据不足 422、手机闭环（助手 → 配置 → 候选 → 比较 → 陪伴、撤权清理）、PC 闭环（研究 → 配置 → 候选 → 比较 → 保存、刷新保持）与演示桩标注。

   **本地全绿**：语法检查、`npm test`（73/83）、`test:integration`（10/10）、`test:e2e`（15/15）与 `ci-ownership` 规则单测均已在真实 PostgreSQL + Chromium 上通过。**已实跑（2026-11-05）**：统一 commit `beaf08a` + tag `w1-baseline-2026-11-05` → push 分支 `ao/orchestrator/w1-baseline` → `gh` 建 PR #1 并挂 `baseline` label → 第一轮 `42049158170` 因 `ci-security` 扫到测试文件里的假 PEM 字面量而红，修复 commit `e3aff11` 触发 `synchronize` → 第二轮 `42049768111` **6 job + `ci-merge-gate` 全绿**（pgvector 10/10、Chromium + 15 E2E、覆盖率 artifact 已上传）→ PR #1 以 `--merge` 合并，`origin/main` = `5022fbe`。`gh` 位于 `C:\Program Files\GitHub CLI\gh.exe`（不在 PATH），已登录且账号为 ADMIN。**分支保护已启用（2026-11-05）**：因初始提交带入三份内部文档，仓库已删除并同名重建为 **PUBLIC**，旧 commit 经 API 验证返回 422 不可取回；`ci-merge-gate` 已设为 required check（`strict=true`、`enforce_admins=true`、线性历史、禁 force push），`ci-ownership` 现在能真正阻止越界 PR 合并。覆盖率仍仅报告、不设阈值。**仍未完成**：AO canary 演练（依赖平台 AO 接入）。`ci-unit-api` 显式设 `AI_MODE=real`，避免全局 `AI_MODE=fixture` 污染使用 mock client 的单元测试。

   PostgreSQL/pgvector 扩展已在 W1（migration 与业务表绑定）；真实 Embedding、知识索引、双节点、故障切换、性能和专业评测仍放到后续流水线。

7. **完成 AO 启动演练和任务拆分** —— ⚠️ 目录边界与硬门禁已落地，AO canary 未做

   正式并行前至少完成一次：

   - Worker 创建独立 worktree 和 PR；
   - CI 故意失败；
   - AO 将失败回传给原 Worker；
   - Worker 修复后重新触发 CI；
   - 合并前由统一门禁拦截未通过 PR。

   **已落地（2026-11-05）**：`public/app.js` 的 330 行 `handleAction` 按连续区间拆为 `public/actions/{navigation,research,diagnosis,flow}.js`，`app.js` 只留分发器（1126 → 803 行），分支体零改写、注册表按 action 精确分派并保持原判断顺序；新增 `scripts/ci/check-ownership.mjs` 的 13 类 Agent 目录映射、`ci-ownership` job（纳入 `ci-merge-gate`）、`.github/pull_request_template.md` 的 DoD 与 `docs/pr-merge-gate-ci.md` §5 分工表。分支统一 `ao/<agent-id>/<topic>`，由 AO 分配；越界改动在 CI 阶段被拦。

   **AO canary 方案已定（2026-11-05）**：采用**平台 AO 真闭环**（`orchestrator.inc` / `ao session claim-pr` 属 WorkBuddy 平台侧能力，不在本仓库），故意失败注入点为 `ci-ownership` 越界（`ao/frontend-flow/canary-ownership` 分支改 `public/app.js`）；5 步断言、两条硬约束（不打 `baseline` label、必须新 commit 触发 `synchronize`）、平台侧前置与 DoD 见 `docs/pr-merge-gate-ci.md` §10。不接人工模拟回传作为通过。

   **仍未完成**：演练本身尚未执行（依赖 GitHub Actions 实跑与平台 AO 接入），以及 `ci-security` / 覆盖率门禁。

W1 的启动绿灯应是：**路由和操作清单冻结、基线已提交、API/会话契约冻结、fixture AI 可替换、所有按钮都有成功/失败/空状态路径、fixture E2E 主流程通过、AO canary 闭环通过**。当前已达成的是"fixture AI 可替换 + 真实 PG 数据底座 + DB 集成门禁 + 本地浏览器 E2E 全绿 + 基线已提交 + 页面与假闭环清单冻结"；**AO canary 演练一项未达成**；GitHub Actions 实跑已完成且门禁全绿。分支保护已在 PUBLIC 仓库上启用并可阻止合并。

真实双节点、真实 AI、真实数据和生产级 CI 可以全部作为第二波，但不能在第二波之前把 W1 的 fixture 结果表述成真实模型或生产验收结论。
