# 工程边界与分层

本仓库是一个 GitHub 单工程，不把四个架构部件拆成在线微服务。部署单元只有两个完全相同的 Node.js + Express 应用实例；`scripts/` 是受控离线任务，不作为第三个在线服务。

## 部件边界

| 架构部件 | 工程位置 | 允许做什么 | 不允许做什么 |
|---|---|---|---|
| 可替换前端 | `public/` | 展示、输入、API 调用、异常提示、临时筛选 | 直连数据库、保留权威客户/持仓/方案状态、假装模型成功 |
| 确定性业务规则 | `src/components/business-rules` | 授权、风险/期限/流动性校验、配置、候选、存款计算 | 接受模型改写动作、用相似度替代条件校验 |
| 统一应用与 AI 编排 | `src/components/ai-orchestration`、`src/interfaces/http` | 读取授权会话、拼装证据、Embedding/Top-K、固定任务提示、响应校验 | 任意提示词接口、把模型事实写回产品主数据、证据不足时兜底生成 |
| 共享数据与会话 | `db/`、`src/*/infrastructure` | PostgreSQL、pgvector、共享文档目录、版本、乐观锁、幂等 | 使用节点内存作为生产权威状态 |

W1（方案 B）已将共享数据与会话前置到真实 PostgreSQL：`DATA_MODE=database` 下客户、持仓、产品、规则、知识片段、会话、AI 审计全部落库，单实例后端连接同一数据库。`AI_MODE=fixture` 只替换生成/Embedding 适配器（`FixtureModelClient`），不改业务规则、证据校验或会话幂等。`scripts/seed.js` 在该模式下注入确定性 1536 维向量并激活 ACTIVE 知识版本；真实 Embedding、`knowledge:index` 的 STAGING→ACTIVE 导入、双节点与故障切换仍属于后续流水线。fixture 向量不具备语义，不得用于召回质量评测。

## 请求路径

```text
Browser
  -> Nginx
  -> app_a/app_b
  -> interface/http controller
  -> application service
  -> domain rule + repository/model adapters
  -> PostgreSQL/pgvector/shared documents/approved model API
```

对 `POST /api/ai/generate`，应用服务会先从 `session_id` 读取授权客户并固定会话/数据/知识版本，再查询结构化事实；需要知识的任务调用真实 Embedding API 后按该知识版本检索最多 4 个片段，最后调用真实生成 API。生成 JSON、精确证据引用、规则 ID 和版本校验失败即报错；相同成功请求 ID 可重放，生成期间会话变化会使旧响应失效。

通用会话 PATCH 只接受用户输入与展示状态。授权、方案、候选、比较保存、陪伴提交等动作通过 `POST /api/sessions/:id/commands` 执行，由应用服务读取当前数据库事实、调用确定性规则并在同一乐观锁更新中保存，不能由浏览器直接写入完成状态。

## 版本与就绪

`api_version` 和 `frontend_contract_version` 在 `/api/health`、`/ready` 中公开。`/ready` 同时检查数据库、共享文档目录、活动知识向量数、规则目录、契约文件和生产所需模型配置，未通过的节点由 Nginx 排除。

## 数据/知识版本切换

导入先写 `STAGING` 版本并产生错误报告，关联完整性、必填字段、Embedding 维度与固定召回回归通过后才切到 `ACTIVE`。产品实时同步按 `product_id + metric + source + source_timestamp` 幂等 upsert；知识索引按内容 hash 增量生成，更换 Embedding 模型或维度才重建并原子切换。
