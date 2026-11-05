# API v1 / 前端契约 2026-11-02.1

应用服务只接受 JSON。浏览器只保存 `session_id`，客户、授权、持仓、配置、候选和 AI 任务状态由服务端会话提供。

## 共享会话

```http
POST /api/sessions
Content-Type: application/json

{}
```

```json
{
  "session": {
    "session_id": "uuid",
    "customer_id": "customer-001",
    "state": { "authorized": true, "goal": {} },
    "version": 1,
    "status": "ACTIVE"
  },
  "api_version": "v1"
}
```

业务状态变更必须带 `expected_version` 和 UUID `request_id`：

```http
PATCH /api/sessions/{session_id}
Content-Type: application/json

{
  "expected_version": 1,
  "request_id": "uuid",
  "patch": { "compareSet": ["wealth", "fund"] }
}
```

版本过期返回 `409 VERSION_CONFLICT`。同一会话重复提交同一个 `request_id` 返回第一次结果，不重复推进状态。

通用 PATCH 只接受 19 个白名单字段（用户输入、展示状态，以及有结构校验的 AI 结果投影，见下方「共享会话状态契约」）。`authorized`、`plan`、`candidates`、`compareSaved`、`careSubmitted`、`activities` 等服务端权威状态必须经命令接口生成：

```http
POST /api/sessions/{session_id}/commands
Content-Type: application/json

{
  "expected_version": 1,
  "request_id": "uuid",
  "command": "generate_allocation",
  "input": {
    "rule_id": "allocation-balanced-r3",
    "rule_version": "rules-demo-v1",
    "goal": {
      "amount": "¥500,000",
      "term": "3–5 年",
      "risk": "R3 平衡型",
      "purpose": "教育金储备",
      "liquidity": "大部分可长期投资"
    }
  }
}
```

可用命令为 `set_authorization`、`generate_allocation`、`generate_candidates`、`save_comparison`、`submit_care`、`create_reminder`、`record_activity`。`record_activity` 只接受白名单 `kind`（`task-center`、`source-detail`、`new-supply`、`subscribe`、`brief`、`upload`、`extract`、`templates`、`review-writing`、`workspace`、`research-plan`、`save`、`mobile-search`、`filter-panel`）与可选 `title`，由服务端生成 `activity_id` / `created_at` / `data_version` 并追加到 `state.activities[]`（上限 50）；浏览器不能通过通用 PATCH 写 `activities`。成功响应包含 `{ session, result, api_version }`。程序会检查当前授权、规则条件、真实产品、比较数量和前置状态；撤权、目标变化和关键产品属性变化会使相关下游状态失效。

## 共享会话状态契约（W1 冻结，2026-11-05）

`defaultSessionState()` 的 36 个 key 按写入途径分三类。本节表格与 `tests/unit/session-contract.test.js` 的期望集合互为锁定：**任何白名单、命令、状态形状或清理规则的变更，必须在同一 PR 内同时改代码、本表与该测试**，否则 CI 拒绝。

| 类别 | 字段 | 写入途径 | 校验 | 撤权清理 | 刷新恢复 |
|---|---|---|---|---|---|
| **A 服务端权威**（PATCH 禁止） | `authorized`、`plan`、`candidates`、`compareSaved`、`careSubmitted`、`remindCreated`、`selectPoolSynced`、`activities`；另有 `candidateCalculation`（由 `generate_candidates` 写入、初始缺省，不计入 36 个初始 key） | 仅 7 个会话命令生成；`activities` 由服务端生成 `activity_id` / `created_at` / `data_version`，上限 50 | `validateSessionState` 校验 `plan` 比例合计 100%、`activities` 结构与上限 | 全部命中 `downstreamReset()` | 是，落 `app_sessions.state_json` |
| **B 浏览器可写**（19 个 PATCH 白名单字段） | `role`、`authNotice`、`aiStatus`、`promptError`、`lastQuestion`、`lastAnswer`、`diagnosis`、`goal`、`compareSet`、`reviewReady`、`researchAnswer`、`researchUsedInCandidates`、`ruleMatch`、`contactTodo`、`holdingsExpanded`、`landing`、`aiRequests`、`viewFilter`、`uiState` | 通用 PATCH（带 `expected_version` + `request_id`） | `lastAnswer` / `researchAnswer` 必须为对象且 `text` ≤ 20000 字符、`sources` 为数组；`diagnosis` / `ruleMatch` 必须为对象；`aiRequests` 为 ≤ 100 的字符串数组；`landing` / `uiState` / `viewFilter` / `goal` 为对象且 ≤ 64KB；`compareSet` ≤ 3 且不重复 | `compareSet`、`ruleMatch`、`researchUsedInCandidates` 命中清理 | 是 |
| **C 只读元数据**（PATCH 禁止） | `customerName`、`customerId`、`qualified`、`acceptanceAdvanced`、`dataVersion`、`knowledgeVersion`、`ruleVersion`、`asOf`、`asOfFull` | 会话创建时由服务端 / fixture 初始化，浏览器不可写 | 不接收浏览器写入 | 不清理（身份与版本信息） | 是 |

**AI 结果投影口径**：`lastAnswer`、`researchAnswer`、`diagnosis`、`ruleMatch`、`aiRequests` 是浏览器在 `/api/ai/generate` 成功后**写回**的结果投影，属 B 类白名单例外，不是服务端权威状态；服务端不为其内容背书，但通过上表结构与大小校验阻止任意文本或超大载荷被存成「成功回答」。若后续要求不可伪造，需改为服务端在 AI 端点内直接写 state 并从白名单移除。

**已移除的白名单项**：`qualified`、`acceptanceAdvanced` 在当前源码中无任何写入方，2026-11-05 从 `SESSION_PATCH_FIELDS` 移除并归入 C 类只读；将来恢复相关功能须显式新增命令或白名单字段。

**生命周期**：会话落 `app_sessions`，`status='ACTIVE'`，`expires_at = NOW() + INTERVAL '12 hours'`；浏览器只保存 `session_id`（localStorage `wealth-demo-session-id`），业务状态全部由服务端会话提供，刷新后按 `session_id` 恢复；版本过期返回 `409 VERSION_CONFLICT`，同一 `request_id` 重放返回首次结果且不推进状态。

**契约冻结判定**：`tests/unit/session-contract.test.js` 锁定 19 个 PATCH 字段、7 个命令、36 个状态 key、11 个 `downstreamReset` key，以及服务端权威字段不可经 PATCH 写入。改动这些集合必须同步改本表，视为契约变更，需走 PR 与 `ci-merge-gate`。

## AI 任务（真实模型 / fixture 桩）
```http
POST /api/ai/generate
Content-Type: application/json

{
  "session_id": "uuid",
  "session_version": 3,
  "request_id": "uuid",
  "task_type": "research_qa",
  "input": { "question": "降息对固收+可能有什么影响？" },
  "product_ids": ["wealthplus"],
  "source_ids": ["research-pack-2026-09"]
}
```

`session_version` 和 UUID `request_id` 均为必填。`task_type` 只能取 `rule_match`、`assistant_qa`、`research_qa`、`diagnosis_explain`、`candidate_explain`、`product_explain`、`report_summary`、`writing_draft`。服务端从会话取得客户授权和持仓，拒绝前端提交的客户事实、系统提示词、模型地址和向量分数（包括嵌套字段）。成功的相同请求 ID 返回首次保存的响应；进行中的重复请求返回 409，不重复调用模型。

成功响应至少包含 `request_id`、`text`、`citations`、`evidence`、`data_as_of`、`model`、`finish_reason`、`latency_ms` 和 `risks`。`AI_MODE=fixture`（仅开发/测试）时额外返回 `execution_mode: "fixture"`，`model` 为 `fixture-generate-1`，`embedding_model` 为 `fixture-deterministic-1536`；响应结构与证据白名单校验不变，页面必须显示"演示桩 fixture"。`AI_MODE=real` 不返回 `execution_mode`。生产环境拒绝以 fixture 模式启动。`evidence` 中的 `data_ids`、`calculation_ids`、`chunk_ids` 和召回分数指向本次实际证据。`rule_match` 还返回 `status`、`rule_id`、`rule_version`、`extracted_inputs`、`missing_fields` 和 `confidence`；规则动作只从数据库规则目录读取。

模型未配置、Embedding 失败、知识版本/向量维度不匹配、证据不足、JSON 解析失败或引用不属于本次证据包时，接口返回错误并且不写入成功状态。
