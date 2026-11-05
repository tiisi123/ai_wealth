# PR Merge-Gate CI 自动化测试方案

## 1. 目标与边界

本方案定义多 Agent 并行开发场景下，每个 Pull Request 必须通过的自动化测试门禁。GitHub Actions 负责执行确定性的质量检查，orchestrator.inc 负责观察 PR、把失败检查路由回拥有该 PR 的 Worker，并在 Worker 修复后通过新提交重新触发 CI。

本方案包含：

- PR 提交后的静态检查、单元/API 测试、最小数据库冒烟测试、浏览器冒烟测试和安全检查；
- 多 Agent 的测试编写分工、工作树和 PR 依赖关系；
- required check、Merge Queue、测试产物和失败回传约定；
- 最小真实数据库测试与完整数据库集成测试的边界。

本方案不包含：

- Nightly 全量 AI 评估；
- 真实模型或真实 Embedding 调用；
- k6 压测；
- 全浏览器矩阵；
- 双节点故障切换；
- Docker Compose 预发布验收；
- staging 环境和真实客户数据。

完整数据库集成、双节点、知识索引和故障切换应在预发布前的集成流水线中执行。PR CI 只保留能够快速发现高风险回归的最小真实数据库测试。

## 2. 当前项目基线

当前项目是 Node.js 20、Express 5、PostgreSQL/pgvector 应用，已有：

- tests/unit/：规则、会话、AI 编排和数据导入校验；
- tests/http/：Supertest HTTP 契约和主要业务流程；
- npm test：73 项单元/API 测试；W1_DB_SMOKE=true npm run test:integration：10 项真实 PostgreSQL 集成测试；npm run test:e2e：15 项 Playwright 浏览器用例；
- .github/workflows/ci.yml：npm ci 和 npm run check。

W1 已补齐：

- 真实 PostgreSQL/pgvector 集成测试（`tests/integration/`，由 `ci-db-smoke` 执行）；
- `ci-static`、`ci-unit-api`、`ci-db-smoke` 与 `ci-merge-gate` 工作流（`.github/workflows/pr-merge-gate.yml`）。

当前仍缺少：

- 覆盖率门禁；
- `ci-security` 与依赖变更检查；
- 面向多 Agent 的测试编写和 PR 依赖约定。

## 3. CI 总体流程

~~~mermaid
flowchart LR
    A[Agent Worker 独立 worktree] --> B[Draft/正式 PR]
    B --> C[ci-static]
    B --> D[ci-unit-api]
    B --> E[ci-db-smoke]
    B --> F[ci-e2e-smoke]
    B --> G[ci-security]
    C --> H[ci-merge-gate]
    D --> H
    E --> H
    F --> H
    G --> H
    H --> I[Branch Protection / Merge Queue]
    E -.失败检查名称和链接.-> J[orchestrator.inc]
    F -.失败检查名称和链接.-> J
    J --> K[原 Worker 修复并 push]
    K --> B
~~~

CI 工作流建议命名为 .github/workflows/pr-merge-gate.yml，使用以下触发器：

~~~yaml
name: pr-merge-gate

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
  merge_group:
    types: [checks_requested]

permissions:
  contents: read

concurrency:
  group: pr-ci-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
~~~

每次 PR 新提交只保留最新一次运行。不要对 required workflow 使用 paths 过滤，避免某类文件变更导致必需检查没有报告状态。

启用 GitHub Merge Queue 时必须监听 merge_group，这样多个 Agent 的 PR 会在组合后的临时分支上再次执行相同门禁。

## 4. PR Merge-Gate Job

### 4.1 ci-static

目的：尽早发现不依赖运行时的错误。

检查内容：

~~~bash
npm ci
node --check src/server.js
node --check src/app.js
npm run lint
~~~

如果暂时没有 ESLint 配置，先保留语法检查，随后把 npm run lint 加入 required gate。

### 4.2 ci-unit-api

目的：验证业务规则、应用服务和 HTTP 边界，不依赖真实数据库或真实模型。

检查内容：

~~~bash
npm run test:coverage
~~~

建议在 package.json 中增加：

~~~json
{
  "scripts": {
    "test:coverage": "node --experimental-test-coverage --test-coverage-lines=75 --test-coverage-branches=60 --test-coverage-functions=75 --test"
  }
}
~~~

覆盖率门禁形态（2026-11-05 拍板）：**仅报告，不阻断**。`ci-unit-api` 用 Node 原生 `--experimental-test-coverage` 生成报告并上传 `coverage-report.txt` artifact，不设阈值、不纳入汇总判断。原因是本地实测 59.99% line 受三个因素干扰：测试文件本身被计入、10 项集成测试在无本机 PG 时跳过、CI 用 Node 20 与本地 Node 22 的报告参数不完全一致。等 §9 首次实跑拿到「CI 环境、集成测试全跑、排除 tests/」的干净数字后，再定阈值并转为硬门禁。

单元/API 测试必须覆盖以下业务不变量：

- 配置比例总和为 100；
- 候选满足风险、期限、流动性和可售状态；
- 浏览器不能覆盖服务端客户、授权、持仓和模型字段；
- 相同 request_id 可以重放但不会重复调用模型；
- 旧 session_version 返回 409；
- 撤销授权会清理方案、候选和敏感数据；
- AI 引用必须属于本次请求的证据白名单。

### 4.3 ci-db-smoke

目的：在 PR 阶段验证真实 PostgreSQL/pgvector 的基本兼容性。完整数据库集成测试不全部放入此 Job。

服务容器：

~~~yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    env:
      POSTGRES_DB: wealth_demo
      POSTGRES_USER: wealth
      POSTGRES_PASSWORD: wealth
    ports:
      - 5432:5432
~~~

测试环境：

~~~text
NODE_ENV=test
DATA_MODE=database
AI_MODE=fixture
W1_DB_SMOKE=true
DATABASE_URL=postgres://wealth:wealth@localhost:5432/wealth_demo
DATABASE_SSL=false
REQUIRE_MODEL=true
KNOWLEDGE_VECTOR_DIM=1536
~~~

Job 步骤：

~~~bash
npm ci
npm run migrate
npm run seed
npm run test:integration
~~~

最小测试集：

1. 空数据库可以完成全部 migration；
2. seed 可以重复执行；
3. migration 创建 vector(1536) 和所需约束；
4. session 可以真实写入和读取；
5. 乐观锁冲突返回 409；
6. 重复 request_id 不产生第二次状态变更；
7. 事务失败后不会留下半写入数据；
8. ACTIVE data/knowledge version 查询结果正确。

该 Job 不执行 knowledge:index，不调用真实 Embedding API，也不要求数据库知识版本已经具备真实向量。

### 4.4 ci-e2e-smoke

目的：验证前端、HTTP API 和关键用户流程之间的连接。

测试环境：

~~~text
NODE_ENV=test
DATA_MODE=database
AI_MODE=fixture
REQUIRE_MODEL=true
DATABASE_URL=postgres://wealth:wealth@localhost:5432/wealth_demo

E2E_PORT=3100
~~~

先准备数据库，再由 Playwright 的 webServer 自动拉起单实例应用（`/ready` 作为就绪探针）：

~~~bash
npm run migrate
npm run seed
npx playwright install --with-deps chromium
npm run test:e2e
~~~

首阶段只使用 Chromium，保留以下流程：

1. 页面加载、api-version / frontend-contract-version 标记、fixture AI 与 `/ready`；
2. 创建 session 并刷新恢复同一 session_id；
3. 旧会话版本 409；
4. 证据不足 422（不返回预置成功答案）；
5. 手机闭环：助手（演示桩标注）→ 配置 → 候选 → 比较 → 投后陪伴；
6. 撤销授权清理方案、候选与比较；
7. PC 闭环：研究（演示桩标注）→ 配置 → 候选 → 比较 → 保存，刷新后保持。

失败时上传：

~~~text
playwright-report/
test-results/
server.log
~~~

### 4.5 ci-security

2026-11-05 已落地，并纳入 `ci-merge-gate` 作为第 6 项：

~~~bash
npm audit --omit=dev --audit-level=high
node scripts/ci/check-secrets.mjs
~~~

`check-secrets.mjs` 扫描 `git ls-files` 的 tracked 文件：禁止 `.env` / `qwen.key` / `*.pem|p12|pfx|key` / `id_rsa` 被跟踪，检查 `.gitignore` 是否仍包含 `.env` 与 `qwen.key`，并在文本文件中匹配私钥头、`sk-` 模型密钥与 AWS access key 模式。示例连接串（`postgres://wealth:wealth@...`）不误报；逻辑导出为 `checkSecrets()` 供 `tests/unit/security-check.test.js` 覆盖。本地实测：91 个 tracked 文件 0 违规、`npm audit` 0 漏洞。

**后续项（本轮不启用）**：`actions/dependency-review-action` 需等基线 PR 合并后再加（base 分支尚无 `package-lock.json`，无法做依赖 diff）；CodeQL 需独立 workflow 与仓库侧配置。任何 `.env`、本地模型密钥和测试真实数据都不得进入 CI 日志或构建产物。

### 4.6 ci-merge-gate

该 Job 使用 if: always() 汇总前面所有 Job。只有以下结果全部为 success 才返回成功：

~~~text
ci-static
ci-unit-api
ci-db-smoke
ci-e2e-smoke
ci-ownership
ci-security

覆盖率仅上传报告 artifact，不设阈值、不参与汇总判断；等首次实跑拿到干净数字后再决定是否转为硬门禁。
~~~

建议把 ci-merge-gate 设置为主分支保护的核心 required check，同时保留各子 Job 的独立状态，便于定位失败来源。

## 5. 测试编写工作与并行 Agent 分工

测试编写不是开发完成后的补充工作，而是独立的并行开发工作包。

### 5.1 Agent 分工

| Agent ID（分支 `ao/<id>/<topic>`） | 工作内容 | 唯一可写路径 | 产出 |
|---|---|---|---|
| `frontend-lead` | 分发器、路由表、页面渲染、注册表、加载顺序 | `public/app.js`、`public/actions-registry.js`、`public/index.html`、`public/style.css` | 前端骨架 PR |
| `frontend-navigation` | 导航与 UI 动作 | `public/actions/navigation.js` | 动作 PR |
| `frontend-research` | 投研 / AI / 写作动作 | `public/actions/research.js` | 动作 PR |
| `frontend-diagnosis` | 诊断与弹窗动作 | `public/actions/diagnosis.js` | 动作 PR |
| `frontend-flow` | 配置 / 候选 / 陪伴动作 | `public/actions/flow.js` | 动作 PR |
| `contract` | 会话状态、命令契约、HTTP 路由、fixture | `src/components/sessions/`、`src/fixtures/`、`src/interfaces/http/`、`src/compositionRoot.js`、`src/config/`、`public/demo-data.js`、`public/session-sync.js` | 契约 PR |
| `backend` | AI 编排、规则、知识服务、平台 | `src/components/{ai-orchestration,business-rules,data-knowledge,demo-data}/`、`src/platform/`、`src/app.js`、`src/server.js` | 后端 PR |
| `data` | migration、seed、导入 / 索引 / 同步 | `db/`、`scripts/seed/`、`scripts/import/`、`scripts/knowledge/`、`scripts/sync/`、`scripts/migrate.js`、`scripts/seed.js` | 数据 PR |
| `test-unit` | 单元与 HTTP 测试 | `tests/unit/`、`tests/http/` | 测试 PR |
| `test-db` | 真实 PG 集成测试 | `tests/integration/` | 测试 PR |
| `test-e2e` | Playwright 配置与浏览器用例 | `tests/e2e/`、`playwright.config.js`、`scripts/acceptance/` | E2E PR |
| `ci` | workflow、依赖、部署、ownership 规则 | `.github/`、`package.json`、`package-lock.json`、`scripts/ci/`、`docker-compose.yml`、`Dockerfile`、`deploy/`、`.env.example`、`.gitignore` | CI PR |
| `docs` | 规格、契约与操作文档 | `docs/`、`CONTEXT.md`、`README.md`、`wealth-prototype-demo-architecture.md`、`public/requirements.js` | 文档 PR |

**硬控制**：`ci-ownership` 在 PR 阶段按分支名解析 agent id，用 `git diff --name-only origin/<base>...HEAD` 取改动文件，逐条按最长前缀匹配 `scripts/ci/check-ownership.mjs` 的 `OWNERSHIP` 表；越界或未登记路径直接 fail 并由 `ci-merge-gate` 拦截合并，merge_group 阶段跳过（PR 已校验）。新增路径必须先由主 Agent 登记，默认拒绝。

每个 Agent 使用独立 Git worktree、由 AO 分配的独立分支 `ao/<agent-id>/<topic>`（Worker 不可自选）和独立 PR；PR 模板含 Definition of Done。

### 5.2 并行开发规则

测试 Agent 可以在开发 Agent 同时实现功能时开始工作：

- 单元测试依据业务规则和函数契约编写；
- HTTP 测试依据 API contract 编写；
- DB 测试依据 migration 和 Repository 契约编写；
- E2E 测试依据页面流程和 API 行为编写；
- CI Agent 可以独立准备 workflow 和测试脚本。

测试应优先验证外部行为、业务不变量和安全边界，不绑定不必要的私有实现细节。

### 5.3 PR 依赖处理

如果测试依赖开发 Agent 尚未合并的新接口，使用 stacked PR：

~~~text
codex/feature-session-command
        ↓
codex/feature-session-command-tests
~~~

或者由开发 Agent 在最终 PR 中 cherry-pick 测试 Agent 的提交。

测试 PR 如果单独基于 main 会因实现尚不存在而失败时，不应使用 continue-on-error。应改为：

1. 以开发分支为 base；
2. 等实现接口稳定后重新运行；
3. 或将测试提交合并到功能 PR；
4. 最终以包含实现和测试的组合提交进入 Merge Queue。

## 6. Orchestrator.inc 闭环约定

Orchestrator.inc 负责 PR 关联和失败回传，CI 不嵌入 Agent 修复逻辑。`orchestrator.inc` 与 `ao session claim-pr` 由 WorkBuddy 平台侧提供，**不在本仓库内**；本仓库只提供 CI 配置、PR 与证据收集。

流程：

1. Worker 创建 PR，Orchestrator 自动发现并关联；
2. 如果 PR 已存在，使用 ao session claim-pr <pr-number-or-url> 绑定；
3. GitHub Actions 报告失败 Job；
4. Orchestrator 把失败检查名称、运行链接和 PR 身份发送给原 Worker；
5. Worker 查看 CI 日志和 artifact，修复代码；
6. Worker push 新 commit；
7. pull_request.synchronize 触发新的 Merge-Gate CI；
8. 所有检查通过后进入 Merge Queue。

Orchestrator 当前会记录已经发送过的失败检查，不会反复发送内容不变的失败通知。CI 因此必须保持 Job 名称稳定，并上传可访问的日志和测试报告。

CI 不向不受信任的 PR 测试代码提供写权限或生产密钥。Orchestrator 的 GitHub 认证和 PR 操作使用其自身的 SCM 连接。

## 7. 预发布前集成流水线的边界

以下内容不属于 PR Merge-Gate，但必须在预发布前执行：

- 全部数据库 Repository 测试；
- 数据包导入和产品同步；
- knowledge:index 和真实 Embedding；
- 知识版本激活；
- A/B 两个应用节点；
- Nginx 路由和节点故障切换；
- 数据库连接恢复；
- /ready 和 scripts/acceptance/checks.js；
- 真实模型端到端调用。

这样可以让 PR CI 保持快速和确定性，同时保留对数据库、知识库和双节点运行环境的完整验证。

## 8. 完成标准

PR Merge-Gate CI 方案完成的判断条件：

- .github/workflows/pr-merge-gate.yml 同时监听 pull_request 和 merge_group；
- ci-static、ci-unit-api、ci-db-smoke、ci-e2e-smoke、ci-ownership、ci-security、ci-merge-gate 均有稳定 Job 名称（W1 已达成）；覆盖率门禁仅报告、不阻断；
- ci-merge-gate 能正确汇总失败状态；
- migration、seed、session、乐观锁和幂等至少有真实数据库测试；
- 关键前端流程有 Playwright 冒烟测试（15 项用例已在真实 PostgreSQL + Chromium 跑绿）；
- 测试失败可以通过 Orchestrator 回传到原 Worker；
- 主分支禁止绕过 required check；
- 多个独立 PR 通过 Merge Queue 的组合验证后才能合并。



## 9. GitHub Actions 首次实跑（2026-11-05 已执行）

**执行结果**：PR #1 创建并挂 `baseline` label；第一轮 run `42049158170` 因 `ci-security` 扫到 `tests/unit/security-check.test.js` 里的假 PEM 字面量而红，修复 commit `e3aff11` 触发 `synchronize`；第二轮 run `42049768111` 的 6 个 job 与 `ci-merge-gate` 全绿；PR 以 `--merge` 合并，`origin/main` = `5022fbe`。以下保留为可复现的操作记录。

前置事实（执行前）：远端 `origin/main` 停在 `d5fd39e`。`gh` 位于 `C:\Program Files\GitHub CLI\gh.exe`（不在 PATH，用完整路径调用），已登录 `tiisi123` 且 `viewerPermission=ADMIN`，scopes 含 `repo` / `workflow`。

1. 统一提交剩余改动（一个 commit）。基线一律以 `origin/main` 的 HEAD 为准；`w1-baseline-2026-11-05` / `w1-baseline-2026-11-04` 两个 tag 已删除，不再作为分叉依据（旧 tag 的 tree 含过时的分支保护描述）。
2. 建分支并推送：`git switch -c ao/orchestrator/w1-baseline && git push -u origin ao/orchestrator/w1-baseline`。
3. 用 `gh pr create --base main --head ao/orchestrator/w1-baseline --label baseline` 创建 PR（label 在创建时即挂上，首次 CI run 就能读到 `PR_LABELS`）。首个 PR 包含跨 13 类 owner 的全部改动，无法归属单一 Agent；`ci-ownership` 检测 `baseline` label 后打印豁免说明并 exit 0（job 仍为 success，`ci-merge-gate` 汇总逻辑不变）。此豁免仅用于一次性初始化 PR，之后所有 Worker PR 必须走正常 ownership 校验。
4. **已完成（2026-11-05）**：仓库删除重建并改为 PUBLIC 后，`gh api -X PUT repos/tiisi123/ai_wealth/branches/main/protection` 成功；`ci-merge-gate` 为 required check（`strict=true`、`enforce_admins=true`、线性历史、禁 force push）。首次调用曾返回 `403 Repository has been locked`（可见性变更后的临时锁定），重试即通过。
5. 观察 6 个 job：`ci-static`、`ci-unit-api`（含覆盖率报告 artifact）、`ci-db-smoke`（pgvector service + migrate + 两次 seed）、`ci-e2e-smoke`（Chromium 下载 + 15 项 E2E）、`ci-ownership`、`ci-security`（audit + 密钥扫描）。CI 使用 Docker pgvector 镜像与 Ubuntu runner，正好验证本机 Docker 引擎 API 500 时无法覆盖的路径；覆盖率报告用于事后定阈值，不影响本次合并。
6. 合并后 Worker 从新 `main` 分叉，分支统一 `ao/<agent-id>/<topic>`、由 AO 分配；越界改动在 CI 阶段被拦。随后执行 P0 #7 的 AO canary 演练（故意失败 → 回传 → 修复 → 重触发 → 门禁拦截）。

观察命令：`gh pr checks 1`、`gh run watch <run-id> --exit-status`、`gh run download <run-id> -n coverage-report`。

## 10. AO canary 演练方案（已定，尚未执行）

执行时机：§9 首次实跑通过、required check 已勾选之后，Worker 从新 `main` 分叉。

**形态（2026-11-05 拍板）**：平台 AO **真闭环**——`orchestrator.inc` 与 `ao session claim-pr` 属 WorkBuddy 平台侧能力，由平台发起 Worker、关联 PR 与自动回传失败；本仓库侧只负责 CI 配置、故意失败 PR 与证据收集。DoD 要求完整 5 步自动闭环，**不接受人工模拟回传作为通过**；平台侧未接入时演练判为未完成而非通过。

**故意失败注入点**：`ci-ownership` 越界。分支 `ao/frontend-flow/canary-ownership`，在 PR 里对 `public/app.js`（owner 为 `frontend-lead`）加一处无害注释并 push。选它的理由：直接验证本次新增的硬控制、失败日志明确（`out of scope`）、修复只需 revert 一处注释、不污染测试代码；其余 5 个 job 照常跑绿，可顺带验证「单 job 红 → `ci-merge-gate` 红 → 禁止合并」的传导链。

| 步 | 动作 | 可观察证据 |
|---|---|---|
| 0 | 前置确认，AO 分配分支并创建独立 worktree | `git worktree list`；分支符合 `ao/<agent-id>/<topic>` |
| 1 | Worker 创建**正式** PR（非 draft，触发 `pull_request.opened`） | PR URL；6 个 job 全部被触发 |
| 2 | 注入越界改动并 push | `ci-ownership` 红且输出含 `out of scope`；`ci-merge-gate` 红；合并被 required check 拦截 |
| 3 | 平台 Orchestrator 把失败 job 名、运行链接、PR 身份自动回传**原 Worker** | 平台通知记录与时间戳、`claim-pr` 绑定记录 |
| 4 | Worker `git revert` 越界改动并 push **新 commit** | `pull_request.synchronize` 触发新一轮 CI；6 job 全绿、`ci-merge-gate` success |
| 5 | 对比红/绿状态下的合并能力 | 红状态合并被拒、绿状态可合并的证据 |

**两条硬约束**：

1. canary PR **不得**打 `baseline` label——否则 `ci-ownership` 豁免，故意失败不会发生（该豁免仅用于 §9 的一次性初始化 PR）。
2. 修复必须由**新 commit** 触发 `synchronize` 重跑，不能用手动 rerun 冒充；`ci-merge-gate` 与 6 个子 job 名称保持稳定，否则平台去重逻辑会漏发通知（§6）。

**平台侧前置（由用户在平台确认）**：`orchestrator.inc` 已接入本仓库；`ao session claim-pr <pr-url>` 可用；Worker 已分配并能接收失败通知；失败检查名称与运行链接可回传。

**DoD（全部满足才算闭环通过）**：

- 5 步各有一条可追溯证据：PR URL、Actions run ID、失败 job 名、回传时间戳、修复 commit SHA；
- 失败确实来自 `ci-ownership` 且输出含 `out of scope`，不是环境噪声；
- 平台侧自动把失败回传原 Worker（非人工转述），并留下通知记录；
- 红状态下 `ci-merge-gate` 为 required check 且合并被拒；修复后 `synchronize` 新一轮 6 job 全绿、可合并；
- 演练记录（含上述证据链接）追加到本节末尾，演练 PR 保留链接。

**未通过时**：不启动并行研发；先修复门禁或平台接入，再重跑 canary。

### 10.1 AO canary 演练记录（2026-11-05 执行，闭环通过）

**结论**：平台 AO **真闭环通过**。5 步均由平台与 Worker 自动完成；失败回传由 AO 平台自动注入**原 Worker** 会话，编排器未人工转述失败内容。演练通过前未启动并行研发。

**执行形态**：`orchestrator.inc` 等价实现为本地 AO 桌面版 daemon：按 URL 绑定仓库 `https://github.com/tiisi123/ai_wealth.git`（PUBLIC，删除重建后 repo id `1447192384`，基线 `origin/main` = `3a702cf`）；`ao session claim-pr` 建立 PR↔Worker 绑定；`auto_inject_ci=true`（默认）驱动失败回传与去重（`pr.last_nudge_signature` / `pr_checks` / `notifications`）。平台 SCM 连接为本地已登录 `gh` token，PR 与 check runs 由 daemon 通过 GraphQL `statusCheckRollup` 轮询观察（无需 repo webhook）。

**阶段 0：最小接入验证**（docs Worker `ai_wealth-5`，分支 `ao/docs/canary-wiring-check`）

- PR：https://github.com/tiisi123/ai_wealth/pull/3 （正式、非 draft、零 label，head `bbaf21a`）
- Actions run：`42070583783`（`pr-merge-gate`）、`42070542270`（`ci`）
- `ci-ownership` 输出：`ci-ownership OK: agent=docs, 1 changed file(s) all within its ownership scope`（job `127397074925`）
- 6 个 job + `ci-merge-gate` 全绿；`mergeStateStatus` 创建时 `BLOCKED` → 全绿后 `CLEAN`
- 平台侧观察证据：AO `pr` 表出现 PR #3 记录（`session_id=ai_wealth-5`、`auto_inject_ci=1`、`ci_observed_at` 时间戳）；`pr_checks` 表逐条记录 6 个 job、`ci-merge-gate` 与 `test`（含 Actions job URL、conclusion、`created_at`）；`ao session claim-pr` 绑定记录 "Claimed a pull request"。三项成立后方进入阶段 1。

**阶段 1：canary 五步**（frontend-flow Worker `ai_wealth-6`，分支 `ao/frontend-flow/canary-ownership`；演练 PR 保留链接：https://github.com/tiisi123/ai_wealth/pull/4 ）

| 步 | 动作 | 可追溯证据 |
|---|---|---|
| 0 | 编排器分配分支并创建独立 worktree | `git worktree list` 出现 `C:/Users/jerry/.ao/data/worktrees/ai_wealth/ai_wealth-6` @ `3a702cf` `[ao/frontend-flow/canary-ownership]`；分支符合 `^ao/([a-z0-9-]+)/.+$`，agent-id `frontend-flow` 在 13 类白名单内 |
| 1 | Worker 创建**正式** PR（非 draft），触发 `pull_request.opened` | PR #4 https://github.com/tiisi123/ai_wealth/pull/4 ；head `43a2334bbc6152aa401ed616940d21195a2a43eb`；run `42072437995` 的 6 个 job 与 `ci-merge-gate` 全部被触发且 success；`ao session claim-pr` 绑定 PR #4 → `ai_wealth-6` |
| 2 | 注入越界改动并 push | 越界 commit `ae7fd38f15f863939a92360a653518da48aa4075`（`public/app.js` 加 1 行无害注释），push 于 `2026-11-05 17:16:33 UTC`（fast-forward `43a2334..ae7fd38`，无 force）；`synchronize` run `42073022764`：`ci-ownership` **failure**（job `127405725733`，日志 `ci-ownership FAILED for frontend-flow: 1 of 2 changed files are out of scope` / `public/app.js  ->  owner: frontend-lead, branch agent: frontend-flow`）、`ci-merge-gate` **failure**、其余 5 个 job success；`mergeStateStatus=BLOCKED`（required check `ci-merge-gate` 拒绝合并） |
| 3 | 平台自动把失败 job 名、run 链接、PR 身份回传**原 Worker** | 回传时间戳 `2026-11-05 17:17:11.629 UTC`；AO `conversation_messages` seq 103（Worker `ai_wealth-6`，`origin=automation`、无 sender session，即非编排器人工转述）原文：`CI is failing on PR #4 "chore: W1 AO canary ownership drill" (ao/frontend-flow/canary-ownership → main).` / `Failed: ci-ownership (failed)` / `Failure URL: https://github.com/tiisi123/ai_wealth/actions/runs/42073022764/job/127405725733` + 日志尾部（含 `public/app.js -> owner: frontend-lead, branch agent: frontend-flow`）。去重记录 `pr.last_nudge_signature` 含 `ci:<PR#4>` 反应键与 `attempts:1`（§6：内容不变不重复发送）；`pr_checks` 中 `ci-ownership failed` 记录时间 `17:16:37 UTC`，`ci_observed_at=17:17:07 UTC`。Worker 收到该平台消息后自动进入修复（`conversation_messages` seq 105） |
| 4 | 原 Worker `git revert` 越界改动并 push **新 commit** | revert commit `f6cd8cc52bc8faa5d2bd411e59e912483cad127f`（`Revert "chore(canary): add stage-2 out-of-scope marker in app entry"`，父提交 `ae7fd38`，仅还原 `public/app.js`）；新 `synchronize` run `42073222609`（event `pull_request`，head `f6cd8cc`）：6 个 job 与 `ci-merge-gate` 全绿；`mergeStateStatus=CLEAN` |
| 5 | 对比红/绿两种状态的合并能力 | 红（run `42073022764`）：`ci-merge-gate=failure`、`mergeStateStatus=BLOCKED` → 合并被 required check 拒绝；绿（run `42073222609`）：`ci-merge-gate=success`、`mergeStateStatus=CLEAN` → 可合并。分支保护：`ci-merge-gate` required、`strict=true`、`enforce_admins=true`、线性历史、禁 force push |

**硬约束核验**：canary PR 全程零 label（未打 `baseline`，该 label 在新仓库中已不存在）；修复由新 commit 触发 `synchronize`，非手动 Re-run；6 个子 job 与 `ci-merge-gate` 名称保持稳定；未修改 `ci-ownership` 规则、`.github/workflows`、分支保护或 required check；失败回传由平台自动完成，编排器仅在红状态之前发送过一次阶段推进信号（未包含失败内容），红状态下未发送任何修复指令或失败转述。

**DoD 核对**：5 步各有一条可追溯证据（PR URL、Actions run ID、失败 job 名、回传时间戳、修复 commit SHA）✅；失败确实来自 `ci-ownership` 且输出含 `out of scope`，非环境噪声 ✅；平台自动回传原 Worker（非人工转述）并有通知记录 ✅；红状态合并被 required check 拒绝、修复后 `synchronize` 新一轮 6 job 全绿可合并 ✅；本记录追加到 §10 末尾并保留演练 PR 链接 ✅。

**演练 PR 保留链接**：canary PR #4 https://github.com/tiisi123/ai_wealth/pull/4 （保留、未合并）；演练记录 PR #3 https://github.com/tiisi123/ai_wealth/pull/3 （docs/ owner 分支 `ao/docs/canary-wiring-check`，合并入 main）。

## 11. AO 平台交接清单（2026-11-05）

> **历史重写说明（2026-11-05）**：为移除随初始提交带入的三份内部文档，仓库历史已压成**单一初始 commit**。上文及本文件中出现的 `d5fd39e`、`c0142fa`、`78ebbfa`、`beaf08a`、`e3aff11`、`5022fbe`、`25e8713`、PR #1、两轮 Actions run 编号等，均为**旧历史中的事实记录**，对应 commit / PR / tag / run 在当前仓库已不存在。当前一律以 `origin/main` 的 HEAD 为唯一基线，AO Worker 必须从它创建 worktree；`w1-baseline-2026-11-05` / `w1-baseline-2026-11-04` 两个 tag 均已删除，仅作历史记录，不得作为分叉依据（旧 tag 的 tree 含过时的分支保护描述）。

仓库已删除重建并改为 PUBLIC，基线为单一 commit `2d9ad15`；以下为转交 WorkBuddy AO 平台侧的材料。

- **基线**：`origin/main` 的 HEAD（以远端为准），AO Worker 必须从它创建 worktree。`w1-baseline-2026-11-05` tag 已删除，其 tree 含过时的分支保护描述，**不得用于分叉**；旧 PR / merge commit / 旧 tag 已随仓库重建消失。
- **必须先处理**：现存 AO orchestrator worktree `~/.ao/data/worktrees/ai_wealth/orchestrator/ai_wealth-orchestrator` 仍停在 `d5fd39e`。转场前须用新基线重建，否则 Worker 从缺全部改动的旧代码分叉。
- **目录边界**：`scripts/ci/check-ownership.mjs` 的 13 类 agent id 与 `OWNERSHIP` 最长前缀表；分支统一 `ao/<agent-id>/<topic>`，由 AO 分配、Worker 不可自选；越界或未登记路径默认拒绝。
- **门禁**：6 个 job（`ci-static`、`ci-unit-api`、`ci-db-smoke`、`ci-e2e-smoke`、`ci-ownership`、`ci-security`）+ `ci-merge-gate` 汇总。`baseline` label 豁免仅用于一次性初始化 PR，Worker PR 不适用（canary PR 绝不能带此 label）。
- **覆盖率**：仅上传 `coverage-report.txt` artifact，不设阈值、不阻断。
- **分支保护已启用**：`ci-merge-gate` 为 required check，`ci-ownership` 能阻止越界 PR 合并；§10 canary 的「红状态合并被拒」DoD 现已可达成。仓库为 PUBLIC，三份内部文档已随旧仓库删除而清除（旧 commit SHA 经 API 验证返回 422）。
- **平台侧待确认**：`orchestrator.inc` 是否接入本仓库、`ao session claim-pr` 入口、Worker 分配方式与失败通知通道；本机未找到 `ao` CLI 与 `orchestrator.inc` 实体。
- **AO canary**：方案见 §10，故意失败注入点为 `ci-ownership` 越界；DoD 要求平台自动回传原 Worker，不接受人工模拟。
