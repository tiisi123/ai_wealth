# 演示日操作顺序

## W1 本地 / CI 启动（方案 B）

1. 启动 `pgvector/pgvector:pg16`（`docker compose up -d db` 或 CI 的 service 容器）。
2. 配置 `DATA_MODE=database`、`AI_MODE=fixture`、`DATABASE_URL`；fixture 模式不需要真实模型凭据，并会强制 `MODEL_NAME=fixture-generate-1`、`EMBEDDING_MODEL_NAME=fixture-deterministic-1536`、`KNOWLEDGE_VECTOR_DIM=1536`（覆盖 `.env` 中的真实模型名或其他维度，因为 database 模式的 `vector(1536)` migration 硬性要求 1536）。
3. 执行 `npm run migrate && npm run seed`。seed 会自动注入确定性 fixture 向量并激活 ACTIVE 知识版本，无需 `npm run knowledge:index`。
4. `npm test`（73 项通过）、`W1_DB_SMOKE=true npm run test:integration`（10 项真实 PG 集成）与 `npx playwright install chromium && npm run test:e2e`（15 项 PC/手机浏览器主流程）；`/ready` 应为 200 且 `ai_mode=fixture`、`checks.knowledge=true`。2026-11-04 实测：73/83、10/10、15/15；`ci-security` 本地扫描 91 个 tracked 文件 0 违规、audit 0 漏洞。
5. 此模式下页面显示"演示桩 fixture"，不得作为真实模型或生产验收结论。

## W1 本机 PostgreSQL + 编译 pgvector（无 Docker，2026-11-04 已验证）

Docker Desktop 引擎 API 在本机返回 500 时（`default` 与 `desktop-linux` 两个 context 均如此，`com.docker.service` 为 Stopped），可用本机 scoop PostgreSQL 16.1 替代。数据库名、角色、端口与 compose 完全一致，测试无需改配置。

| 步骤 | 做法 |
|---|---|
| 前置 | scoop PG 16.1 含 `lib/postgres.lib`、`include/server/port/win32_msvc`、`data/`；VS 2022 BuildTools 含 `cl.exe`/`nmake.exe`；5432 空闲；`data/pg_hba.conf` 为 trust |
| 取源码 | `git clone --depth 1 --branch v0.8.0 https://github.com/pgvector/pgvector.git` |
| 编译 | PowerShell 设置 MSVC 14.44.35207 与 Windows SDK 10.0.26100.0 的 `INCLUDE`/`LIB`/`PATH`，设 `PGROOT` 指向 scoop PG 根目录，执行 `nmake.exe /F Makefile.win`（**不要**经 `cmd.exe`，工具层会拦截） |
| 安装 | `vector.dll` → `lib/`；`vector.control` 与 `sql/vector--*.sql` → `share/extension/`；`src/{halfvec,sparsevec,vector}.h` → `include/server/extension/vector/` |
| 启动 | `pg_ctl start` 在本会话会挂起，改为后台任务直接运行 `postgres.exe -D <data> -p 5432` |
| 建库 | `CREATE ROLE wealth LOGIN PASSWORD 'wealth' SUPERUSER; CREATE DATABASE wealth_demo OWNER wealth;`（vector 不是 trusted extension，需超级用户执行 `CREATE EXTENSION`） |
| 验证 | `CREATE EXTENSION vector` 返回 0.8.0；随后 `npm run migrate && npm run seed` 与三层测试 |

回退：停止本机 PG 服务并删除上述扩展文件即可；源码放在系统临时目录，不污染项目仓库。

**测试隔离要点**：`ai_requests.request_id` 是全局主键，集成/E2E 的 AI 请求必须用 `randomUUID()`，固定 ID 在第二次运行会因属于不同 `session_id` 而返回 409。单元/API 测试使用 mock model client 并断言真实错误路径（模型未配置 503、维度不匹配），必须显式 `AI_MODE=real`；CI 的 `ci-unit-api` job 也显式设该值，不继承全局 `AI_MODE=fixture`。

## W2 演示日（双节点 + 真实模型）

1. 冻结并校验行内客户、持仓、产品和文档数据契约。
2. 启动 PostgreSQL/pgvector、共享文档卷和两个应用节点；先确认数据库、规则和模型配置就绪。
3. 执行 `npm run import:validate` 和 `npm run import:run` 导入演示数据，再执行 `npm run knowledge:index` 生成真实向量；向量激活后确认两个节点 `/ready` 均为 200。每个新数据包使用新的数据/知识版本，禁止覆盖当前 ACTIVE 版本。
4. 运行固定问题召回和 `npm run acceptance`；记录数据时点、知识版本、模型名和失败项。
5. 通过 Nginx 地址进入 PC/手机前端。停止任一应用节点后，刷新同一 `session_id` 验证另一节点继续会话。

如果模型或 Embedding API 超时、知识版本不匹配、数据来源过期或共享存储不可用，页面必须显示真实失败/过期状态。不要修改前端代码、重启节点或使用预置答案绕过问题。

W1 canary Phase 0 wiring check.
