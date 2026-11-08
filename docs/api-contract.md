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

`defaultSessionState()` 的 36 个 key 按写入途径分三类。本节表格与 `tests/unit/session-contract.test.js` 的期望集合互为锁定：**任何白名单、命令、状态形状或清理规则的变更，必须在同一原子 PR 内同时改代码、本表与冻结集合测试**。原子契约变更（C-01 / C-02）不能拆成 stacked 中间态（删 PATCH 字段的那一提交会让冻结断言立即变红），而应由 `contract` 作为作者、通过 `OWNERSHIP` 的 `owners` 数组把 `contract` 精确加入少数契约文件的共同 owner，使实现 + 本表 + 测试 + 必要的前端切换点落在**一个 PR** 内；不得扩整个 `docs/` / `tests/` 前缀、不得改 `public/app.js` 的 ownership、不得用 label 或 `baseline` 绕过。具体文件清单与登记方案见 `docs/w1-pending-features.md` §14.6；该共同 owner 登记本身需要一个前置 `ci` PR。

| 类别 | 字段 | 写入途径 | 校验 | 撤权清理 | 刷新恢复 |
|---|---|---|---|---|---|
| **A 服务端权威**（PATCH 禁止） | `authorized`、`plan`、`candidates`、`compareSaved`、`careSubmitted`、`remindCreated`、`selectPoolSynced`、`activities`；另有 `candidateCalculation`（由 `generate_candidates` 写入、初始缺省，不计入 36 个初始 key） | 仅 7 个会话命令生成；`activities` 由服务端生成 `activity_id` / `created_at` / `data_version`，上限 50 | `validateSessionState` 校验 `plan` 比例合计 100%、`activities` 结构与上限 | 全部命中 `downstreamReset()` | 是，落 `app_sessions.state_json` |
| **B 浏览器可写**（19 个 PATCH 白名单字段） | `role`、`authNotice`、`aiStatus`、`promptError`、`lastQuestion`、`lastAnswer`、`diagnosis`、`goal`、`compareSet`、`reviewReady`、`researchAnswer`、`researchUsedInCandidates`、`ruleMatch`、`contactTodo`、`holdingsExpanded`、`landing`、`aiRequests`、`viewFilter`、`uiState` | 通用 PATCH（带 `expected_version` + `request_id`） | `lastAnswer` / `researchAnswer` 必须为对象且 `text` ≤ 20000 字符、`sources` 为数组；`diagnosis` / `ruleMatch` 必须为对象；`aiRequests` 为 ≤ 100 的字符串数组；`landing` / `uiState` / `viewFilter` / `goal` 为对象且 ≤ 64KB；`compareSet` ≤ 3 且不重复 | `compareSet`、`ruleMatch`、`researchUsedInCandidates` 命中清理 | 是 |
| **C 只读元数据**（PATCH 禁止） | `customerName`、`customerId`、`qualified`、`acceptanceAdvanced`、`dataVersion`、`knowledgeVersion`、`ruleVersion`、`asOf`、`asOfFull` | 会话创建时由服务端 / fixture 初始化，浏览器不可写 | 不接收浏览器写入 | 不清理（身份与版本信息） | 是 |

**AI 结果投影口径**：`lastAnswer`、`researchAnswer`、`diagnosis`、`ruleMatch`、`aiRequests` 是浏览器在 `/api/ai/generate` 成功后**写回**的结果投影，属 B 类白名单例外，不是服务端权威状态；服务端不为其内容背书，但通过上表结构与大小校验阻止任意文本或超大载荷被存成「成功回答」。若后续要求不可伪造，需改为服务端在 AI 端点内直接写 state 并从白名单移除。

**已移除的白名单项**：`qualified`、`acceptanceAdvanced` 在当前源码中无任何写入方，2026-11-05 从 `SESSION_PATCH_FIELDS` 移除并归入 C 类只读；将来恢复相关功能须显式新增命令或白名单字段。

**生命周期**：会话落 `app_sessions`，`status='ACTIVE'`，`expires_at = NOW() + INTERVAL '12 hours'`；浏览器只保存 `session_id`（localStorage `wealth-demo-session-id`），业务状态全部由服务端会话提供，刷新后按 `session_id` 恢复；版本过期返回 `409 VERSION_CONFLICT`，同一 `request_id` 重放返回首次结果且不推进状态。

**契约冻结判定**：`tests/unit/session-contract.test.js` 与 `tests/unit/frozen-set-regression.test.js` 共同锁定 19 个 PATCH 字段、7 个命令、36 个状态 key、11 个 `downstreamReset` key，以及服务端权威字段不可经 PATCH 写入。改动这些集合必须同步改本表与两份冻结测试，视为契约变更，需走 PR 与 `ci-merge-gate`；**「同步」的落地形态是单原子 PR + 精确共同 owner（见上）**。

> **待实现变更预告**：下文「已批准的状态契约变更（C-01 / C-02）」已获用户批准，但**截至 `e4d8f49` 尚未实现**；实现前，本节 36 / 19 / 7 / 11 的现行语义仍是唯一有效的服务端行为，页面不得提前按新契约写入。

## 只读计算与派生投影（W1 波次 3）

本节登记两类**不改变会话状态**的接口：① 由服务端确定性计算 service 暴露的只读计算端点；② 由只读事实派生的页面投影字段。二者共同的不变式：

- **只读**：`GET`/`POST` 计算调用不写会话、不推进 `version`、不需要也不接受 `expected_version` / `request_id`；
- **不新增命令**：命令集合恒为 7 个（`set_authorization`、`generate_allocation`、`generate_candidates`、`save_comparison`、`submit_care`、`create_reminder`、`record_activity`）；
- **不新增状态 key**：`defaultSessionState()` 仍为 36 个 key，派生投影不进会话状态；
- **不改冻结集合**：19 个 PATCH 白名单字段、11 个 `downstreamReset` key 均不变；
- **不构成契约变更**：因此 `tests/unit/session-contract.test.js` 的 36 / 19 / 7 / 11 断言保持原样，本节落地时不需要修改该测试。

**路径以 contract PR 描述为准**：下列端点与查询参数的具体拼写由波次 3 `contract` Worker 的 PR 描述与实现决定；本文以「以 contract PR 描述为准」记录其语义、参数含义、单位口径与响应字段，避免与实现漂移。

### 1. 存款本息只读计算（P-04）

对应实现：`BusinessRulesService.calculateDeposit()`（`src/components/business-rules/application/businessRulesService.js`），底层执行规则目录 `deposit-interest-simple`（A23 精确匹配 `rule_id` + `rule_version`），HTTP 路径以 contract PR 描述为准。

**请求**

| 查询参数 | 必填 | 说明 |
|---|---|---|
| `principal` | 是 | 本金，单位「元」，正数 |
| `annual_rate` | 是 | 年利率，按 `rate_unit` 解释（见下） |
| `years` | 是 | 期限，单位「年」，正数 |
| `rate_unit` | 否 | `decimal`（默认，规则目录口径）或 `percent`；`percent` 在服务端换算为小数后再计算 |
| `rule_version` | 否 | 缺省为规则目录当前版本（`rules-demo-v1`）；给出时必须与服务端规则目录精确匹配 |
| `session_id` | 否 | 该端点不读会话事实，携带与否均不影响结果 |

**利率单位口径（务必区分）**

- `rate_unit=decimal`：**2.15% 必须传 `0.0215`**。这是规则目录 `deposit-interest-simple` 的原生口径（`principal × annual_rate × years`）。
- `rate_unit=percent`：可传 `2.15`，服务端先 `÷100` 再计算；响应回显 `rate_unit` 与换算后的 `inputs`。
- 省略 `rate_unit` 时按 `decimal` 解释。**把百分数直接以默认口径传入会放大 100 倍**（`{principal:500000, annual_rate:2.15, years:3}` 曾算出利息 `3,225,000`），服务端因此加单位守卫，超出小数上限的 `annual_rate` 直接拒绝，不静默产出错误本息。

**成功响应（200）**

```json
{
  "status": "MATCHED",
  "rule_id": "deposit-interest-simple",
  "rule_version": "rules-demo-v1",
  "calculation_id": "calc-…",
  "rate_unit": "decimal",
  "inputs": { "principal": 500000, "annual_rate": 0.0215, "years": 3 },
  "result": {
    "interest": 32250,
    "maturity_amount": 532250,
    "formula": "本金 500000.00 元 × 年利率 2.15% × 3 年 = 利息 32250.00 元"
  },
  "api_version": "v1"
}
```

- `calculation_id` 每次计算的服务端标识；`result` 恒含 `interest`、`maturity_amount`、`formula`；金额单位 CNY、展示 2 位小数。
- 利率真值来源唯一：`products.annual_rate`（当前存款产品 `deposit` = 2.15%）；页面不得再自算或套用固定 2.15%。
- 响应不写入会话，不产生 `activities`，不触发 `downstreamReset()`。

**错误**

| 状态码 | `error.code` | 触发 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `principal ≤ 0`、`years ≤ 0`、非有限数、`rate_unit` 非法，或利率单位误用（百分数以小数口径传入） |
| 404 | `NOT_FOUND` | 规则 `deposit-interest-simple` 或其指定 `rule_version` 在规则目录中不存在（`calculateDeposit()` 返回 `status: "UNSUPPORTED_RULE"`，由 contract 层映射为 404；**不返回 422**） |

- `calculateDeposit()` 在规则被停用时返回 `status: "UNSUPPORTED_RULE"`，同样按上表 **404** 返回，不静默降级为默认规则或默认利率；
- 与 `generate_allocation` 的 `422 UNSUPPORTED_RULE`（会话命令的规则不匹配）不同，本只读端点的规则缺失属「资源不存在」，故为 404。

**空态**：该期限无挂牌利率时返回错误（`VALIDATION_ERROR`，`fields` 指明期限），页面显示「该期限暂无挂牌利率」，**不得**回退到默认 2.15%。

### 2. 持仓计算只读投影（P-15）

对应实现：`PortfolioService.calculate()`（`src/components/demo-data/application/portfolioService.js`）与 AI 证据路径共享同一 `computePortfolio()`，因此同一组持仓的 `calculation_id` 在两条路径上一致。HTTP 路径以 contract PR 描述为准。

**请求**

| 参数 | 必填 | 说明 |
|---|---|---|
| `session_id` | 是 | 授权、持仓与 `data_as_of` 均从该会话服务端事实取得；浏览器不得提交持有人、持仓或金额 |
| 其余参数 | — | 不接受任何客户事实覆盖字段 |

**授权前置**：与 `GET /api/demo-data` 同一规则——会话 `authorized=false` 时返回 `available=false`、`unavailable_reason="unauthorized"`，持仓明细为空，不回显任何客户明细。

**成功响应（200，`available=true`）**

```json
{
  "available": true,
  "calculation_id": "calc-…",
  "calculation_version": "…",
  "currency": "CNY",
  "data_as_of": "…",
  "total_amount": 718420,
  "weights": [{ "product_id": "fund", "weight": 0.4176 }],
  "max_concentration": 0.4176,
  "max_concentration_basis": "all_assets",
  "positions": [],
  "equity": {
    "available": true,
    "amount": "…",
    "share_of_total": "…",
    "max_concentration": "…",
    "max_concentration_basis": "equity_assets"
  },
  "holding_return": {
    "available": true,
    "basis": "amount_x_rate_over_1_plus_rate",
    "level": "estimated",
    "amount": "…",
    "rate": "…"
  },
  "api_version": "v1"
}
```

**分母口径（不可混用）**

- `max_concentration`（顶层）恒为 `basis=all_assets`：分母 = 全部持仓市值；按当前持仓为 **41.76%**。保险保费不在 `holdings` 内，**不进入任何金额合计**。
- `equity.max_concentration` 恒为 `basis=equity_assets`：分母 = 权益类持仓市值（产品 `type='基金'` 或 `role` 含「权益」）；无权益持仓时 `equity.available=false`。
- 页面文案「单只宽基基金占权益资产 68%」属 `equity_assets` 口径，只能读 `equity.max_concentration`，不得用顶层数值替代；反之亦然。两侧都带 `basis` 字段，前端展示文案必须同时显示分母说明。

**金额与收益口径**：金额单位 CNY、2 位小数；`holding_return` 的 `level="estimated"`（现无成本基准与现金分红，`收益金额 = 现值 × return_rate / (1 + return_rate)`），页面必须标明「估算」，不得呈现为核验值，也不得回填历史上硬编码的 `+42,860.18 / 5.40%`。

**空态与不可用**

| 条件 | 响应 | 页面 |
|---|---|---|
| 未授权 | `available=false`、`unavailable_reason="unauthorized"` | 展示未授权提示，不展示金额 |
| 无持仓 | `available=false`、`unavailable_reason="no_holdings"`、`total_amount=null` | 展示「暂无持仓」，**不得**显示 0 元或声称已诊断 |

**错误**：参数非法 → `400 VALIDATION_ERROR`；会话不存在或过期 → `404 NOT_FOUND`（复用 `NotFoundError`）；数据源不可用 → `503 DEPENDENCY_UNAVAILABLE`（`DependencyUnavailableError`）。三类均不写入会话。未授权**不**报错而是返回 `available=false`，以免把「无权限」误显示成系统错误。

### 3. 合格投资者认定状态（P-05，只读派生投影）

- **性质**：只读派生投影，由服务端在读取会话/客户快照时派生并随读返回；**浏览器不可写**，也不进入 `defaultSessionState()` 的 36 个 key，因此不新增状态 key、不改 19/7/11 集合。
- **数据来源**：客户快照与 `products` 事实（`products.type = 'private'` 的受限产品是否可售），不新增写入方；`qualifiedStatus` 与 `authorized` 语义不同——前者是「合格投资者认定」，后者是「本次会话的客户授权」，二者不可互相替代。
- **取值**：`recognized`（已认定）/ `not_recognized`（未认定）/ `unknown`（无派生来源时明确置为未知，不用默认值补齐）。
- **投影字段**（命名以 contract PR 描述为准）：`qualifiedStatus`、`restrictedProducts`（已认定时可见的受限产品事实，`product_id`、名称、`risk_level`、`sale_status`、`data_id`）、`restrictedUnavailableReason`。
- **浏览器行为**：认定状态与受限产品只能读；未认定时不得返回任何受限产品细节（不返回部分内容），页面显示受限说明。加入比较、诊断等写入仍走既有 PATCH 白名单或 7 个命令，**不因本投影新增写入通道**。
- **空态**：无受限产品 → `restrictedProducts=[]` 且 `restrictedUnavailableReason="no_restricted_products"`，页面显示「当前无受限产品」，不展示 `PE6` 占位。

### 4. 保单 / 保障缺口（P-13，只读派生投影）

- **性质**：只读派生投影，从 `products` 产品事实（含 `insurance`）与会话客户快照派生；**无保单写入方**，不进入 36 个 key、不新增命令、不改 19/7/11 集合。
- **浏览器不可写**：保单、覆盖度、缺口、待办均为服务端派生，前端不得自行拼接或缓存为「真实保单」。
- **投影原则（防伪造）**：只输出可由产品事实确定的字段——`product_id`、产品名、`insurer`（若产品事实提供）、`coverage_type`、`coverage_amount`、`annual_premium`、`sale_status`、`data_id`、`data_as_of`。**绝不伪造**保单号、投保日期、生效日期、理赔进度、已核保结论等产品事实之外的东西；数据不足即置空并给 `unavailable_reason`。
- **无数据空态**：无授权保单或无保单数据源 → `policies=[]`、`coverage_gap=null`、`unavailable_reason="no_policy_source"`（或 `unauthorized`），页面显示「未授权或暂无可展示保单」，保持 W1 既有「保险不替代核保与理赔」标注。
- **验收边界**：即便投影为空，页面也不得回退到硬编码的覆盖度 72%、保障缺口或「安享长期医疗 ¥4,000,000」固定弹窗。

### 5. 与冻结集合的关系（不变式小结）

| 冻结集合 | 波次 3 是否改动 | 依据 |
|---|---|---|
| 36 个状态 key | **不改** | 派生投影不进 `defaultSessionState()`；认定/保单/计算均不入会话 |
| 19 个 PATCH 白名单字段 | **不改** | 本节全部端点不写会话 |
| 7 个会话命令 | **不改** | 只读计算不注册命令 |
| 11 个 `downstreamReset` key | **不改** | 无写入即无失效级联 |
| 14 类 `record_activity` kind | **不改** | 本节不写 `activities` |

凡将来需要把上述任一派生值落成会话状态（例如把认定状态或草稿写入会话），仍按 `docs/w1-pending-features.md` §8 流程先取得状态契约 owner 批准，并由同一原子 PR 同时改本表、实现与两份冻结测试（`session-contract.test.js`、`frozen-set-regression.test.js`）。

## 已批准的状态契约变更（C-01 / C-02，待实现）

> **状态**：2026-11-06 用户批准；截至 `e4d8f49` **尚未实现**。本节描述的是**目标契约**，不是当前服务端行为。落地形态为**每项变更一个原子 PR**（作者 `contract`）：实现 + 本文件 + `session-contract.test.js` + `frozen-set-regression.test.js` + 必要的 `tests/integration/w1-flow.test.js` + C-01 的 `public/actions/flow.js` 切换点在同一 PR 内；跨 owner 通过 `OWNERSHIP.owners` 精确登记解决，**不拆 stacked 中间态**。前置 `ci` PR 与完整文件清单见 `docs/w1-pending-features.md` §14.6。在实现合并前，任何页面/客户端不得按本节写入，服务端仍按上文「W1 冻结」的 36 / 19 / 7 / 11 行为校验。

### C-01 `contactTodo` 迁移到 `record_activity(kind="contact-request")`

- `SESSION_PATCH_FIELDS`：**19 → 18**（移除 `contactTodo`）。浏览器通过通用 PATCH 提交 `contactTodo` → `400 VALIDATION_ERROR`（unknown field）。
- `record_activity` 的 `ACTIVITY_KINDS`：**14 → 15**，新增 `contact-request`。请求：
  ```http
  POST /api/sessions/{session_id}/commands
  {
    "expected_version": 3,
    "request_id": "uuid",
    "command": "record_activity",
    "input": { "kind": "contact-request", "title": "可选，≤200 字符" }
  }
  ```
  服务端生成 `activity_id` / `created_at` / `data_version` 并追加 `state.activities[]`（上限仍 50）；同一 `request_id` 重放返回首次结果，不重复追加。
- `contactTodo` 保留为**只读兼容字段**：仍在 `defaultSessionState()` 的 36 个 key 中，但读时派生 `contactTodo = activities.some(a => a.kind === "contact-request")`；客户端不可写，旧会话的存量值以派生值为准。
- **授权前置**：`kind="contact-request"` 计划豁免 `assertAuthorized()`（客户侧服务请求，不读取持仓/KYC 明细）；豁免仅限该 kind。**该豁免待 §16-A 最终确认**，确认前实现方不得自行放宽其他命令。
- **撤权清理**：`activities` 已在 `downstreamReset()` 内，撤权即清空；派生 `contactTodo` 随之为 `false`。不新增 reset key。
- **`submit_care` 副作用**：现行 `submit_care` 在 patch 中写 `contactTodo: true`，C-01 落地时**必须删除该写入**；其权威状态是 `careSubmitted`。否则读时派生会覆盖存量值，造成写入/读取不一致，并把「提交陪伴建议」误显示为「已联系客户经理」。若产品要求两者等价，应由服务端追加 `contact-request` activity，不得恢复 PATCH 写入（另立确认）。
- 命令集合不变：**7 → 7**。

### C-02 写作草稿持久化（`save_draft` + `writingDrafts`）

- `SESSION_COMMANDS`：**7 → 8**，新增 `save_draft`。
- `defaultSessionState()`：**36 → 37**，新增 `writingDrafts: []`；每项 `{ draft_id, title, content, source_request_id, created_at, updated_at, data_version }`，`draft_id` 由服务端生成。
- `SESSION_PATCH_FIELDS`：**不扩大**（C-01 后保持 18）；`writingDrafts` 经通用 PATCH 写入 → `400`。
- 请求：
  ```http
  POST /api/sessions/{session_id}/commands
  {
    "expected_version": 4,
    "request_id": "uuid",
    "command": "save_draft",
    "input": { "content": "草稿正文，1–20000 字符", "source_request_id": "uuid", "title": "可选，≤200 字符" }
  }
  ```
- 校验：`source_request_id` 必须存在于本会话的 `ai_requests`（按 `session_id + request_id` 查表，**不读浏览器 PATCH 的 `aiRequests` 数组**）；`content` 1–20000 字符；每会话最多 20 条；`request_id` 幂等；`expected_version` 过期 → `409`；未授权 → `422 INSUFFICIENT_EVIDENCE`（W1 口径，待 §16-B 确认）。
- 成功响应：`{ session, result: { status: "APPLIED", draft_id, created_at, data_version }, api_version }`。
- **撤权清理**：`set_authorization(authorized=false)` 的撤权分支显式 `writingDrafts: []`（与 `diagnosis` / `lastAnswer` / `researchAnswer` 同处）；**不加入 `downstreamReset()`**，因此 `downstreamReset` 仍为 **11**，且目标变更/重新生成方案不会误清草稿。该安全语义的完整分析见 `docs/w1-pending-features.md` §14.4。

### 变更后的集合对照

| 集合 | 现行（`e4d8f49`） | C-01 后 | C-02 后（两项合并） |
|---|---|---|---|
| PATCH 白名单 | 19 | 18 | **18** |
| `record_activity` kind | 14 | 15 | **15** |
| 会话命令 | 7 | 7 | **8** |
| `defaultSessionState()` key | 36 | 36 | **37** |
| `downstreamReset()` key | 11 | 11 | **11** |

> 实现合并时，本节与 `docs/w1-pending-features.md` §14.3、`tests/unit/session-contract.test.js`、`tests/unit/activities.test.js` 必须逐数字一致；任一不一致即视为契约变更未完成。

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
