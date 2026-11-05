# 财富智服演示 DEMO

版本基线：**V2.3 · 2026-11-04 · 83 项单元/API + DB 测试**（73 通过 + 10 集成）**与 15 项 Playwright 浏览器用例**。
架构规格见 `wealth-prototype-demo-architecture.md`，W1 范围与 P0 逐项完成状态见 `CONTEXT.md`，接口契约见 `docs/api-contract.md`，CI 门禁见 `docs/pr-merge-gate-ci.md`。

这是一个把**可替换前端、确定性业务规则、统一应用/AI 编排、共享数据与会话**分开的单仓库脚手架。在线应用在 W2 是 A/B 两个等价实例；权威会话、客户、持仓、产品、知识元数据、向量和规则全部进入共享 PostgreSQL + pgvector。

> **W1 基线（方案 B）**：`DATA_MODE=database` + `AI_MODE=fixture`。W1 已使用真实 PostgreSQL/pgvector，但数据集是固定 fixture，AI 是确定性桩。**W1 的 fixture 结果不得表述为真实模型或生产验收结论。**

## 两个模式开关

`DATA_MODE`（数据存在哪）与 `AI_MODE`（谁生成/嵌入）正交：

| 变量 | 取值 | 含义 |
|---|---|---|
| `DATA_MODE` | `database` | 业务数据、会话、规则、知识片段、向量、AI 审计落在共享 PostgreSQL |
| | `fixture` | 进程内内存 + JS fixture，仅用于无库时的本地 UI 旁路，**不是权威状态** |
| `AI_MODE` | `real` | 调用真实生成/Embedding API |
| | `fixture` | `FixtureModelClient` 确定性返回八类任务，响应带 `execution_mode: "fixture"` |

| 组合 | 用途 |
|---|---|
| `database` + `fixture` | **W1 当前基线**：单实例 + 真 PG + 演示桩 |
| `database` + `real` | W2 演示日：双节点 + 真实模型/Embedding |
| `fixture` + `fixture` | 无数据库时纯本地 UI 开发 |
| `fixture` + `real` | 无意义，避免使用 |

**生产必须 `DATA_MODE=database` 且 `AI_MODE=real`**；`NODE_ENV=production` 下启用 fixture AI 会直接拒绝启动。`AI_MODE=fixture` 会强制覆盖 `.env` 中的模型配置：`MODEL_NAME=fixture-generate-1`、`EMBEDDING_MODEL_NAME=fixture-deterministic-1536`、`KNOWLEDGE_VECTOR_DIM=1536`（database 模式的 `vector(1536)` migration 硬性要求该维度）。

## 为什么需要 pgvector，而不是普通 PostgreSQL

`db/migrations/001_initial.sql` 第 1 行 `CREATE EXTENSION vector`，第 109 行 `embedding vector(1536)`，第 117 行 `USING hnsw (embedding vector_cosine_ops)`；`knowledgeRepository` 的检索 SQL 使用 `<=>` 余弦算子。**普通 PostgreSQL 发行版（含本机 scoop 安装的 16.1）不含该扩展**，`npm run migrate` 会在第一条语句失败。

`pgvector/pgvector:pg16` 镜像把 PostgreSQL 16 与预编译好的 pgvector 扩展打包在一起，并用 `POSTGRES_DB/USER/PASSWORD` 自动完成 initdb。选它而不是本机 PG，是因为：

1. 不需要在 Windows 上为本地 PG 编译 pgvector（原生 Windows 构建需要 MSVC + PGXS，且必须与 PG 16.1 严格匹配）；
2. 与 `docker-compose.yml` 的生产定义、`.github/workflows/pr-merge-gate.yml` 的 `ci-db-smoke` service 容器是**同一个镜像**，本地/CI/生产一致；
3. 数据库在容器与命名卷 `wealth-db` 内，卸载不污染本机 PostgreSQL 实例。

若坚持使用本机 PostgreSQL：需自行安装 `vector` 扩展（`share/extension/vector.control`、`vector--*.sql` 与对应 `vector.dll`），启动本机 PG 服务，创建 `wealth_demo` 库与 `wealth` 用户，再设置 `DATABASE_URL` 指向它。**不要**为了绕开扩展而删除 vector 列或 hnsw 索引——那会改变 B 的检索语义。

## 目录

```text
public/                         可替换浏览器前端（当前承载原型需求基线）
src/components/
  business-rules/{domain,application,infrastructure}
  data-knowledge/{domain,application,infrastructure}
  sessions/{domain,application,infrastructure}
  ai-orchestration/{domain,application,infrastructure}
  demo-data/{application,infrastructure}
src/fixtures/                   JS fixture 数据、默认会话状态、确定性向量生成器
src/interfaces/http/            API 控制器和路由
src/platform/                   配置、HTTP、日志、数据库、共享文档、就绪检查
db/migrations/                  PostgreSQL + pgvector 结构（含 vector(1536)/hnsw）
db/seeds/                       可重复执行的基础规则与演示数据（W1/W2 共用）
scripts/seed/                   W1 fixture 知识向量注入与 ACTIVE 版本激活
scripts/import/                 行内标准数据包校验与幂等导入
scripts/knowledge/              真实 Embedding、向量索引与 STAGING→ACTIVE 激活（W2）
scripts/sync/                   产品基线后的实时增量同步
scripts/acceptance/             健康、前端/API 契约和数据可见性检查
deploy/nginx/                   A/B 两个应用节点的负载均衡入口（W2）
tests/unit/, tests/http/        不依赖外部服务的规则、会话、桩与 HTTP 契约测试
tests/integration/              真实 PostgreSQL 集成测试（需 W1_DB_SMOKE=true）
.github/workflows/              ci.yml（push 快速检查）、pr-merge-gate.yml（PR 门禁）
```

每个业务部件内部按 `domain → application → infrastructure` 分层。HTTP 层只做契约解析、调用应用服务和返回错误；数据库、文件系统和模型 API 只能从 infrastructure 适配器进入。模型客户端不会接收浏览器传入的系统提示词、模型地址或向量分数。

## 快速开始

### W1：单实例 + 真实 PostgreSQL + 演示桩（当前基线）

前置：Docker Desktop 已运行（或任何可提供 pgvector 扩展的 PostgreSQL 16）。

```bash
docker compose up -d --wait db          # 只起 db；W1 是单实例，不需要 app_a/app_b/nginx
cp .env.example .env                    # 保持 DATA_MODE=database、AI_MODE=fixture
npm ci
npm run migrate
npm run seed                            # 自动注入确定性向量并激活 ACTIVE 知识版本
npm test                                # 73 项通过，不依赖数据库/模型
W1_DB_SMOKE=true npm run test:integration   # 10 项，需已 migrate+seed 的库
npm start                               # http://localhost:3000
```

关键环境变量：

```text
NODE_ENV=development
DATA_MODE=database
AI_MODE=fixture
DATABASE_URL=postgres://wealth:wealth@localhost:5432/wealth_demo
DATABASE_SSL=false
KNOWLEDGE_VECTOR_DIM=1536
REQUIRE_MODEL=true
```

fixture 模式**不需要**真实模型凭据，也**不要**执行 `npm run knowledge:index`（该脚本要求真实 Embedding 配置，无凭据时第 5 行会直接报错）。`npm run seed` 可重复执行，幂等。

验证：`curl -s localhost:3000/ready` 应返回 200，且 `ai_mode=fixture`、`data_mode=database`、`checks.knowledge=true`。页面所有 AI 结果显示"演示桩 fixture"。

浏览器只保存 `session_id`；业务状态由 `app_sessions` 表提供，刷新可恢复。

### 仅本地 UI 旁路（无 PostgreSQL）

```bash
DATA_MODE=fixture AI_MODE=fixture REQUIRE_MODEL=false npm run dev
```

进程内 `Map` 数据重启即丢，不属于演示环境的权威状态，不用于验收。

### W2：双节点 + 真实模型（演示日）

准备 `.env`，填写经批准的真实生成/Embedding API（密钥只放在服务端环境），并设置 `AI_MODE=real`：

```powershell
docker compose up -d --build db app_a app_b
```

> **重要**：W1 的 `knowledge-demo-v1` 已被激活为 ACTIVE 且 `embedding_model=fixture-deterministic-1536`，注入的是**不具备语义的确定性伪向量**。W2 不能沿用该版本做真实召回：需先插入一个新的 `STAGING` 知识版本，再用真实 Embedding 重建向量并原子激活；`scripts/knowledge/index.js` 会在 ACTIVE 版本模型不匹配时拒绝复用并要求新版本。

```powershell
docker compose run --rm app_a npm run knowledge:index -- <new-staging-version>
docker compose up -d load_balancer
```

负载均衡入口 `http://localhost:8080`。两个实例都执行幂等迁移与 seed，会话通过共享 PostgreSQL 的乐观锁和幂等 `request_id` 保持一致；`/ready` 未通过时 Nginx 不把节点纳入流量。完整演示日顺序见 `docs/operations.md`。

导入、索引与实时同步脚本通过 PostgreSQL advisory lock 串行执行；校验失败不会激活半成品版本。

## 数据与知识一致性

`db/seeds/001_demo.sql` 与 `src/fixtures/*.js` 是两份数据表达，`tests/unit/fixture-parity.test.js` 校验产品/持仓/规则/知识片段 ID、持仓金额与收益率、版本标识一致。改动任一侧必须同时改另一侧。

SQL seed 中的知识版本保持 `STAGING` / `pending-real-embedding`，W2 的真实索引流程语义未被改写；W1 的激活由 `scripts/seed/fixtureKnowledge.js` 在 `AI_MODE=fixture` 时完成，包含向量维度校验与 Top-1 自召回回归。

## API 契约

- `GET /api/health`：`api_version` / `frontend_contract_version`、`ai_mode`、`data_mode`、依赖状态，不返回密钥或连接串。
- `GET /ready`：数据库、共享文档、ACTIVE 知识向量、规则、契约与必要模型配置均就绪才返回 200。
- `GET /api/demo-data`、`GET /api/knowledge`：当前授权范围内的客户/持仓/产品/数据时点/版本，以及活动知识片段。
- `POST /api/sessions`、`GET/PATCH /api/sessions/:id`：共享会话、版本号、乐观锁（旧版本 409）、重复 `request_id` 幂等。
- `POST /api/sessions/:id/commands`：`set_authorization`、`generate_allocation`、`generate_candidates`、`save_comparison`、`submit_care`、`create_reminder`。服务端权威状态只能由命令生成，通用 PATCH 不接受。
- `POST /api/ai/generate`：固定八类 `task_type`（`rule_match`、`assistant_qa`、`research_qa`、`diagnosis_explain`、`candidate_explain`、`product_explain`、`report_summary`、`writing_draft`）。返回文本、引用、证据 ID、数据/知识版本、模型和时延；`AI_MODE=fixture` 额外返回 `execution_mode: "fixture"`。证据不足、模型失败或引用校验失败直接报错，不返回预置成功答案。

`public/session-sync.js` 是前端适配层，替换为 React/Vue 等前端时只需继续遵守同一 API/会话契约。

## CI 门禁

`.github/workflows/pr-merge-gate.yml`（PR 与 merge_group 触发，主分支 required check）：

| Job | 内容 |
|---|---|
| `ci-static` | Node 20、`npm ci`、全量语法检查 |
| `ci-unit-api` | `npm test`（73 项）+ 覆盖率报告 artifact（仅报告） |
| `ci-db-smoke` | `pgvector/pgvector:pg16` service + `migrate` + 两次 `seed` + `test:integration`（10 项） |
| `ci-e2e-smoke` | pgvector service + `migrate`/`seed` + Chromium + `npm run test:e2e`（15 项 PC/手机主流程），失败上传 `playwright-report/` |
| `ci-ownership` | 按分支名声明的 Agent 身份校验 changed files 是否越界（`scripts/ci/check-ownership.mjs`，默认拒绝未登记路径） |
| `ci-security` | `npm audit --omit=dev --audit-level=high` + tracked 密钥 / `.gitignore` 规则扫描 |
| `ci-merge-gate` | `if: always()` 汇总六项，全部 success 才通过 |

`.github/workflows/ci.yml` 仅在 push 时做快速反馈。Playwright 配置见 `playwright.config.js`（pc / mobile 两个 project，webServer 自动拉起单实例应用并以 `/ready` 为就绪探针），用例见 `tests/e2e/`。本地运行前需已启动 pgvector 并完成 `migrate`/`seed`：

```bash
npx playwright install chromium
npm run test:e2e
```

`ci-security` 已落地（audit + 密钥扫描，纳入门禁汇总）；覆盖率按约定**仅上传报告 artifact、不设阈值不阻断**，待首次实跑拿到 CI 环境干净数字后再定阈值。本地已在真实 PostgreSQL 16.1 + pgvector 0.8.0 + Chromium 上跑通三层门禁（`npm test` 73/83、`test:integration` 10/10、`test:e2e` 15/15）；GitHub Actions 已实跑：PR #1 第二轮 run `42049768111` 的 6 个 job 与 `ci-merge-gate` 全绿，已合并到 `origin/main`（`5022fbe`）。仓库为 PRIVATE，免费计划下分支保护返回 403，required check 尚未启用。`ci-unit-api` 显式 `AI_MODE=real`，因为该 job 使用 mock model client 验证真实错误路径，不能被全局 fixture 模式改写。

本地若不想下载 Chromium，可设 `E2E_BROWSER_CHANNEL=chrome`（或 `msedge`）复用系统浏览器；CI 不设该变量，使用 `playwright install` 的锁定版本。

## 开源基础

| 组件 | 选型 | 用途 |
|---|---|---|
| Node.js + Express | MIT | 应用服务与静态前端托管 |
| PostgreSQL | PostgreSQL License | 业务、会话、规则、导入和审计数据 |
| pgvector | PostgreSQL License | 知识向量存储和 Top-K 检索 |
| Nginx | BSD-2-Clause | W2 双节点健康检查与负载分发 |
| Helmet / CORS | MIT | HTTP 安全响应头与受控跨域 |
| Pino / pino-http | MIT | 结构化日志，自动脱敏授权头和 API 密钥字段 |
| Zod | MIT | 环境变量与边界输入校验 |

## 运行边界

本仓库不连接真实交易、投保、理赔、赎回、客户触达或生产工单。私行、保险、配置和候选页面只输出演示范围内的事实、规则结果和待确认事项；任何模型输出都不能覆盖产品事实、数值、适当性结论或业务状态。fixture 知识库只覆盖 `fund` / `wealthplus` / `insurance` / `deposit` 四个片段，`wealth` / `bondfund` / `cash` 上的解释类任务会走"证据不足"错误路径，属预期的可见失败状态。

## 检查

```bash
npm run check
W1_DB_SMOKE=true npm run test:integration
npm run test:e2e                            # 需已启动 pgvector 并 migrate/seed
npm run acceptance -- http://localhost:8080   # W2 双节点
```

验收脚本只检查真实 HTTP 响应、数据/知识契约和 `/ready` 状态，不虚构生产 QPS、模型准确率或交易成功。
