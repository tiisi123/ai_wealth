# W1 待补功能验收清单（并行研发波次 1 · docs）

本清单落实 `CONTEXT.md` P0 #1「冻结 W1 页面与流程范围」中的**受限/静态页面定性（2026-11-04）**一节：在 0.2 白名单内的 30 个运行路由中，`pc/product-private`、`m/private`，以及基金、保险、理财、存款、报告阅读、智能写作等以静态演示数据为主的页面，**不是有意保留的产品限制，而是 W1 要补的功能**。本清单逐页给出当前演示态、目标完成条件、成功/失败/空三态、服务端权威状态与命令、验收用例归属，供 Worker 按「待补功能」领取。

## 0. 文档边界

| 项目 | 说明 |
|---|---|
| 规格权威 | 总体需求规格为根目录 xlsx「框架参考」A–G 列 R2–R62 共 61 条。本清单**只登记承载与判定归属，不改写、不裁剪 A–G 列任何指标**，也不登记任何指标的满足情况 |
| H 列 | 供应商逐项自评，**不构成需求规格**；本清单不引用其结论与数字，不作为需求或架构事实 |
| W1 范围 | 以 `CONTEXT.md` 为准；本清单不得扩大或缩小该范围 |
| DEMO 验收标准 | 架构文档 V2.3 第 11 章 A01–A35，是 DEMO 的通过条件；本清单的「职责页」与「关联 A 项」只做交叉索引 |
| 台账 | 架构文档附录 A（R2–R62 逐条承载与判定归属），本清单不复制其表格 |
| 本文性质 | 需求侧完成条件与验收归属；**不含测试代码**，不新增运行页面，不改 `CONTEXT.md`、`README.md`、架构文档、`tests/`、`src/`、`public/`、`scripts/`、`.github/`、`package.json` |
| 基线 | `origin/main` = `e4d8f49`（波次 5 合并后；本清单首版写于基线 `53eb19c`，波次 1 后校正为 `d0b7620`，波次 3 起校正为 `cf07b1b`，波次 4 起校正为 `9411ead`，波次 5 起校正为 `5bcb1cc`，波次 5 收档起校正为 `e4d8f49`，均见 §0.3 / §0.4 / §0.5 / §0.6 / §0.7）。所列「当前演示态」均为该基线上 `public/app.js`、`public/actions/*.js`、`public/actions-registry.js`、`tests/e2e/` 与 `src/` 的**代码事实**，不是人工观感描述 |

### 0.3 基线校正与波次 1 收工登记（2026-11-05 复核）

波次 1 已合并 4 个加固项，基线由 `53eb19c` 推进到 **`d0b7620`**（波次 2 合并后已进一步推进到 `cf07b1b`，见 §0.4；波次 3 合并后已进一步推进到 `9411ead`，见 §0.5）。本清单凡引用基线处一律记为当前基线，并把下列已修项在对应条目上标注「**已收工 · PR#**」，**原条目不删除**（保留追溯）。

| PR | 类型 | 收工项（对应本清单条目） |
|---|---|---|
| #6 | contract（`contract`） | `session-sync` 归一化服务端 `asOf`（页面不再把存储编码当时点）；`set_authorization` 布尔校验；`demo-data` 预同步投影补齐只读身份/版本字段。**合同冻结集合未变**（36 key / 19 PATCH / 7 命令 / 11 `downstreamReset` / 14 activity kind） |
| #7 | data（`data`） | seed 与迁移可重复执行、fixture parity（对应 **P-15 权威状态前提**、**P-04「利率唯一真值来源」的数据侧前提**） |
| #8 | docs（`docs`） | 本清单首版入库（即本文，写于波次 1 之前的旧基线） |
| #9 | backend（`backend`） | A06 候选资格解析「12 个月」等持有期、定期存款按名义期限、一年内流动性需求排除满 12 个月持有；A07 确定性比较口径与 `comparable/incomparable_reason/missing_product_ids`；A23 `rule_id`+`rule_version` 精确匹配、拒绝模型动作与排名；A17/A19 规则与计算证据入包；A18 规则执行前复核会话版本。**H-06 事实性误判即由本 PR 暴露**（见 §4 H-06） |

基线校正要点：波次 1 之前的旧基线（`53eb19c`）上的「当前演示态」凡与当前基线 `9411ead` 不同，以本节、§0.4、§0.5 与各条目「**基线校正**」「**已推进 · 波次 3**」行（含 #16 合入的「波次 2 校正 / 已推进 · 波次 3」标注）为准；未标注者表示与当前基线一致。

### 0.4 波次 2 收工登记与基线推进（2026-11-05，基线 `cf07b1b`）

波次 2 已合并 4 个 PR，基线由 `d0b7620` 推进到 **`cf07b1b`**。本节只登记「服务端已具备的前提」与「已撤回的旧判断」，**不把任何一个 P/H 条目标记为整体收工过**；条目整体闭环仍需页面侧消费与三态用例，登记于 §1.1。

| PR | 类型（owner） | 收工项 / 前提（对应本清单条目） |
|---|---|---|
| #10 | docs（`docs`） | 本清单的基线校正、H-06 事实性撤回与缺口基数重算入库。**冻结集合未变** |
| #11 | backend（`backend`） | **P-04**：`BusinessRulesService.calculateDeposit()` 只读入口落地（`rate_unit` `decimal`/`percent`、单位守卫、`calculation_id`、`rule_version` 精确匹配、结果二次复算）；**P-15**：`PortfolioService.calculate()` 只读门面与共享 `computePortfolio()` 落地（`all_assets` / `equity_assets` 双分母、`holding_return` 标记 `estimated`、`unauthorized`/`no_holdings` 不返回假 0）。两项均为 service 层，**尚未暴露 HTTP 端点**，冻结集合未变（36/19/7/11 不变） |
| #12 | frontend-flow（`frontend-flow`） | **P-04**：`m-deposit-compare` 停止浏览器自算并落到显式「需服务端权威结果」失败态（**删假值，未接线**）；**P-12**：`m-save`/`m-compare-add` 改经 `/api/demo-data` 校验 `product_id` 存在后才写 `compareSet`；**H-03**：`save_comparison` 结果须服务端确认 `APPLIED` 才显示成功，比较结论改为可由已保存比较集复算的表述。**只删不补**，页面尚未改接服务端读数 |
| #13 | frontend-lead（`frontend-lead`） | **P-01 / P-11**：控制台 KPI 改由真实端点驱动、移除落地页假数据项。冻结集合未变 |

基线校正要点（`cf07b1b`）：

- P-04 / P-15 的「服务端计算不存在」「只剩页面硬编码」表述已过时——计算 service 已存在，**缺的是 HTTP 暴露与页面消费**；详见 §3 P-04、P-15 条目内的「波次 2 / 波次 3 校正」行。
- 波次 2 的 #12、#13 大多属**删假数据 / 显式拦截**，不等于条目达标；§1.1 的缺口基数只在页面读数确实改接服务端事实时才减，不因「删掉硬编码」「改成失败提示」而虚减。

### 0.5 波次 3 收工登记与基线推进（2026-11-06，基线 `9411ead`）

波次 3 已合并 4 个 PR，基线由 `cf07b1b` 推进到 **`9411ead`**。本节只登记「服务端与页面已具备的前提」「已撤回的旧判断」，并按 §0.4 同样的尺度判定：**没有任何 P/H 条目因本波次整体收工**；条目整体闭环仍需页面读数与服务端事实一致、三态用例齐备，登记于 §1.1。

| PR | 类型（owner） | 收工项 / 前提（对应本清单条目） |
|---|---|---|
| #14 | contract（`contract`） | 只读 HTTP 端点与派生投影落地：`GET /api/calculations/deposit`、`GET /api/calculations/portfolio`、`GET /api/insurance/coverage`、`GET /api/health/checks`，并在 `GET /api/demo-data` / `GET /api/knowledge` 上新增独立命名空间 `readonly_projections`。**只暴露只读端点与派生投影**：不新增状态 key、不改 19 个 PATCH 白名单字段、不新增 7 个命令、不改 11 个 `downstreamReset` key（`SESSION_COMMANDS.size=7`、`SESSION_PATCH_FIELDS.size=19`、`defaultSessionState()` 36 key、`downstreamReset()` 11 key 复核一致） |
| #15 | test-unit（`test-unit`） | 为波次 2 的确定性计算补齐 service 层单测：`tests/unit/deposit-calculation.test.js`（利率/期限矩阵复算、`decimal`/`percent` 同值同 `calculation_id`、`2.15` 误传小数被拒）、`tests/unit/portfolio-calculation.test.js`（`all_assets`/`equity_assets` 双分母、`estimated` 收益、未授权/空持仓不返回假 0）、`tests/http/readonly-contract.test.js`（只读 HTTP 契约）。`tests/unit/session-contract.test.js` 的 36/19/7/11 **冻结断言未变**且全部通过 |
| #16 | docs（`docs`） | 决策记录：§8「波次 3 决策记录」与 `docs/api-contract.md`「只读计算与派生投影（W1 波次 3）」同批入库；8 项 §8.1 变更一律按「只读端点 / 派生投影」口径表达，明确 P-04 / P-15 / P-05 / P-13 **不构成契约变更**（#14 已实现的部分） |
| #17 | frontend-lead（`frontend-lead`） | 前端把 P-04 / P-15 / P-17 页面改接只读计算端点：`pc/product-deposit`、`m/deposit` 读 `GET /api/calculations/deposit`，`m/holdings`、`m/companion` 读 `GET /api/calculations/portfolio`；含 404 / 501（端点未提供）、其他非 2xx（显示服务端 `error.code` 与 `error.message`）、网络失败、空态「该期限暂无挂牌利率」/**四类状态**，任何一类都不回填硬编码金额、不套用默认利率、不伪造 `calculation_id` |

基线校正要点（`9411ead`）：

- 「只读端点尚无 HTTP 暴露」的表述已过时——#14 已把四个 GET 端点与两份投影挂上路由；P-04 / P-15 / P-05 / P-13 条目中的「剩余工作：contract 暴露端点」应改读为「页面接线与成功态用例」。详见 §1.1 与 §8「波次 3 决策记录」的波次 4 补充。
- **#17 不等于 P-04 / P-15 / P-17 达标**：页面已改接服务端读数，但`DATA_MODE=database` 下 PostgreSQL `NUMERIC` 列以字符串返回（`holdings.amount` / `holdings.return_rate` 为 `"168420"` / `"0.1842"`；`products.annual_rate` 同样为 `NUMERIC` 列，按代码事实亦以字符串返回）。`portfolioCalculation.js` 的 `Number.isFinite(holding.amount)` 校验因此拒绝该输入 → `GET /api/calculations/portfolio` 返回 422 `INSUFFICIENT_EVIDENCE`（#14 已复测登记）。存款端点上 `depositCalculation.js` 的 `parseNumber` 可解析数字字符串，但 #17 页面侧对字符串利率不自行换算、原样交由服务端判定，**该分支在真库下能否达成成功态未经真库验证**，页面为防御式实现，因此本清单不把它记为成功态可达。**真库下这三页的成功态不可达**，该归一化由波次 4 的 `backend` 处理；在归一化落地并补成功态用例之前，P-04 / P-15 / P-17 仍计「未完全达标」，**不得虚减缺口数**。
- 波次 3 的 #15 属测试补齐、#16 属文档口径，均不改变页面运行行为，**不冲减任何缺口**；#17 虽改接了页面读数，但成功态不可达，同样**不冲减**（详见 §1.1「追加细分行（仅作排期参考，不冲减前四行）」）。

### 0.6 波次 4 收工登记与基线推进（2026-11-06，基线 `5bcb1cc`）

波次 4 已合并 4 个 PR，实际合并顺序为 **#18（`39147e4`）→ #19（`4c2bcda`）→ #21（`6fcdb0e`）→ #20（`5bcb1cc`）**；基线由 `9411ead` 推进到 **`5bcb1cc`**（#20 的合并提交，`git log --oneline 4c2bcda..5bcb1cc` 只有 `6fcdb0e` 与 `5bcb1cc` 两条）。本节只登记「服务端与页面已具备的前提」「已撤回的旧判断」与「仍不构成达标的部分」；判定尺度沿用 §0.4 / §0.5：**条目整体闭环 = 页面读数与服务端事实一致 + 成功态可达 + 成功/失败/空三态用例齐备**，缺一项即仍计待办。

| PR | 类型（owner） | 收工项 / 前提（对应本清单条目） |
|---|---|---|
| #18 | backend（`backend`） | **真库 `NUMERIC` 归一化**：新增 `src/platform/numeric/numericValue.js`（只接受有限 `number` 或十进制文本，`null`/空串/`1e3`/`0x10`/`Infinity`/布尔/对象一律 400 `VALIDATION_ERROR`，不静默当 0 或 null）与 `DataValueError extends ValidationError`（`src/platform/http/errors.js`）；`PortfolioService.calculate()` 在进入确定性计算前归一 `holdings.amount`（必填、`0 ≤ amount ≤ 1e12`）与 `holdings.return_rate`（允许 `NULL`＝收益估算不可用，存在却非数字 → 400），与 fixture 数字输入的结果逐字段一致（`calculation_id`、`total_amount`、`weights`、`max_concentration`、`equity.max_concentration`、`holding_return` 不变）。`BusinessRulesService.calculateDeposit()` 入口本已可解析 `"0.0215"` / `"2.15"`，本 PR 只补入口契约注释。**这是 P-04 / P-15 / P-17 页面成功态的「服务端侧」前置**：真库只读计算端点不再因字符串输入返回 422，**但页面能否在真库下取得成功态仍取决于页面侧三态用例（未补，见 §1.1）**。冻结集合未触碰；该归一化只覆盖只读计算入口，`aiOrchestrator` 证据包路径（§3 P-12 的 `diagnosis_explain`）**未在 #18 处理**（#18 描述「风险 / 后续」自述），属仍待办项。 |
| #19 | docs（`docs`） | 波次 3 进度登记与**波次 4 / 5 排期**（§0.5、§1.1、§8「波次 3 决策记录」的波次 4 补充、§11、§12）。本 PR 的 §11 登记位与 §12 排期即为本波次的排期依据；本清单的缺口基数口径**不因 #19 改变**（纯文档，不冲减）。 |
| #20 | frontend-diagnosis（`frontend-diagnosis`） | **P-13 保险动作改接真实保单事实**：`public/actions/diagnosis.js` 的 `m-coverage` / `m-policy` 不再对任何点击打开同一固定弹窗「安享长期医疗 ¥4,000,000」，改为按被点击元素的 `data-product` 从共享会话（`GET /api/demo-data` 的产品快照）读取该保险产品的 `coverage` / `annual_premium` / `sale_status` / `source_id` / `source_timestamp`，逐产品渲染「保险产品事实」，**不伪造保单号、生效日期与理赔进度**；无 `product_id`、快照中没有该产品、或所点对象不是保险产品时，一律显式空态「未授权或暂无可展示保单」，**无来源显式空态**；pg `NUMERIC` 字符串按文本原样展示，浏览器不做换算。同一 PR 的 **P-12 附带修复**：`m-diagnose` 删除 `productId \|\| 'fund'` 的静默改诊，缺 id / 未知 id 改显式空态。**未完成**：`422 INSUFFICIENT_EVIDENCE` → 「当前客户无该产品持仓，无法生成诊断」文案仍未实现（`runRealAiTask` 在 `public/app.js` 内自行 `catch` 并 `openLanding('ai-error')`，属 `frontend-lead` owner 范围，#20 已注明为后续项）。 |
| #21 | frontend-lead（`frontend-lead`） | **把 6 个 P 类页面的硬编码改为 `/api/demo-data`（与 `GET /api/knowledge`）的服务端事实**：P-02 `pc/product-fund`（产品卡片、费率/区间收益/回撤/可售状态/来源/时点取自 `products[]`；「观察区间」真正改变数据——非「近一年」为显式空态「该区间暂无数据」；净值/规模/持仓与行业分布/基金经理等未返回字段列为「未提供」）、P-03 `pc/product-insurance` + `pc/product-wealth`（产品行与事实字段改用服务端快照，新增可售状态列；保单板块 → 「未授权或暂无可展示保单」；理财页静态「注册资本 50 亿 / 在管规模 1,280 亿」已删除）、P-06 `pc/supply`（4 行硬编码供给与计数删除，供给行改取产品行；资讯/策略无来源显式空态）、P-08 `pc/library`（5 行硬编码目录与计数删除，卡片回指 `products[]`，知识版本/片段数取 `GET /api/knowledge` 投影；`GET /api/demo-data` 失败 → 「共享数据加载失败」）、P-14 `m/wealth`（「我行可售」徽章改只读 `sale_status`，缺失显示「可售状态未提供」）、P-16 `m/candidates`（固定文案「适配你的资金期限」删除，排序与理由同取 `candidateCalculation.reasons[].constraints` 与 `holding_months`）。**未完成**：P-02 仍无「近三年 / 成立以来」数据来源与规模/持仓分布字段；P-03 保单板块、P-06 资讯/策略供给、P-08 观点资产与审核状态均仍缺服务端来源；P-16 的 `score` 排序字段仍以 `reasons[]` 顺序呈现而非独立可复算分值；三态 E2E 用例未补。 |

**已撤回的旧判断（基线 `5bcb1cc`）**

- 「真库下 `GET /api/calculations/portfolio` 恒 422、存款端点成功态未经真库验证」：**服务端侧已撤回**——#18 在入口归一 `holdings.amount` / `return_rate`，存款端点对 `"0.0215"` / `"2.15"` 本就可解析；**但页面侧三态用例仍缺，故 P-04 / P-15 / P-17 的「达标」判断不变，仍计未完全达标**。
- 「`m-coverage` / `m-policy` 只开同一个固定弹窗」：**已撤回**——#20 已改为按被点击产品渲染，并为缺 id / 未知 id / 非保险目标提供显式空态（「两张保单内容不同」在无保单数据源前仍无法真实达成，见 §3 P-13）。
- 「`catalog.fund` / `catalog.insurance` / `catalog.wealth` 硬编码 3 只产品」「`pageSupply()` 4 行硬编码」「`pageLibrary()` 5 行硬编码」「`wealthCard()` 徽章不看 `sale_status`」「`m/candidates` 固定文案『适配你的资金期限』」：**均已撤回**——#21 已改为服务端快照驱动（未返回字段为「未提供 / 空态」，不以演示值补齐）。

**基线校正要点（`5bcb1cc`）**

- **冻结集合未变**：#18 只改 `src/components/business-rules/`、`src/components/demo-data/`、`src/platform/` 三个目录（36 key / 19 PATCH / 7 命令 / 11 `downstreamReset` 零改动，`tests/unit/session-contract.test.js` 断言未改）；#19、#21 为纯文档/前端；#20 只改 `public/actions/diagnosis.js`。
- **#21 的 6 个 P 类页面改接不等于达标**：§1.1「逐页严格达标」要求「成功态 + 三态用例齐备」才计入；本波次**没有任何 P 类页三态 E2E 用例入库**（E2E 仍为 9 用例 × 2 工程 = 15 次运行），因此 #21 冲减 0 页。
- **#18 不等于 P-04 / P-15 / P-17 达标**：服务端入口归一化只是「页面能拿到成功态」的前提；页面成功态仍需在真库 + 三态用例下验证。
- **#20 不等于 P-13 达标**：动作层已改接真实产品事实并交齐「无来源空态」，但保单数据源仍缺（§8.1 第 6 项仍需 `data` 提供保单表），列表页与保单内容差异用例未补，**仍计未完全达标**。
- **本波次属「已推进 · 波次 4」的条目**（原条目不删除，在下文对应条目追加标注）：P-02、P-03、P-04、P-06、P-08、P-12、P-13、P-14、P-15、P-16、P-17。

### 0.7 波次 5 收口登记与基线推进（2026-11-06，基线 `e4d8f49`）

波次 5 已合并 5 个 PR：`d6c7fa0`（#23 本清单波次 4 登记）、`a28e846`（#24 H 类 UI 收口）、`62ea985`（#25 三态用例 P-01/P-04/P-15）、`571e069`（#26 存款页重渲染修复）、`e4d8f49`（#27 PC 存款三态）。基线由 `5bcb1cc` 推进到 **`e4d8f49`**。本节只登记「代码事实变了什么」，**不改写 §1.1 / §1.2 的缺口基数**（覆盖口径改由 §15 矩阵重算）。

| PR | 类型（owner） | 对本清单的实质影响 |
|---|---|---|
| #24 | frontend-lead（`frontend-lead`） | H-01…H-06 的**页面侧**缺口收口：`pc/workspace` 最近使用/提醒改读 `activities[]`；`pc/candidates` 引导空态 + 理由/排序取 `candidateCalculation.reasons[]`；`pc/compare`、`m/compare` 消费 `comparable` / `incomparable_reason` 并显示「不可排名」；`pc/research` 重复提问提示与超范围拒答；`m/assistant` 删除硬编码提醒；`m/allocation` 新增 `rule-unsupported` 结果页规格；A04 新增可见「撤销授权」（复用 `set_authorization`，无新命令）；A20 引用展示 `chunk` 标题与页码。**冻结集合未改**（36/19/7/11 原样）。 |
| #25 | test-e2e（`test-e2e`） | 新增 `tests/e2e/three-state.spec.js`：P-01 成功态、P-04（`m/deposit` + `pc/product-deposit`）成功/失败/空三态、P-15 成功态。注入响应结构取自当前 `controllers` / `businessRulesService` / `portfolioService` / `healthService`；属**受控契约响应**，不是真实业务数据验收。 |
| #26 | frontend-lead（`frontend-lead`） | **生产缺陷修复**：`pc/product-deposit` 在 `GET /api/demo-data` 落地后没有重渲染、区间事实空值未守卫，导致 PC 存款页拿不到成功态。修复后才具备三态断言前提（#27 只加断言、不改生产代码）。 |
| #27 | test-e2e（`test-e2e`） | `tests/e2e/three-state.spec.js` 扩展到 `pc/product-deposit` 的成功/失败/空三态。 |

**E2E 规模更新（代码事实）**：`tests/e2e` 现有 6 个文件（`contract.spec.js` 4 用例、`mobile-flow.spec.js` 2、`pc-flow.spec.js` 1、`work-items.spec.js` 2、`three-state.spec.js` 5，另有 `helpers.js`），共 **14 个用例**；`pc` 工程排除 `mobile-flow`、`mobile` 工程排除 `pc-flow`，故合计 **25 次运行**。§1.2 / §13.4 中「15 次运行」的表述**自此被本节与 §15.1 取代**（原文保留追溯）。

**仍未变化的边界**：这 4 个 PR 都没有改 A–G 列指标、没有新增运行路由、没有改冻结集合、没有把 fixture 结果写成真实模型或生产验收结论。**页面三态覆盖的准确计数以 §15 为准**：H 类 UI 已收口不等于每个页面都有独立的三态断言。

### 0.1 真实模型与 fixture 的表述边界

W1 固定 `AI_MODE=fixture`，全部 AI 响应带 `execution_mode: "fixture"`，模型名为 `fixture-generate-1` / `fixture-deterministic-1536`，页面显示「演示桩 fixture」。因此：

- 本清单的「成功态」中的 AI 结果**只证明链路、结构与引用白名单真实**，不证明内容质量；
- 凡 AI 结果的质量（专业度、准确率、幻觉率、解读质量）一律按行方统一评测集判定（承载位置见架构文档附录 A 的对应行号），**不由 W1 的 fixture 结果宣称达标**；
- 任何页面收工时都必须保留「演示桩 fixture / 演示数据，不构成投资建议」标注，不得改写为真实模型或生产验收结论。

### 0.2 页面分类方法（依代码事实，不按观感）

对每个路由检查三件事：① 主体数据是否来自 `GET /api/demo-data`、`GET /api/knowledge` 或会话状态（`session-sync.js` 的 `replaceData`）；② 主操作是否已有注册 handler 并产生服务端状态；③ 是否存在硬编码的数值/状态徽章。据此分为：

- **待补·静态优先**：主体内容在 `app.js` 内硬编码，无服务端来源；
- **待补·部分真实**：已有真实闭环，但仍有硬编码数值/徽章或失败路径不可达；
- **基本达标**：主闭环与三态已由服务端驱动（收尾项见 §5）。

## 1. 30 个运行路由分页表

图例：`P-` 静态优先（§2 首页，逐页条目在 §3），`H-` 部分真实（§4）。「职责页」为架构文档 0.2 的路由归属。「关联 A 项」列的两种写法：`A01`–`A35` 为第 11 章编号；`A14b`、`A48` 等带后缀者为**架构文档附录 A 的行号映射键**（供追溯 xlsx A–G 列的承载位置，不是第 11 章编号）。

| # | 路由 | 职责页 | 分类 | 一句话当前态 | 主缺口 | 关联 A 项 |
|---|---|---|---|---|---|---|
| 1 | `pc/architecture` | PC 工作台 | P-01 | `pageArchitecture()` 的 KPI 与流程摘要为硬编码 | 数据源未接 `/api/health`、`/ready` | A13、A30 |
| 2 | `pc/workspace` | PC 工作台 | H-01 | 研究回答卡来自服务端，其余为演示待办 | 硬编码任务；`research-plan` 结果页为静态事实 | A03、A19、A34 |
| 3 | `pc/product-fund` | PC 产品洞察 | P-02 | `productPage('fund')` 的产品卡片、费率/区间收益/回撤/可售状态/来源/时点已取自 `GET /api/demo-data`，「观察区间」切换真正改变数据（**已推进 · 波次 4 · PR#21**） | 近三年/成立以来无数据来源（显式空态）；规模、持仓与行业分布、基金经理未返回；三态用例缺失 | A02、A08、A19 |
| 4 | `pc/product-insurance` | PC 产品洞察 | P-03 | 产品行与事实字段改读服务端快照，「我的保单」板块改为「未授权或暂无可展示保单」空态（**已推进 · 波次 4 · PR#21**） | 保单数据源缺失；三态用例缺失 | A02 |
| 5 | `pc/product-wealth` | PC 产品洞察 | P-03 | 产品行与事实字段改读服务端快照，静态「注册资本 / 在管规模 / 审计日」已删除（**已推进 · 波次 4 · PR#21**） | 管理人字段无服务端来源；三态用例缺失 | A02 |
| 6 | `pc/product-deposit` | PC 产品洞察 | P-04 | 产品事实来自 `/api/demo-data`；测算已改读 `GET /api/calculations/deposit`（**已推进 · 波次 3 · PR#17**）；真库 `NUMERIC` 字符串在服务端入口已归一（**已推进 · 波次 4 · PR#18**） | 页面固定本金 500000 / 3 年、期限切换与逐期限空态未补；真库成功态与三态用例仍缺 | A08 |
| 7 | `pc/product-private` | PC 产品洞察 | P-05 | 整页为 `pageProductPrivateRestricted()` 受限提示。**已推进 · 波次 3**：认定状态与受限产品定为只读派生投影（不进会话状态） | 无认定状态、无产品数据；页面尚未消费派生投影 | A10、A13 |
| 8 | `pc/candidates` | PC 产品洞察 | H-02 | 候选来自 `session.candidates`；**变更**：`d0b7620` 起候选资格/理由/排序由 `candidateCalculation` 给出（`reason`、`constraints`、`holding_months`），`match` 已恒为 `—`（`session-sync.js` 覆盖产品字段） | 无候选时缺**专用引导**空态（现仅表体缺省行）；`score` 仍缺服务端字段，排序值不可复算 | A06、A48 |
| 9 | `pc/compare` | PC 产品洞察 | H-03 | 比较集来自 `session.compareSet`；**变更**：`comparisonBasis`/`compareBasis()` 已产出确定性口径（`type`+`risk`+`benchmark`）与 `comparable`/`incomparable_reason` | 前端未消费该口径：`m/compare` 固定结论文案仍在、口径切换只改行标签（见 H-03） | A07 |
| 10 | `pc/supply` | PC 财富投研 | P-06 | 4 行硬编码供给与 `metric()` 计数已删除，供给行改取 `GET /api/demo-data` 产品行（**已推进 · 波次 4 · PR#21**） | 资讯 / 策略 / 行业观点无服务端来源（显式空态）；三态用例缺失 | A02、A13 |
| 11 | `pc/research` | PC 财富投研 | H-04 | `research_qa` 真实，回答/错误卡片已接 | 重复提问无状态提示 | A09、A18、A57 |
| 12 | `pc/events` | PC 财富投研 | P-07 | `researchPage('events')` 静态列表 | 无服务端来源与三态 | A02、A11 |
| 13 | `pc/macro` | PC 财富投研 | P-07 | 同上 | 同上 | A02、A11 |
| 14 | `pc/industry` | PC 财富投研 | P-07 | 同上 | 同上 | A02、A11 |
| 15 | `pc/library` | PC 财富投研 | P-08 | 5 行硬编码目录与计数已删除，卡片回指 `products[]`，知识版本/片段取 `GET /api/knowledge` 投影（**已推进 · 波次 4 · PR#21**） | 观点资产与审核状态无服务端字段（已移出表格）；三态用例缺失 | A02、A20 |
| 16 | `pc/reader` | PC 财富投研 | P-09 | 5 章内容硬编码；`summary` 常因缺 `document_id` 拒绝 | 正文与 `doc-*` 无绑定 | A20、A53 |
| 17 | `pc/writing` | PC 财富投研 | P-10 | 3 类写作品类与 QC 徽章硬编码 | 草稿状态不持久 | A11、A54 |
| 18 | `pc/result` | PC 公共结果 | P-11 | `landingSpec` 53 条映射；含假数据项 | 注销了假成功，但版本/权限为空 | A11、A13 |
| 19 | `m/assistant` | 手机主流程 | H-05 | `assistant_qa` 真实 | 「2 条持仓提醒」硬编码；无多轮 | A14、A14b、A03 |
| 20 | `m/fund` | 手机主流程 | P-12 | 4 条基金硬编码；仅 A500 可诊基。**已推进 · 波次 4 · PR#20**：`m-diagnose` 删除 `productId \|\| 'fund'` 静默改诊，缺 id / 未知 id 显式空态 | 列表仍为前端硬编码（不映射 `product_id`）；`422 INSUFFICIENT_EVIDENCE` 专用文案未实现（`runRealAiTask` 自 catch → `ai-error`） | A08、A19、A10 |
| 21 | `m/insurance` | 手机主流程 | P-13 | `m-coverage`/`m-policy` 按被点击产品渲染服务端保险事实、无来源显式空态（**已推进 · 波次 3、波次 4 · PR#20**） | 列表页保障缺口与待办仍无真实来源；无保单数据源，「两张保单内容不同」无法达成 | A08、A10 |
| 22 | `m/wealth` | 手机主流程 | P-14 | `wealthCard()` 来自 `productOf`（真实产品）；「我行可售」徽章改只读 `sale_status`、缺失显示「可售状态未提供」（**已推进 · 波次 4 · PR#21**） | `wealth`/`cash` 无知识片段；三态用例缺失 | A08、A10 |
| 23 | `m/deposit` | 手机主流程 | P-04 | 到期本息已改读 `GET /api/calculations/deposit`（**已推进 · 波次 3 · PR#17**），服务端入口已归一真库字符串（**已推进 · 波次 4 · PR#18**） | 真库成功态与三态用例仍缺 | A08 |
| 24 | `m/private` | 手机主流程 | P-05 | 受限页 + `m-contact`（`contactTodo`） | 无认定状态与未认定/已认定分叉 | A10、A13 |
| 25 | `m/allocation` | 手机主流程 | H-06 | `rule_match` → `generate_allocation` → `generate_candidates` 已真实闭环（`cf07b1b` 实测默认目标产出 `allocation-balanced-r3`） | 两类失败态（`UNSUPPORTED_RULE`、`NEED_CONFIRMATION`）**共用** `rule-confirmation` 结果页；`NEED_CONFIRMATION` 在表单恒有默认值时不可达 | A04、A05、A24 |
| 26 | `m/holdings` | 手机主流程 | P-15 | 持有收益/贡献/集中度已改读 `GET /api/calculations/portfolio`，双分母分别标注（**已推进 · 波次 3 · PR#17**）；真库 `holdings.amount` / `return_rate` 在服务端入口已归一（**已推进 · 波次 4 · PR#18**） | 真库成功态未经页面用例确认；复算用例与空态用例未补 | A08、A10 |
| 27 | `m/candidates` | 手机主流程 | P-16 | 候选来自服务端；固定文案「适配你的资金期限」已删除，排序依据与约束改取 `candidateCalculation.reasons[].constraints` / `holding_months`（**已推进 · 波次 4 · PR#21**） | 排序以 `reasons[]` 顺序呈现，仍无独立可复算 `score` 字段；三态用例缺失 | A06、A48 |
| 28 | `m/compare` | 手机主流程 | H-03 | 同上；「历史收益更高…」为固定文案 | 固定结论文本 | A07、A45 |
| 29 | `m/companion` | 手机主流程 | P-17 | `+0.86%`、`68%` 等硬编码已移除，复盘数字改读 `GET /api/calculations/portfolio` 并标注「演示数据 · AI_MODE=fixture」（**已推进 · 波次 3 · PR#17**）；服务端入口已归一真库字符串（**已推进 · 波次 4 · PR#18**）；`R3` 改取会话目标 | 收益金额/收益率取自 `estimated` 口径、仅标「估算」，服务端未产出「目标完成度」与「风险仍在 R3」对应字段（风险等级改取会话目标）；`m-event` 仍为固定文本；三态用例未补 | A08、A11、A50 |
| 30 | `m/result` | 手机公共结果 | P-11 | 复用 `landingBody()` | 同 P-11 | A11 |

合计：**P 类 17 页**（P-01…P-17），**H 类 13 页**（H-01…H-06，其中 H-03 同时覆盖 `pc/compare`、`m/compare`）。`pc/result` 与 `m/result` 共用 P-11。

### 1.1 校正后的缺口基数（基线 `9411ead`，2026-11-06 波次 3 后重算）

> 本表**替代**任何旧一轮使用的「缺口条目数」。后续 Worker 排期只认本表；若与本表不一致，先按 §0.3 复核再改本表。

| 口径 | P 类 | H 类 | 合计 |
|---|---|---|---|
| 条目总数（按定义） | 17 页（P-01…P-17） | 6 组 / 13 页（H-01…H-06） | **23 条目 / 30 路由** |
| 已收工（设计条目整体闭环） | 0 | 0 | **0** |
| 已收工（单项缺口，见下） | 2 | 1 | **3** |
| 剩余待办条目 | 17 | 6 | **23** |
| 剩余待办单项缺口 | 31 | 14 | **45** |
| ├ 其中：已被只读端点/派生投影覆盖口径（波次 3 登记，**页面未接线前仍计入待办**） | 5 | 2 | **7**（见下行明细） |
| ├ 其中：明确滞后且需状态契约 owner 批准的缺口（§8.1 第 3、7 项） | 1 | 0 | **1** |
| └ 其中：纯页面侧、无契约前置的缺口 | 27 | 12 | **39** |

**「已被只读端点/派生投影覆盖口径」的 7 项明细（仍计入待办）**：P-04 的 `pc/product-deposit`（`m/` 侧见下方 H 类部分；`m-deposit-compare` 是同一页内的动作，不单列）、P-15 的 `m/holdings`、P-05 的 `pc/product-private` 各 1 项 = 4 项；H 类为 `pc/product-deposit`/`m/deposit`（P-04）与 `pc/product-private`（P-05）被 `pc/` 与 `m/` 双页覆盖的部分，合计 2 项。**P 5 + H 2 = 7 项，与上行合计一致。P-01 的 `/api/health` 与 `/ready` 未接入不在此 7 项内**（它属于状态端点接线，排期另计）。这些数字只表示「口径已覆盖」，**不表示已收工**。

**波次 3 计数口径（不得虚报）**：波次 3 的 #14 / #15 / #16 只落地「服务端已有计算的只读暴露 + 单测 + 文档口径」，#17 虽把 P-04 / P-15 / P-17 三页改接服务端读数，但**真库下成功态仍不可达**（§0.5 第二条）。因此上表前四行的条目/缺口总数与波次 2 后一致（23 条目 / 45 单项缺口待办，`0 / 30` 页达标），**波次 3 冲减 0 项**。新增的三个细分行只是把 45 项按「阻塞性质」拆开，便于排期，**不得**把「已被只读端点覆盖」读成「已收工」：页面改接服务端读数**并**在真库下拿到成功态**并**交齐三态用例之前，该项仍计待办。已在等待页面接线的四项为 P-04（存款只读端点）、P-15（持仓只读投影）、P-05（认定状态只读派生）、P-13（保单只读派生）；#17 只覆盖 P-04 / P-15 / P-17 三页，P-05 / P-13 页面仍未接线。#12 删除前端自算存款本息、#13 移除落地页假数据项属**删假值**，未用服务端真实数据替换，故不冲减任何缺口。

**追加细分行（仅作排期参考，不冲减前四行，基线 `9411ead`）**

> 本章前四行仍是对外唯一的缺口基数。下列细分只是把「#17 之后还剩什么」按阻塞性质列清，**不得**被引用为「剩余缺口 34 项」之类的达成结论。

| 细分（按波次 3 后的阻塞性质） | P 类页 | H 类页 | 合计 |
|---|---|---|---|
| ① 已完成页面改接（#17），但真库 `NUMERIC` 字符串使成功态不可达/未验证 | 3：P-04 `pc/product-deposit`、P-15 `m/holdings`、P-17 `m/companion` | 0 | **3** |
| ② 口径已由只读端点/派生投影覆盖，页面完全未接线 | 1：P-05 `pc/product-private` | 2：P-04 `m/deposit`、P-05 `m/private` | **3** |
| ③ 保单派生投影已覆盖口径，但无真实保单来源，成功态（两张保单内容不同）无法达成 | 1：P-13 `m/insurance` | 0 | **1** |
| ④ 无契约前置、无后端归一化前置，只剩页面侧工作 | 12 | 11 | **23** |
| 合计（= 上表「剩余待办单项缺口」；①②③ 已各自单列，不并入 ④） | 31 | 14 | **45** |

> 核对：P 类 3 + 1 + 1 + 12 = 17 页、H 类 0 + 2 + 0 + 11 = 13 页，与 §1 的 17 P / 13 H 一致；① 的 3 项与「两种完成度口径」②中的 3 页对应，②③ 即上文「已被只读端点/派生投影覆盖」的 7 项减去 ① 后的剩余部分（① 3 项 + ②③ 4 项 = 7 项）。

> 读法：①②③ 是关键路径上的 7 项（① 等波次 4 `backend` 归一化，② 等页面接线，③ 等 `data` 保单来源），④ 为不依赖任何前置的 23 项。任何一行都**不表示已收工**：`0 / 23` 条目、`0 / 30` 页达标，与上表前四行一致。§6 红线 3 的「不把 C/D/E 类指标写成已由 W1 fixture 判定」不因本节新增而改变。

**波次 4 之前必须先解决的前置（来源：PR#14 描述「已知问题」）**：`holdings.amount` / `holdings.return_rate` 在 `DATA_MODE=database` 下是 pg `NUMERIC` 字符串，`portfolioCalculation.js` 的 `Number.isFinite` 校验拒绝 → `GET /api/calculations/portfolio` 422 `INSUFFICIENT_EVIDENCE`；`products.annual_rate` 同属 `NUMERIC` 列，存款端点依赖的利率同为字符串输入。同一缺陷亦存在于 `diagnosis_explain` 证据路径。该归一化由波次 4 的 `backend` owner 处理；**本清单不把该缺陷计入缺口数**（缺口数以页面达标为准，已在 45 项内），也不得在归一化前把 P-04 / P-15 / P-17 记为达标。

**已收工单项缺口（「已收工 · PR#」登记，不代表条目整体闭环）**

| 缺口 | 归属 | PR | 说明 |
|---|---|---|---|
| H-06 缺口 ①：fixture 为默认目标返回合法 `rule_id` | H-06 | #9（既有行为，本波次校正） | `pickAllocationRule()` 自 `2d9ad15` 起即返回 `allocation-balanced-r3`（R1/R2 → `allocation-liquid-r2`），**非** #9 修复项；原 H-06「方案永不生成」断言不成立，予以撤回 |
| H-02 排序值不来自 `candidateCalculation`（缺陷侧） | H-02 | #9 | 服务端已产出 `reasons[]`（含 `constraints`、`holding_months`）与确定性排序；`score` 字段前端消费仍归 #16 |
| P-02 一页纸引用证据含 `product:<id>` | P-02 | #9 | `structured_facts.products[]` 携带 `data_id`/`candidate_calculation`，`product:<id>` 可回指；观察区间切换仍待办 |

**两种完成度口径（不得混用）**

| 口径 | 当前值 | 构成 | 不得由此宣称 |
|---|---|---|---|
| ①「主链路闭环已通」 | **30 / 30 路由可达**；手机与 PC 两条闭环 E2E 全绿（见下） | 路由白名单 30 个全部有渲染与入口；`CONTEXT.md` 冻结的手机（助手→持仓→诊断→配置→候选→比较→陪伴）与 PC（工作台/研究→产品解释→候选→比较→保存）两条闭环均已端到端跑通 | 不表示 30 个页面「逐页达标」；静态页与硬编码 KPI 仍存在（P 类 17 页） |
| ②「30 页逐页达标」 | **0 / 30 页达标**（23 / 23 条目待办，45 / 48 单项缺口待办；其中 3 页已由 #17 改接只读端点但真库成功态不可达，4 页口径已由只读端点/派生投影覆盖而页面未接线） | 需每个条目在 §2 模板下交齐成功/失败/空三态与真实服务端来源 | 不表示主链路未通；①与②互不替代；「口径已覆盖」与「页面已改接」都不表示「页面已达标」 |

**口径 ① 的证据**：`tests/e2e` 共 9 个用例 × 2 个 Playwright 工程（`pc` / `mobile`）= **15 次运行**；`ensureAuthorization()` 真实点击 `m-generate-allocation` 并等待结果页「配置方案与候选已生成」，`mobile-flow` 断言 `plan` 非空且 `candidates.length >= 2`。该证据只证明**链路与状态写入真实**，不证明页面内容质量（§0.1）。截至本波次提交，当前基线 `9411ead` 上的 GitHub Actions 运行结论以 PR #17 的 6 个 job + `ci-merge-gate`（以及波次 4 各 PR 自身的门禁）为准，本地 15/15 结论不得替代该门禁；波次 3 期间 #14 曾因 `/api/knowledge` 的授权前置改动导致 `ci-e2e-smoke` 红、随后修复，说明 ① 的证据必须以**当次基线**的门禁结论为准。

**波次 3 后 E2E 覆盖口径（如实登记）**：`tests/e2e` 仍为 9 用例 × 2 工程 = 15 次运行，**未**新增用例；#17 改接的三页（`pc/product-deposit`、`m/holdings`、`m/companion`）在仓库内**没有**成功/失败/空三态用例，仅由 #17 PR 描述中的页面级人工核验（端点 404 态 + 注入契约响应）作为证据，**不构成 ② 的达标证据**。E2E 从 15 项扩到覆盖 30 页归波次 5（§12）。

**排期约束**：不得再按旧基数（曾写作「P 17 条 + H 6 组待办、H-06 全链路不可达」）排期；H-06 已从「阻塞项」降级为「两类失败态文档化」的小项。

说明：`pc/architecture` 在 `CONTEXT.md` 中属于 PC 工作台闭环，冻结的闭环清单（手机：助手→持仓→诊断→配置→候选→比较→陪伴；PC：工作台/研究→产品解释→候选→比较→保存）未单列它，因此按接口状态页补，按 A13/A30 验收，不额外新增指标。

### 1.2 波次 4 后缺口基数重算（基线 `5bcb1cc`，2026-11-06）

> 新增 2026-11-06：本节在 §1.1 之后补入，承接其前四行口径。本节是 §1.1 的**波次 4 后唯一有效基数**；§1.1 的 `9411ead` 表保留追溯，仅在被引用处按本节重新取值。判定口径未变：**「成功态 + 三态用例齐备」才计入达标，仅删假值、仅改接读数、仅做类型归一化都不冲减。**

| 口径（基线 `5bcb1cc`） | P 类 | H 类 | 合计 |
|---|---|---|---|
| 条目总数（按定义） | 17 页（P-01…P-17） | 6 组 / 13 页（H-01…H-06） | **23 条目 / 30 路由** |
| 已收工（设计条目整体闭环） | 0 | 0 | **0** |
| 已收工（单项缺口，见下） | 2 | 1 | **3** |
| 剩余待办条目 | 17 | 6 | **23** |
| 剩余待办单项缺口 | 31 | 14 | **45** |
| ├ 其中：已改接服务端读数、但真库成功态或三态用例未确认（波次 3/4 登记，**仍计入待办**） | 5：P-02 `pc/product-fund`、P-04 `pc/product-deposit`、P-08 `pc/library`、P-15 `m/holdings`、P-17 `m/companion` | 1：P-14 `m/wealth` | **6** |
| ├ 其中：页面主体改接服务端事实、空态已交，但数据源仍缺（**仍计入待办**） | 3：P-03 `pc/product-insurance` + `pc/product-wealth`（保单/管理人来源）、P-06 `pc/supply`（资讯/策略来源）、P-13 `m/insurance`（保单来源） | 2：P-04 `m/deposit`、P-16 `m/candidates` | **5** |
| ├ 其中：口径已由只读端点/派生投影覆盖、页面完全未接线（波次 3 登记，波次 4 未变化） | 1：P-05 `pc/product-private` | 2：P-05 `m/private`、P-12 `m/fund` | **3** |
| ├ 其中：明确滞后且需状态契约 owner 批准的缺口（§8.1 第 3、7 项） | 1 | 0 | **1** |
| └ 其中：纯页面侧、无契约与数据源前置的缺口 | 21 | 9 | **30** |

**本期冲减：0 项（与波次 3 后一致：条目 0 / 23 已收工、23 待办；单项缺口 3 已收工、45 待办，合计 48）**。理由逐条登记：

1. **#18（backend 归一化）不冲减**：它只让只读计算端点在真库下能返回成功态，属类型层修复；P-04 / P-15 / P-17 的页面成功态与三态用例仍未入库。
2. **#20（保险动作）不冲减 P-13**：动作层已按被点击产品渲染真实产品事实并无来源空态，但保单数据源（§8.1 第 6 项）仍缺，「两张保单内容不同」无法真实达成，列表页缺口与待办也未来源化。
3. **#21（6 个 P 类页面改接）不冲减**：页面读数已改，但三态 E2E 用例未补（见下「E2E 覆盖口径」）；按 §1.1 的尺度仍计待办。
4. **#19 为纯文档（不冲减）**，且 #19 本身的 §11 误把「波次 3 进度登记」记为 #18（应为 #19），本 PR 已在 §11 更正并保留原文。

**波次 4 后的计数口径（不得虚报）**：P 类仍为 17 页；「已改接服务端读数」的页面由波次 3 的 3 页增至 6 页（P-02 / P-04 / P-08 / P-14 / P-15 / P-17），但**这 6 页没有一页交齐三态用例**，因此「逐页严格达标」恒为 `0 / 30`。原 §1.1 细分行①「已完成页面改接但真库成功态不可达」的表述按本期更新为「已改接、真库成功态或三态用例未确认」；细分行②「口径已覆盖、页面未接线」由 3 项降为：P 侧 1 项（P-05 PC）、H 侧 2 项（P-05 手机、P-12），**P-04 `m/deposit` 已由 #17 接线**，不再属「完全未接线」。

**两种完成度口径（基线 `5bcb1cc`，不得混用）**

| 口径 | 当前值 | 构成 | 不得由此宣称 |
|---|---|---|---|
| ①「主链路闭环已通」 | **30 / 30 路由可达；E2E 15 / 15 全绿**（截至 `9411ead`，即 #17 的 6 个 job + `ci-merge-gate` 结论） | 路由白名单 30 个全部有渲染与入口；冻结的手机与 PC 两条闭环已端到端跑通；#20 / #21 的 PR 描述自述本地 `npm run test:e2e` 15/15 通过 | 不表示 30 个页面「逐页达标」 |
| ②「30 页逐页达标」 | **0 / 30 页达标**（23 / 23 条目待办，45 / 48 单项缺口待办） | 需每个条目在 §2 模板下交齐成功/失败/空三态与真实服务端来源；「成功态 + 三态用例齐备」才算达标，**仅删假值不计数** | 不表示主链路未通；①与②互不替代 |

> 口径 ① 中 `5bcb1cc` 的门禁结论**待编排器确认**：本清单作者按任务约束不得查阅或触发 CI，本期以 `9411ead` 的已合并结论 + #20 / #21 PR 描述中的本地 15/15 为准；合并后基线若与本登记不一致，以编排器回填为准。

> **基线 `e4d8f49` 追加更正（2026-11-06，取代本节上述 E2E 规模）**：波次 5 已合并 #24–#27，`tests/e2e` 现为 **14 个用例 / 25 次运行**（见 §0.7）。**「逐页三态覆盖」不再按本节与 §13.4 的「无三态用例」笼统表述**，以 §15 矩阵按路由逐条重算：完整三态断言的路由为 **2 / 30**（均属 P-04 的 `m/deposit` 与 `pc/product-deposit`，且为受控契约响应），仅成功态独立断言的为 **4 / 30**，零独立三态断言的为 **26 / 30**。口径 ② 的结论仍为 `0 / 30`「真实业务数据验收达标」，但**依据已换为 §15**，不再以「完全没有三态用例」为由。

**E2E 覆盖口径（基线 `5bcb1cc`，如实登记）**：`tests/e2e` 在 `5bcb1cc` 上仍为 **9 个用例**（`contract.spec.js` 4、`work-items.spec.js` 2、`pc-flow.spec.js` 1、`mobile-flow.spec.js` 2）× 2 个 Playwright 工程（`pc` / `mobile`）= **15 次运行**，#18/#19/#20/#21 **均未新增 E2E 用例**（`git diff --stat 4c2bcda 5bcb1cc` 无 `tests/` 改动；`tests/e2e/` 仍为 5 个文件，含 `helpers.js`）。#17 改接的 3 页与 #20/#21 涉及的 9 个条目**均无成功/失败/空三态用例**，仅由 PR 描述中的人工核验与 `npm run test:e2e` 的回归作为证据，**不构成 ② 的达标证据**。E2E 扩展归波次 5（§12.2）。

**服务端单元格（波次 4 后新增的前提）**：`GET /api/calculations/portfolio`（#14 暴露）在真库下对 `holdings.amount` / `holdings.return_rate` 的字符串输入由 `PortfolioService.calculate()` 入口归一（#18），非法值 400 `VALIDATION_ERROR` 并带 `field`/`reason`/`received`，不再由下游抛 422；`GET /api/calculations/deposit` 对 `"0.0215"` / `"2.15"` 均可解析。**`aiOrchestrator` 证据包路径（`m-diagnose` → `diagnosis_explain`）未归一**，真库下仍可能因字符串 `amount` 抛 422（#18 描述自述为后续项）。

## 2. 逐页填写模板（每个 W/P 条目都要交齐）

领取条目时按下列字段填写，缺一项视为未完成：

| 字段 | 要写什么 |
|---|---|
| 页面/路由 | 白名单路由，不得新增 |
| 当前演示态 | 代码事实：哪个函数、哪段硬编码、哪个 handler 缺失 |
| 目标完成条件 | 用户可见的可验收行为（不是实现方式） |
| 成功态 | 页面显示什么、由哪个服务端字段驱动 |
| 失败态 | 错误码 → 页面显示什么（不得静默成功） |
| 空态 | 数据为空时显示什么（不得用默认值补齐） |
| 服务端权威状态 | 会话字段 / 表 / 计算函数 |
| 命令或接口 | `POST /api/sessions/:id/commands` 的 `command`，或 `GET/PATCH/POST` 路径 |
| 验收用例归属 | `tests/unit` / `tests/integration` / `tests/e2e` 中的哪一类（本文不写测试代码） |
| 关联 A 项 / 行号 | 第 11 章编号（本文 0.2 的 A14b、A48b、A53b、A54b、A57b 为 A–G 列映射的稳定键，非第 11 章编号） |

通用约束（所有条目都适用）：

1. **三态必须有独立断言**：成功态、失败态、空态各一条；
2. **失败态只能由服务端真实错误驱动**（`422 INSUFFICIENT_EVIDENCE`、`503 DEPENDENCY_UNAVAILABLE`、`409 VERSION_CONFLICT`、`400 VALIDATION_ERROR`、`404 NOT_FOUND`），不得在浏览器构造；
3. **空态不得用默认值补齐**（A07 明确「缺失值不编造」）；
4. **不得新增 0.2 白名单之外的运行页面或入口**（A01、A31、A33）；
5. **不得新增假闭环**：没有服务端写入的操作必须落到「W1 未实现」失败态（`not-implemented`），现状示例：`landingSpec` 中的 `workspace`、`subscribe`、`templates`、`extract`、`review-writing`、`filter-panel`、`task-center` 等条目仍显示硬编码状态。

## 3. P 类：静态优先（17 页）

### P-01 `pc/architecture`

- **当前演示态**：`pageArchitecture()` 四张 `metric()`（已接入能力 28、今日调用量 18,426、专业评测通过率 94.6%、待处理事项 6）与「服务健康度」（接口可用性 99.98%、平均响应 1.8s、引用可追溯 98.2%）均为硬编码；`researchPage`/`supply`/`library` 的 `metric()` 同理。
- **目标完成条件**：页面所有数字都可由 `/api/health`、`/ready`、`/api/demo-data` 或会话状态复算；无法由服务端提供的指标**不展示**；`execution_mode` 与知识版本明示「演示桩 fixture」。
- **成功**：健康度卡片由 `dependencies.{database,storage,knowledge,rules,contract}` 的 `ready` 与 `api_version`/`frontend_contract_version` 驱动；"演示桩 fixture" 标注可见。
- **失败**：`/api/health` 不可达时整块显示「共享应用服务未连接」，不显示任何默认数字。
- **空**：`待处理事项` 无数据时显示「当前无待处理事项」，不显示 6。
- **权威状态**：`/api/health`、`/ready`（`healthService.ready()` 的 7 项 `checks`）。
- **命令/接口**：`GET /api/health`、`GET /ready`（现状 30 路由中唯一用到 `/ready` 的只有 CI 就绪探针）。
- **验收用例**：`tests/e2e`（页面无硬编码 KPI 的断言 + 失败态）；`tests/integration`（`/ready` 未就绪时页面状态）。
- **关联**：A13、A29、A30、A35；R20–R22、R58、R60–R62（E 类，只记录真实数据，不作达标结论）。

### P-02 `pc/product-fund`

- **当前演示态**：`productPage('fund')` 的 `catalog.fund.products`（A500/HS300/GROW）全部硬编码于 `app.js`，而 `/api/demo-data` 中同名产品与持仓 `holding-001`（`fund`，168420）**已存在**；「观察区间」切换只改标签，`interval` 未参与任何取数，金融数据不随区间变化。
- **目标完成条件**：净值/区间收益/费率/规模/持仓与行业分布均来自服务端产品事实（`GET /api/demo-data` 或 `/api/knowledge`），切换区间必须改变数据或明确「该区间无数据」；一页纸沿用真实 `product_explain`。
- **成功**：产品卡片字段与 `/api/demo-data` 的 `products[]`/`holdings[]` 对应；`观察区间` 生效并显示数据时点（`data_as_of`）。
- **失败**：`onepager` 失败显示 `422/503` 原文（`ai-error`），不显示硬编码解释；`currentProductId()` 无法映射时显式报错（现状已如此，保留）。
- **空**：所选区间无数据 → 「该区间暂无数据」，不回落默认曲线。
- **权威状态**：`products` 表（`sale_status`、`risk`、`latest_return`、`drawdown`、`annual_rate`、`fee`、`liquidity`、`source_id`、`source_timestamp`）+ `holdings`。
- **命令/接口**：`GET /api/demo-data?session_id=`、`POST /api/ai/generate`（`task_type:'product_explain'`）。
- **验收用例**：`tests/e2e`（字段与接口一致 + 区间切换生效 + 空态）；`tests/integration`（`product_explain` 证据含 `product:<id>`）。**已收工 · PR#9（仅证据侧）**：`structured_facts.products[]` 携带 `data_id` 与 `candidate_calculation`，`product:<id>` 可回指本次证据包；字段一致性、区间切换与空态仍待办。
- **已推进 · 波次 4 · PR#21**：`productPage('fund')` 的产品卡片、费率、区间收益、回撤、可售状态、来源与数据时点均改读 `GET /api/demo-data` 的 `products[]`（代码事实：`serverProductRows()` + `saleStatusOf()`）；「观察区间」按 `fundIntervalFact()` 真正改变数据——只有 `近一年`（`latest_return` 口径）能展示数值，`近三年` / `成立以来` 显示显式空态「该区间暂无数据」并说明服务端没有该区间序列，**不沿用近一年数值、不画示意曲线**；`GET /api/demo-data` 失败时整块显示「共享数据加载失败」+ 真实状态码/错误码，`status !== ok` 时显示「读取中」，不展示静态行；快照未返回的字段（净值序列、规模、持仓与行业分布、基金经理、费率结构）列为「未提供 · 含原因」。**仍不达标**：① 无「近三年 / 成立以来」数据来源（空态为预期）；② 三态只有「空态」（区间）与「失败态」（快照失败）的页面呈现，**`tests/e2e` 无任何成功/失败/空断言**；③ 一页纸仍走真实 `product_explain`，未回归。**本条目标整体未收工。**
- **关联**：A02、A08、A17、A19；R8、R43、R44（质量由行方统一评测集判定）。

### P-03 `pc/product-insurance`、`pc/product-wealth`

- **当前演示态**：`catalog.insurance`（MED/CI/ANNU）与 `catalog.wealth`（W180/WCASH/WPLUS）硬编码；保险的「我的保单」（3 张、续保日 2026-10-12）、「理赔服务」时间线；理财的「理财公司」（注册资本 50 亿、在管规模 1,280 亿、审计日）均为静态文本。`W180`→`wealth`、`WPLUS`→`wealthplus`、`WCASH`→`cash` 已有映射。
- **目标完成条件**：产品事实取自服务端；「我的保单」「管理人信息」若无真实来源，**改为不展示或标「演示数据」并列入空态**，不得作为事实呈现。
- **成功**：事实字段与 `/api/demo-data` 一致；`product_explain` 携带 `product:<id>` 与至少一项引用。
- **失败**：见 `wealth`/`cash` 的知识边界（§5.1）——`product_explain` 不会因缺片段报错，但引用只能是结构化事实 `product:<id>`；若实现方要求「必须引用知识片段」，会得到 `400 VALIDATION_ERROR`，此时页面必须显示真实错误而不是预置解读。
- **空**：无保单数据 → 「未授权或暂无可展示保单」，不显示 3 张。
- **权威状态**：`products` 表；保单需新增服务端来源，否则本板块降级为说明页。
- **命令/接口**：`GET /api/demo-data`、`POST /api/ai/generate`（`product_explain`）。
- **验收用例**：`tests/e2e`（两页各一条成功/空态）。
- **已推进 · 波次 4 · PR#21**：两页产品行与事实字段改读服务端快照并新增「可售状态」列（`sale_status`）；保险页「我的保单与理赔服务」板块改为显式空态「未授权或暂无可展示保单」并说明保单号/生效日/续保日/理赔进度均无来源；理财页静态「注册资本 50 亿 / 在管规模 1,280 亿 / 审计日」已删除，替换为「暂未由服务端提供的字段」空态；`wealth` / `cash` 无知识片段的边界保持 §5.1 口径（不补片段）。**仍不达标**：① 保单与「管理人」字段仍无服务端来源（§8.1 第 6 项及数据接入）；② 两页**无** E2E 成功/空态用例。**本条目标整体未收工。**
- **关联**：A02、A13、A19；R9（A/D 类）、R43。

### P-04 `pc/product-deposit`、`m/deposit`

- **当前演示态（基线 `cf07b1b`；`9411ead` 已由 #17 改接只读端点，见文末「已推进 · 波次 3 · PR#17」）**：`pc/product-deposit` 的「测算工具」在前端用常量 `principal=500000` 与 `parseFloat(current.rate)` 计算（实际上永远用 0.021，与该产品无关）；`m/deposit` 的到期本息由 `updateDeposit()` 在浏览器计算。「比较提前支取」（`m-deposit-compare`）同样在浏览器算。
- **代码事实复核**：`m-deposit-compare` 对 500,000 元、3 年期按 2.15% 单利算得 **¥532,250（利息 ¥32,250）**，与页面静态初值一致；但 1 年期应得利息 ¥6,880、5 年期 ¥34,400，**静态 `depositResult` 只在 3 年期偶然自洽**；同口径比较区「大额存单 ¥534,500」隐含 2.30%，而 `pc/product-deposit` 的 `DCD` 挂牌利率是 **1.90%**，两页数字互相矛盾。
- **服务端现状（关键）**：服务端**已有**确定性存款计算 `deposit-interest-simple`（`ruleCatalog.executeRule()`，产出 `interest`、`maturity_amount`、`calculation_id`），但 `businessRulesService.executeDeterministic()` **没有任何调用方**——全仓检索只有定义；它既不是会话命令，也不是 HTTP 路由，因此页面只能自算。另注：`deposit-interest-simple` 对 `annual_rate` 按**小数**使用（`principal × annual_rate × years`），**按百分数传入会放大 100 倍**（实测 `{principal:500000, annual_rate:2.15, years:3}` → 利息 `3,225,000`）。接入时必须在服务端统一单位（2.15% 应传 `0.0215`）并加一条单位回归用例，否则会产出错误本息。
- **目标完成条件**：本金、期限、利率与提前支取规则由服务端计算（架构文档 §7.3「本金 × 年利率 × 年数」并展示公式、利率来源与时点），全部页面的同一产品利率只有一个真值来源。
- **成功**：给定 `(本金, 期限, 利率)` 可复算出页面本息；展示公式与 `source_timestamp`，并返回 `calculation_id`。
- **失败**：本金 ≤ 0 或单位非法 → `400 VALIDATION_ERROR` 并提示（现状前端已拦截，需改为服务端权威）。
- **空**：无该期限产品 → 「该期限暂无挂牌利率」，不套用默认 2.15%。
- **权威状态**：`products.annual_rate`（当前 `deposit`=2.15%）；计算复用 `deposit-interest-simple`，只需补一个可达入口（只读计算接口或会话命令）。
- **命令/接口**：`GET /api/demo-data`；计算入口二选一（只读接口 / 会话命令），在 PR 中说明（**属于契约变更，需与状态契约 owner 同步**）。
- **波次 2 校正（`cf07b1b`）**：上述「`executeDeterministic()` 全仓无调用方」**已过时**——PR#11 新增了只读入口 `BusinessRulesService.calculateDeposit({principal, annual_rate, years, rate_unit?, rule_version?})`，`rate_unit` 支持 `decimal`（默认，2.15% 传 `0.0215`）与 `percent`（传 `2.15`，服务端 ÷100），越界利率直接拒绝；成功返回 `status`、`rule_id`、`rule_version`、`calculation_id`、`rate_unit`、`inputs`、`result{interest, maturity_amount, formula}`。PR#12 已删除 `m-deposit-compare` 的浏览器自算，改为显式「需服务端权威结果」失败态。**剩余缺口**：该 service 尚无 HTTP 端点。
- **已推进 · 波次 3**：入口形态**已定为只读计算端点**（不新增会话命令、不改冻结集合），语义与单位口径登记于 `docs/api-contract.md`「只读计算与派生投影（W1 波次 3）」第 1 节；端点路径与参数拼写**以 contract PR 描述为准**。**本条目标整体未收工**：`pc/product-deposit` 仍用前端常量换算，`m/deposit` 与 `m-deposit-compare` 尚未改接端点，「同一产品利率唯一真值」与三态用例均待页面侧完成。
- **已推进 · 波次 3 · PR#17**：`pc/product-deposit` 的「测算工具」与 `m/deposit` 的「到期本息测算」已改读 `GET /api/calculations/deposit`（本金 500000、3 年、`rate_unit=percent`），展示服务端 `interest` / `maturity_amount` / `formula` / `calculation_id` 与数据时点；404/501 → 「服务端计算暂不可用」，其他非 2xx → 显示服务端错误码与消息，空态「该期限暂无挂牌利率」。**仍不达标**：① 真库下产品快照 `annual_rate` 为 pg `NUMERIC` 字符串（`"0.0215"`），页面不自行换算、原样交服务端判定，成功率未经真库验证（待波次 4 `backend` 归一化，见 §12.1）；② 本金与期限仍为页面固定测算输入（非用户可选），逐期限「该期限暂无挂牌利率」分支未实现；③ `tests/e2e` 无成功态用例。**本条目标整体未收工**。
- **验收用例**：`tests/unit`（利率/期限矩阵可复算 + 百分数单位回归——**已有**：#15 `tests/unit/deposit-calculation.test.js`）、`tests/e2e`（三档期限与两个页面的数值一致——**待补**）。
- **已推进 · 波次 4 · PR#18**：真库下 `products.annual_rate` 以 pg `NUMERIC` 字符串返回时，`GET /api/calculations/deposit` 已可解析（`BusinessRulesService.calculateDeposit()` 入口经 `parseNumber` 处理字符串，本 PR 只补入口契约注释；`null` / 空串 / 指数写法 → 400 `VALIDATION_ERROR`，小数口径误传百分数仍被 `rate_unit` 单位防御拒绝）。**服务端侧前提已具备，但仍不达标**：① 页面固定本金 500000 / 3 年、期限切换与逐期限「该期限暂无挂牌利率」空态未补；② 真库下页面成功态**未经页面用例确认**；③ `tests/e2e` 三档期限用例仍缺。**本条目标整体未收工。**
- **关联**：A08；R9。

### P-05 `pc/product-private`、`m/private`

- **当前演示态**：`pc/product-private` 整页是 `pageProductPrivateRestricted()`（一行受限提示 + 两个按钮），**根本没有产品内容挂载点**；`catalog.private`（`PE6`）虽已定义却未被任何路由使用。`m/private` 有受限提示 + 办理进度时间线 + `m-contact`（`patch({contactTodo:true})`，仅 `PATCH` 可选字段，非业务命令）。
- **资质状态现状**：`defaultSessionState()` 的 `qualified` 与 `acceptanceAdvanced` 已从 `SESSION_PATCH_FIELDS` 移除并归为只读（`CONTEXT.md` P0 #3），`qualified` 无写入方；`customer` 的 `authorized` 来自数据快照。**因此「合格投资者认定」目前没有任何服务端可写状态**——这是本页最硬的前置，必须先由状态契约 owner 决定承载方式。
- **目标完成条件**：未认定时展示受限说明且**不泄露**产品细节（现状已满足）；已认定时展示 `PE6` 的受限材料（产品事实来自服务端，不由前端硬编码）；认定状态来自服务端权威字段，「联系客户经理」写服务端可见记录。
- **成功**：认定状态 = 已认定 → 展示服务端产品事实 + `product_explain` 结果；办理指引/联系客户经理产生服务端记录（**该写入面仍滞后，见下条**）。
- **失败**：未认定访问受限材料 → 明确拒绝文案，不返回部分内容。
- **空**：无受限产品 → 「当前无受限产品」，不展示 `PE6` 占位。
- **权威状态**：需新增只读资格状态（建议由服务端快照派生，浏览器不可写）；`contactTodo` 应从 `PATCH` 归入 `record_activity` 或独立命令（**契约变更，需 owner 批准**）。
- **命令/接口**：`GET /api/demo-data`；资格状态接口与 `m-contact` 的承载方式待定。
- **验收用例**：`tests/e2e`（未认定/已认定两种身份各一条，验证前端不泄露）。
- **已推进 · 波次 3**：认定状态**已定为只读派生投影**（`qualifiedStatus`、`restrictedProducts`、`restrictedUnavailableReason`，语义见 `docs/api-contract.md` 同节第 3 节），派生自客户快照与 `products`，浏览器不可写，**不进 `defaultSessionState()`、不新增状态 key**；未认定时不返回任何受限产品细节。**仍滞后**：`m-contact`（`contactTodo`）从 `PATCH` 白名单迁到 `record_activity` 或独立命令属**写入面变更**，只读投影无法替代，须状态契约 owner 批准（§8.1 第 3 项），本波次不实现。**本条目标整体未收工**：页面尚未消费派生投影，认定/未认定两条 E2E 未补。
- **关联**：A10、A13、A31、A32；R9、R32（私行受限与风险揭示）。

### P-06 `pc/supply`

- **当前演示态**：`pageSupply()` 的 4 行「供给」与 4 个 `metric()`（今日资讯 286、已审核观点 1,248…）硬编码；`new-supply` 走 `record_activity`，结果页显示「待审核」等硬编码状态。
- **目标完成条件**：供给列表与计数来自服务端（或明确标注为演示常量并列入空态）；`new-supply` 结果页只显示服务端写入的 `activity_id/created_at/data_version`。
- **成功**：列表行数与计数可由服务端复算；结果页显示真实记录。
- **失败**：`record_activity` 失败（白名单外/上限 50）→ `action-error`，显示服务端错误。
- **空**：无供给 → 「暂无已审核供给」。
- **权威状态**：`activities[]`（服务端生成身份）；供给数据源待定。
- **命令/接口**：`record_activity`（`kind:'new-supply'`）。
- **验收用例**：`tests/unit`（`activities.test.js` 已有覆盖）、`tests/e2e`。
- **已推进 · 波次 4 · PR#21**：`pageSupply()` 删除 4 行硬编码供给与 `metric()` 计数，供给行改取 `GET /api/demo-data` 的产品行（产品主体研究单元），每行带 `product:<id>`、来源、数据时点与可售状态；「资讯 / 策略」视图无来源 → 「当前分类暂无已审核供给（共享应用服务没有该类供给的数据来源）」显式空态；`GET /api/demo-data` 失败 → 「供给目录加载失败」。**仍不达标**：① 资讯 / 策略 / 行业观点仍无服务端来源；② `new-supply` 结果页未在本波次回归（原 `record_activity` 路径不变）；③ 无 E2E 三态用例。**本条目标整体未收工。**
- **关联**：A02、A11、A13；R12、R38。

### P-07 `pc/events`、`pc/macro`、`pc/industry`

- **当前演示态**：`researchPage(type)` 三个页面渲染同一份静态列表，**没有任何 handler 与服务端取数**；它们与 `pc/research`（真实 `research_qa`）是不同的路由。
- **目标完成条件**：正文与结论来自服务端（知识片段/研究回答），并区分事实、机构观点与模型推断（架构文档 §4.1、§7.3）；至少一个真实操作（追问或引用打开）且有三态。
- **成功**：内容由 `/api/knowledge` 或 `research_qa` 结果驱动，标注数据时点。
- **失败**：`422`/`503` → 真实错误卡片。
- **空**：无相关片段 → 「暂无可引用材料」，不得展示默认观点。
- **权威状态**：`knowledge_chunks`（`events`/`macro`/`industry` 当前**没有专属片段**，见 §5.1）。
- **命令/接口**：`GET /api/knowledge`、`POST /api/ai/generate`（`research_qa`，知识必需）。
- **验收用例**：`tests/e2e`（三页各一条）+ `tests/integration`（`research_qa` 无片段时 422）。
- **关联**：A02、A09、A11、A20；R11、R52。

### P-08 `pc/library`

- **当前演示态**：`pageLibrary()` 的 5 行（A500/W180/安享长期医疗/安心定期3年/…）与 4 个 `metric()`（产品卡片 2,436、已审核观点 486…）硬编码。
- **目标完成条件**：卡片来源与 `/api/demo-data`、`/api/knowledge` 一致；版本与审核状态只能是服务端字段。
- **成功**：列表行与接口返回一一对应，显示 `knowledge_version`。
- **失败**：接口失败 → 「共享数据加载失败」（`sync-error` 语义），不显示静态行。
- **空**：无知识版本 → 「暂无已发布产品知识」。
- **权威状态**：`knowledge_versions`（ACTIVE）+ `knowledge_documents`/`knowledge_chunks`。
- **命令/接口**：`GET /api/knowledge`、`GET /api/demo-data`。
- **验收用例**：`tests/e2e`。
- **已推进 · 波次 4 · PR#21**：`pageLibrary()` 删除 5 行硬编码目录与 4 个 `metric()` 计数；卡片回指 `products[]`，知识版本、文档数、片段数与每产品片段/`document_id` 取自 `GET /api/knowledge` 的只读投影（`_knowledgeStatus` / `_knowledgeDocuments` / `_knowledgeChunks`）；`GET /api/demo-data` 失败 → 「共享数据加载失败」，无知识版本 → 「暂无已发布产品知识」。**仍不达标**：① 「观点资产」「审核状态」「更新日期」无服务端字段，已从表格移除但分类仍缺；② 无 E2E 三态用例。**本条目标整体未收工。**
- **关联**：A02、A20、A21；R12、R17。

### P-09 `pc/reader`

- **当前演示态**：`pageReader()` 的 5 个章节（含「第 19 页图表置信度 82%」「26 个关键观点、18 组数据」）全部硬编码，文档名为《中国权益市场月度策略》。而服务端知识文档是 **`doc-a500-quarterly`《A500 季报与风险说明》** 等 4 份，**`readerDocumentRef().documentId` 默认拿不到 `doc-*`**，因此「摘要」（`summary`）经常在浏览器侧被拦截为「缺少真实 document_id」，而不是真实 `report_summary`。
- **目标完成条件**：`pc/reader` 的正文与知识文档 `document_id` 绑定，`report_summary` 必然携带 `document_id` 与 `source_ids`；引用可回指页码（A20）。
- **成功**：摘要结果展示模型、时延与 `chunk_id`；章节正文与 `/api/knowledge` 的 `page` 字段一致。
- **失败**：`422`（片段不足）/`400`（缺 `document_id`）→ 真实错误文案，不显示硬编码摘要。
- **空**：无 ACTIVE 知识版本 → `503 DEPENDENCY_UNAVAILABLE` 并提示。
- **权威状态**：`knowledge_documents`、`knowledge_chunks`（`page`、`title`）。
- **命令/接口**：`GET /api/knowledge`、`POST /api/ai/generate`（`report_summary`，禁止只用 `source_ids` 补位）。
- **验收用例**：`tests/e2e`（摘要成功 + 缺文档失败）、`tests/integration`（`report_summary` 必须带 `document_id`）。
- **关联**：A20、A34；R17、R53（扫描件 OCR 未装配，不得示意已支持）。

### P-10 `pc/writing`

- **当前演示态**：`pageWriting()` 的三类写作品类（定时写作/结构化一页纸/深度研究）与 QC 徽章（「数据 18/18」「事实 26/28」）硬编码；`new-writing` 真实调用 `writing_draft`，但草稿只在结果页显示，回页后消失。
- **目标完成条件**：草稿写入服务端会话并可回看（A11）；QC 徽章要么由服务端生成，要么删除。
- **成功**：新草稿有服务端版本与刷新可恢复；`writing_draft` 引用限定于所选材料（`source_ids`）。
- **失败**：`422`（无材料）→ 真实错误。
- **空**：无已选材料 → 「请先选择材料」，不生成。
- **权威状态**：`researchAnswer`/草稿投影（当前 AI 结果投影在前端写回，`PATCH` 白名单）。
- **命令/接口**：`new-writing`（`writing_draft`）、`record_activity`（`templates`、`review-writing`）。
- **验收用例**：`tests/e2e`（生成→刷新→回看）。
- **关联**：A11、A20；R54（成稿质量由行方判定）。

### P-11 `pc/result`、`m/result`（共用 `landingSpec`）

- **当前演示态**：`landingSpec()` 是 53 条映射的大表。其中 `onepager`、`summary`、`new-writing`、`m-send`、`ask` 已读取真实 `aiResult`；但 `workspace`、`subscribe`、`templates`、`extract`、`review-writing`、`filter-panel`、`task-center` **仍是硬编码事实行**，且文案含「演示会话仅存内存」等与真实状态不符的描述。
- **目标完成条件**：结果页只显示服务端写入的状态；无写入方的条目**统一落到 `not-implemented`**（A11、A13）。
- **成功**：结果页展示服务端记录（`activity_id/created_at/data_version`）或 `aiResult`。
- **失败**：`action-error` 显示服务端错误码；重复点击同一 `request_id` 不生成重复结果（A11）。
- **空**：`workspace` 类条目显示「尚未写入服务端记录」。
- **权威状态**：`activities[]`、`session.landing`（`PATCH` 白名单）。
- **命令/接口**：`record_activity`（14 类 `kind`，上限 50）。
- **验收用例**：`tests/unit`（`activities.test.js`）、`tests/e2e`（`work-items.spec.js` 未知操作落到 `not-implemented`）。
- **关联**：A11、A13、A18；R15、R55。

### P-12 `m/fund`

- **当前演示态**：4 条基金硬编码；其中 **A500 映射 `product:'fund'`**，另有 3 条（`华安稳健增利 12 个月`→`bondfund`、`沪深300ETF 联接`→`fund`、`均衡配置混合`→`fund`）直接传 `data-product` 给 `m-diagnose`/`m-product-detail`/`m-save`。
- **代码事实（重要）**：`m-diagnose` 以 `product_ids:[id]` 调用 `diagnosis_explain`；`scopeTaskFacts()` 要求 **该产品存在且当前客户持有该产品**，否则 `422 INSUFFICIENT_EVIDENCE`。`bondfund`/`cash`/`wealthplus` 均无持仓。但 `m/save`（加入比较）**不校验产品是否存在**，因此 `bondfund` 会被写入 `compareSet`，随后在比较页被 `realProductIds()` 静默过滤——**链路上会「加入成功」却在比较页消失**。
- **目标完成条件**：列表与产品事实来自服务端；不可诊断的产品要么标「无持仓不可诊断」，要么按钮置为不可用并给出说明；加入比较必须校验 `product_id` 存在。
- **成功**：可诊断产品（现为 `fund`）展示真实诊断；列表数字与 `/api/demo-data` 一致。
- **失败**：无持仓 → 页面显示「当前客户无该产品持仓，无法生成诊断」（对应 `422`），不再走 `ai-error` 通用页。
- **空**：分类下无产品 → 「该分类暂无产品」。
- **权威状态**：`products` + `holdings`；`compareSet`（≤3、服务端校验存在）。
- **命令/接口**：`GET /api/demo-data`、`POST /api/ai/generate`（`diagnosis_explain`）、`PATCH`（`compareSet`）。
- **验收用例**：`tests/e2e`（可诊断 + 不可诊断 + 加入比较校验）。
- **已推进 · 波次 4 · PR#20**：`m-diagnose` 删除 `const id = productId || 'fund'` 的静默改诊——缺 `product_id` 或服务端快照中不存在该 id 时显示显式空态「无法生成诊断」，**不改用其它产品代替**。**仍不达标**：① 列表仍是前端 4 条硬编码，未改接 `GET /api/demo-data`；② `422 INSUFFICIENT_EVIDENCE` → 「当前客户无该产品持仓，无法生成诊断」文案**未实现**——`runRealAiTask`（`public/app.js`）自行 `catch` 并 `openLanding('ai-error')`，属 `frontend-lead` owner 范围，需把真实错误码下推给页面；③ `diagnosis_explain` 证据包路径在真库下**未**做 `NUMERIC` 归一（#18 只覆盖只读计算入口），真库成功态未验证。**本条目标整体未收工。**
- **关联**：A08、A10、A19；R10、R46。

### P-13 `m/insurance`

- **当前演示态**：整页硬编码（覆盖度 72%、保障缺口、2 张待办保单）；`m-coverage`/`m-policy` 两个动作（在 `diagnosis.js` 注册）**只打开同一个固定弹窗「安享长期医疗 ¥4,000,000」**，与点击的保单无关。
- **目标完成条件**：保单、保障缺口与待办来自服务端；`m-coverage`/`m-policy` 展示**被点击保单**的真实事实；保险不替代核保与理赔（A13、R32）。
- **成功**：点击不同保单 → 弹窗内容不同且与服务端一致。
- **失败**：无授权保单 → 「未授权或暂无可展示保单」。
- **空**：无保障缺口 → 「暂未发现缺口」。
- **权威状态**：需新增保单服务端来源（当前 `products` 中 `insurance` 仅产品事实，无保单/覆盖度）。
- **命令/接口**：`GET /api/demo-data`；保单接口待定（**需数据 owner 确认，不得前端伪造**）。
- **验收用例**：`tests/e2e`（两张保单内容不同 + 空态）。
- **已推进 · 波次 4 · PR#20**：`m-coverage` / `m-policy`（`public/actions/diagnosis.js`）不再对任何点击打开同一固定弹窗，改为取被点击元素的 `data-product`，从共享会话（`GET /api/demo-data` 产品快照）读取该保险产品的 `coverage` / `annual_premium` / `sale_status` / `source_id` / `source_timestamp`，逐产品渲染「保险产品事实」（明确**不是保单记录**）；缺 id / 快照中无该产品 / 非保险产品 / 适配层不可用 → 一律空态「未授权或暂无可展示保单」，不套用默认额度或保费；pg `NUMERIC` 字符串按文本原样展示，浏览器不做换算。**仍不达标**：① 列表页「我的保障」覆盖度/缺口与待办仍无服务端计算来源（`mobileInsurance()` 显示「暂未发现缺口」空态）；② 无保单数据源 → 「两张保单内容不同且与服务端一致」在 `data` 提供保单表前**无法真实达成**；③ `m-policy` 已注册在 `public/actions/diagnosis.js` 并与 `m-coverage` 共用同一分支，但 `public/app.js` 内**没有任何元素带 `data-action="m-policy"`**，该动作在页面上不可达，用例仍缺；④ 无 E2E 用例。**本条目标整体未收工。**
- **已推进 · 波次 3**：保单/缺口**已定为只读派生投影**（语义见 `docs/api-contract.md` 同节第 4 节），只输出产品事实可确定的字段（`product_id`、名称、`coverage_type`、`coverage_amount`、`annual_premium`、`sale_status`、`data_id`、`data_as_of`），**绝不伪造**保单号、生效日期、理赔进度；无来源时 `policies=[]` + `unavailable_reason`，**不改冻结集合、不新增命令**。**本条目标整体未收工**：无真实保单来源，页面仍硬编码 72% 与固定弹窗；「两张保单内容不同」的用例在无数据源前**无法真实达成**，只补空态用例不得算收工。
- **关联**：A08、A10、A13；R9。

### P-14 `m/wealth`

- **当前演示态**：`wealthCard()` 读取真实 `productOf(id)`（`wealth`/`wealthplus`/`cash`），产品事实是真的；但「我行可售」徽章硬编码，不做 `sale_status` 校验。
- **目标完成条件**：可售状态取自 `sale_status`；解释走真实 `product_explain`；`cash` 无知识片段时明确不展示知识引用（§5.1）。
- **成功**：徽章与 `sale_status` 一致；加入比较成功。
- **失败**：`product_explain` 失败 → 真实错误。
- **空**：筛选下无产品 → 「当前视图暂无产品」。
- **权威状态**：`products.sale_status`。
- **命令/接口**：`GET /api/demo-data`、`product_explain`。
- **验收用例**：`tests/e2e`。
- **已推进 · 波次 4 · PR#21**：`wealthCard()` 的徽章改由 `saleStatusOf()` 只读服务端 `sale_status`——`ON_SALE` → 「我行可售」，其他取值 → 「暂不可售 + 原值」，字段缺失 → 「可售状态未提供」，**不再无条件显示可售**；列表与分类计数改取 `serverProductRows('理财')`，空分类显示「当前视图暂无产品」并说明服务端只返回几只，不补默认产品；无 `latest_return` 时显示「近一年收益未提供」。**仍不达标**：① `wealth` / `cash` 无知识片段的边界仍未在页面上显式说明（§5.1 要求「本次无知识片段引用」）；② 无 E2E 三态用例。**本条目标整体未收工。**
- **关联**：A02、A10；R9、R43。

### P-15 `m/holdings`

- **当前演示态（基线 `cf07b1b`）**：总资产来自服务端（168,420+250,000+300,000 = **¥718,420**，占比 23.44%/34.80%/41.76%）；但「持有收益 +¥42,860.18 / +5.40%」与「单只宽基基金占权益资产 68%」**均为硬编码**（`9411ead` 已由 #17 移除，见文末「已推进 · 波次 3 · PR#17」），无法由当前持仓复算（3 笔持仓的 `return_rate` 也无法得出 5.40%）。`extra` 一行「安享长期医疗 年缴 ¥3,280」是保险保费，与持仓金额混算。
- **目标完成条件**：持有收益、收益贡献与集中度由服务端确定性计算（§7.3），并给出 `calculation_id`；保险保费不进入金额合计。
- **成功**：给定持仓可复算合计、占比、集中度；展示计算 ID。
- **失败**：持仓为空 → 「暂无持仓」（不得显示 0 元且声称已诊断）。
- **空**：同上。
- **权威状态**：`holdings`；应复用服务端已有的 `portfolioCalculation()`（`aiOrchestrator.js`，产出 `calculation_id`、`total_amount`、`weights`、`max_concentration`）。
- **命令/接口**：`GET /api/demo-data`；收益/集中度需新增只读计算接口或会话字段（**契约变更**）。
- **代码事实（供实现方参考）**：服务端 `portfolioCalculation()` 给出的 `max_concentration` 是**跨产品**最大权重，按当前持仓为 `41.76%`；页面文案「单只宽基基金占权益资产 68%」是**权益内部占比**口径，两者不可混用。实现时必须明确分母（全资产 or 权益资产）并与页面文案一致。**基线校正（`d0b7620`，PR#9）**：`finalizeEvidence()` 已把 `portfolio_calculation` 嵌入 `structured_facts.holdings[]`，并在顶层 `calculations` 中保留同一 `calculation_id`；因此 P-15 不再需要「新增只读计算入口」来取数——**剩余工作是把页面读数改接到该事实**。若服务端需直接给出页面字段（而非经 AI 任务产出），仍需走 §8 第 5 行审批。
- **验收用例**：`tests/unit`（复算）、`tests/e2e`。
- **关联**：A08、A10；R10、R46。
- **已推进 · 波次 3**：取数入口**已定为只读计算投影**（`PortfolioService.calculate()` 的 `calculation_id`、`total_amount`、`weights`、`max_concentration` + `max_concentration_basis`、`equity.*`、`holding_return`，语义见 `docs/api-contract.md` 同节第 2 节）；**不落会话字段、不改冻结集合**。口径红线：顶层 `max_concentration` 恒为 `basis=all_assets`（当前 41.76%），「单只宽基基金占权益资产 68%」只能读 `equity.max_concentration`（`basis=equity_assets`），两者不得互换；`holding_return.level="estimated"`，页面须标「估算」，不得回填 `+42,860.18 / 5.40%`；`unauthorized` / `no_holdings` 返回 `available=false`，页面显示「暂无持仓」而非 0 元。**本条目标整体未收工**：`m/holdings` 尚未消费该投影，复算用例与空态用例未补。
- **已推进 · 波次 3 · PR#17**：`m/holdings` 已消费 `GET /api/calculations/portfolio`——持有收益按 `holding_return`（`level=estimated`，页面标「估算」）展示、`positions[].contribution_to_total_return` 逐笔给出、`max_concentration`（`basis=all_assets`）与 `equity.max_concentration`（`basis=equity_assets`）分别标注不可混用、展示 `calculation_id`；`available=false` 时显示「暂无持仓 / 未授权查看持仓计算」，不显示 0 元；保费不进入任何金额合计。**仍不达标**：① ~~真库下 `holdings.amount` / `return_rate` 为 pg `NUMERIC` 字符串，端点返回 422 `INSUFFICIENT_EVIDENCE`~~（**已撤回 · 波次 4 · PR#18**：`PortfolioService.calculate()` 入口归一后真库可返回成功态；但真库下页面成功态仍未经页面用例确认）；② 复算用例与空态用例未补（#15 只覆盖 service 层，端到端成功态仍缺）。

### P-16 `m/candidates`

- **当前演示态**：候选 ID 来自 `session.candidates`（真实 `generate_candidates`）；但「适配你的资金期限」为固定文案，理由未区分具体约束；`p.match` 来自产品字段而非服务端排序结果。
- **目标完成条件**：理由与排序同源于 `candidateCalculation`（A06「理由与当前输入一致」）。
- **成功**：每条候选的排序值/理由取自 `candidateCalculation`。
- **失败**：`candidate_explain` 失败（`422`，候选缺失或计算不一致）→ 真实错误。
- **空**：候选为空是**可达**的（`m/allocation` 无方案时直接进入 `m/candidates`），必须显示引导空态；但「已生成方案却没有符合条件的产品」在 fixture 下不会出现（默认目标下 7 个产品全部合格），**该项空态不得用真实场景宣称已验证**，只能作为防御性显示。
- **权威状态**：`candidates`、`candidateCalculation`（仅由 `generate_candidates` 写入）。
- **命令/接口**：`generate_candidates`、`POST /api/ai/generate`（`candidate_explain`）。
- **验收用例**：`tests/integration`（`candidateCalculation` 与候选一致）、`tests/e2e`（空态）。
- **已推进 · 波次 4 · PR#21**：`mobileCandidates()` 删除固定文案「适配你的资金期限」；每条候选展示 `candidateCalculation.reasons[].constraints`（`customer_risk` / `goal_risk` / `goal_term` / `goal_liquidity` / `sale_status`）与 `holding_months`，列表顺序按 `reasons[]`（服务端排序）呈现并标注「第 N 条（风险档由低到高、同档按 product_id）」；无 `candidateCalculation` 时显示「服务端尚未返回 candidateCalculation」，不展示固定口径理由；`p.match`（恒为 `—`）不再用于渲染，收益只在 `latest_return` 有值时才显示。**仍不达标**：① 排序以 `reasons[]` 顺序呈现，仍无独立可复算的 `score` 字段（服务端 `candidateCalculation` 未提供）；② 无 E2E 空态/成功态用例。**本条目标整体未收工。**
- **关联**：A06、A19；R48。

### P-17 `m/companion`

- **当前演示态（基线 `cf07b1b`）**：`+0.86%`、目标完成度 `68%`、「组合风险仍在 R3」硬编码（`9411ead` 已由 #17 移除，见文末「已推进 · 波次 3 · PR#17」）；`m-remind`（`create_reminder`）与 `m-submit-care`（`submit_care`）已是真实命令；`m-event` 是固定文本弹窗。
- **目标完成条件**：复盘数字来自服务端；服务建议**结束于待客户经理确认**（A10/A50）；`m-event` 内容来自知识片段。
- **成功**：复盘收益/目标完成度可复算；提交后状态为 `WAITING_FOR_MANAGER`。
- **失败**：`submit_care` 在未保存比较时 → `409`「请先保存有效产品比较」。
- **空**：无关联方案 → 「尚未关联配置方案」。
- **权威状态**：`careSubmitted`、`remindCreated`、`plan`、`compareSaved`。
- **命令/接口**：`create_reminder`、`submit_care`。
- **已推进 · 波次 3 · PR#17**：`+0.86%`、`68%` 等硬编码已移除，复盘数字改读 `GET /api/calculations/portfolio` 并显式标注「演示数据 · AI_MODE=fixture」；风险等级改取会话目标（`s.risk` / `s.goal.risk`，取不到显示 `—`）。**仍不达标**：① ~~真库下端点 422，复盘块只能显示失败态~~（**已撤回 · 波次 4 · PR#18**：服务端入口归一后真库可成功；页面成功态仍未经页面用例确认）；② 服务端未产出「目标完成度」字段，页面也不得补算；③ `m-event` 仍为固定文本；④ `tests/e2e` 未补成功/失败/空三态用例。
- **验收用例**：`tests/e2e`（提交前/后的状态 + `409` 路径；复盘数字成功/失败/空三态——**待补**）。
- **关联**：A08、A10、A11；R50。

## 4. H 类：部分真实（6 组，13 页）

| 条目 | 路由 | 已真实 | 剩余缺口 | 完成条件 | 命令/接口 | 验收用例 | 关联 |
|---|---|---|---|---|---|---|---|
| H-01 | `pc/workspace` | `researchAnswer` 卡片来自 `research_qa` | 最近使用/推荐任务硬编码；`research-plan` 为 `record_activity` 记录，却显示「已拆解 3 步」 | 待办与计划状态为服务端事实或改为空态 | `record_activity`(`research-plan`) | `tests/e2e` | A03、A11、A19 |
| H-02 | `pc/candidates` | 列表与排序读 `session.candidates`；**PR#9** 起候选的资格判定、理由（`reason`/`constraints`/`holding_months`）与确定性排序由 `candidateCalculation` 给出 | **无候选时渲染空表头**（`pageCompare` 有空态，候选页没有，只有表体缺省行）；`match` 已恒为 `—`，页面仍按 `p.match` 渲染「适配度」列；`score` 无服务端字段，排序值取不到 `candidateCalculation` | 无候选 → 引导空态；排序值与理由展示取 `candidateCalculation`（前端消费归 #16） | `generate_candidates` | `tests/e2e`（空态） | A06、A11 |
| H-03 | `pc/compare`、`m/compare` | 比较集、`compare-needed`、`save_comparison` 校验 2–3 个真实产品；**PR#9** 起服务端产出 `comparison_basis`、`comparable`、`incomparable_reason`、`missing_product_ids` | 前端**未消费**上述口径：`m/compare` 固定文案「历史收益更高的产品，回撤和波动通常也更高」仍为**未经计算的结论**；口径切换仍只改行标签，未按 `comparable=false` 显示「不可排名」 | 结论必须可由当前数据复算（或直接使用 `incomparable_reason`），否则删除；口径差异需明示不可排名（A07） | `save_comparison`、`PATCH`(`compareSet`) | `tests/unit`（`save_comparison` 2/3 个边界）、`tests/e2e` | A07 |
| H-04 | `pc/research` | `research_qa` 真实，`ask`/`quick-prompt` 已接，错误走 `ai-error` | 同一问题重复提问无「已存在结果」提示；超范围问题无专门兜底文案 | 重复请求幂等可见（`request_id`）；超范围 → 明确拒答而非通用错误（A14b） | `research_qa`（知识必需） | `tests/integration`（同 `request_id` 幂等）、`tests/e2e` | A09、A18、A57 |
| H-05 | `m/assistant` | `assistant_qa` 真实，`m-quick`/`m-send` 已接 | 「2 条持仓提醒」硬编码；多轮追问只在 `lastAnswer` 单槽 | 多轮保留上下文且不串档；「澄清」场景可见（A14b） | `assistant_qa`；多轮需服务端会话字段 | `tests/e2e`（两轮追问） | A03、A14b、A57 |
| H-06 | `m/allocation` | `auth-needed` 已接；`generate_allocation` → `generate_candidates` 由服务端校验并写入。**基线校正（`d0b7620`，撤回原误判）**：规则匹配在 fixture 下**不会必然失败**——`fixtureModelClient.pickAllocationRule()` 自基线 `2d9ad15` 起即返回有效规则（默认目标 → `allocation-balanced-r3`，R1/R2 风险 → `allocation-liquid-r2`），输出带 `rule_id` 与 `rule_version`；`unselectedRuleResult()` 只在 `!output.rule_id` 分支触发，**不是主路径**。`generate_allocation` 的 `find(null, null)` → `UNSUPPORTED_RULE` 也因此不可达。`tests/e2e/helpers.js` 的 `ensureAuthorization()` 真实点击 `m-generate-allocation` 并等待「配置方案与候选已生成」，`mobile-flow.spec.js` 断言 `plan` 非空且 `candidates >= 2`；参数化后共 15 次运行（9 用例 × 2 工程）通过，候选/比较/陪伴链路在 UI 中**可达** | 仍存在的真实缺口：① `UNSUPPORTED_RULE` 与 `NEED_CONFIRMATION` **共用**结果页 `rule-confirmation`（标题「需要确认配置条件」），`UNSUPPORTED_RULE` 落在文案错位页；② `NEED_CONFIRMATION` 仅由「目标缺字段」或置信度 < 0.65 产生，而表单恒有默认值、fixture 置信度为 0.99，故该状态**不可达**；③ 现有 E2E **没有**规则不匹配失败态用例（`rule-confirmation` 路径无覆盖） | ① `UNSUPPORTED_RULE` 有独立结果页且不覆盖旧方案（A24，`d0b7620` 已在 `generate_allocation` 非 MATCHED 时返回 `patch: {}`，服务端不覆盖旧方案已成立，缺的是**页面区分**）；② 缺字段 → `rule-confirmation` 可达且文案准确；③ 补一条规则不匹配失败态用例 | `rule_match` → `generate_allocation` → `generate_candidates` | `tests/unit`（两条规则 MATCHED 与三类状态）、`tests/e2e`（默认目标生成方案 **已达**；规则不匹配失败态**待补**） | A04、A05、A24 |

> H-06 收工口径：原缺口 ①「fixture 返回合法 `rule_id`」**已成立、无需 PR**（本波次校正登记，不计入待办）；原「方案永不生成 / 全链路不可达」结论**作废**，不得再作为阻塞项或验收失败依据引用。

**波次 5 代码事实复核（基线 `5bcb1cc`，仅登记，不改本表原结论）**

| 条目 | 复核结论（代码事实） | 证据（文件:函数/行） |
|---|---|---|
| H-02 `pc/candidates` | 无候选时仍是**表体缺省行**（`empty` 变量拼在 `<tbody>` 内），未变成专用引导空态；「适配度」列仍渲染 `p.match`（恒 `—`）；排序仍按 `parseFloat(p.match)` / `parseFloat(p.ret)`，**未消费 `candidateCalculation`**。候选页「生成候选池 / 同步林女士方案」两个按钮的 `generate-candidates` handler 已注册（`if(!session().plan) openLanding('allocation-needed')`），链路可达；无方案时落 `allocation-needed` 结果页，而不是本页引导空态。 | `public/app.js:746` `pageCandidates()`（`empty` 于 761 行、排序于 751–756 行）；`public/actions/research.js:20` |
| H-03 `pc/compare`、`m/compare` | 原「『历史收益更高的产品，回撤和波动通常也更高』固定文案」在 `5bcb1cc` 上**已不在代码中**（`mobileCompare()` 的 callout 已改为「表格只列出服务端产品事实，不同口径不可直接排名」）；但**前端仍未消费 `comparable` / `incomparable_reason`**，口径切换仍只改行标签，`comparison_basis` 未渲染。**原表述「固定文案仍在」按此撤回（仅该句），条目其余缺口不变。** | `public/app.js:765` `pageCompare()`、`public/app.js:1154` `mobileCompare()`；`comparable` 与 `incomparable_reason` 在 `public/app.js` **无命中** |
| H-04 `pc/research` | `runRealAiTask()` 每次生成新 `requestId`（`window.WealthApi.createRequestId()`），结果页 `landingSpec` 以 `L.requestId` 显示「同一 request_id 的重复提交不会生成重复结果」，但**没有「该问题已有结果」的重复提问提示**，也没有超范围问题的专门拒答文案（仍走通用 `ai-error`）。 | `public/app.js:1304–1346` `runRealAiTask()`；`public/app.js:951` request_id 提示条 |
| H-05 `m/assistant` | 多轮上下文仍只有 `lastAnswer` 单槽（`patch({lastQuestion, lastAnswer})`），无会话级上下文；澄清机制未见入口。 | `public/actions/flow.js` `m-quick` / `m-send` 分支（`patch({lastQuestion:q,lastAnswer:{...}})`） |
| H-06 `m/allocation` | 原三项缺口（`UNSUPPORTED_RULE` 独立结果页、`NEED_CONFIRMATION` 可达性、规则不匹配失败态用例）在 `5bcb1cc` 上**均未变化**；`landingSpec` 中 `rule-confirmation` 仍为两类状态共用键。 | `public/app.js` `landingSpec` 的 `rule-confirmation` 条目；`tests/e2e` 9 用例无 `rule-confirmation` 路径 |

## 5. 明确标注项

### 5.1 fixture 知识库只有四个片段：`wealth` / `bondfund` / `cash` 的「证据不足」是【预期可见失败态】

**事实（代码）**：`fixtures/demoData.js` 与 `db/seeds/001_demo.sql` 的 `knowledge_chunks` 只有 4 条，`product_id` 分别为 `fund`、`wealthplus`、`insurance`、`deposit`。但 `products` 有 7 个 id：`wealth`、`fund`、`deposit`、`insurance`、`bondfund`、`wealthplus`、`cash`。`knowledgeRepository.search()` 的 `product_id = ANY(...)` 过滤为**无条件生效**。

**按任务类型分开结论**（两种结论都写进了验收口径，不得混为一谈）：

| 任务类型 | 知识要求 | `wealth` / `bondfund` / `cash` 上的实际结果 | 判定 |
|---|---|---|---|
| `research_qa`、`report_summary`、`writing_draft` | `KNOWLEDGE_REQUIRED` | 召不到片段 → `422 INSUFFICIENT_EVIDENCE`「当前任务没有足够的知识片段，已停止生成」 | **预期可见失败态**，不得视为流程断裂 |
| `assistant_qa`、`diagnosis_explain`、`candidate_explain`、`product_explain` | `KNOWLEDGE_OPTIONAL` | 知识不足被吞掉（`chunks=[]`）；只要结构化事实足够就正常生成，引用只能是 `product:<id>` / `holding:<id>` | **不报错**；但也**不会**因缺片段给出「证据不足」 |

因此，对 `wealth`/`bondfund`/`cash` 的**解释类任务**（`product_explain`、`candidate_explain`）：

1. **不得**以「缺知识片段所以必然 `422`」为验收标准；
2. 若实现方要求「必须引用知识片段」，则会得到 `400 VALIDATION_ERROR`（「内容生成必须至少包含一个有效引用」/引用白名单），这属于**实现选择造成的失败态**，不是 fixture 事实；
3. 正确口径是：**结构化事实已经足够，结果可生成，但引用中不含知识片段**；页面必须如实展示「本次无知识片段引用」，并保留 `execution_mode: "fixture"` 标注；
4. `candidate_explain` 另有更强的前置：必须有完整 `candidateCalculation` 且与当前候选一致，否则 `422`——这与知识片段无关，不得混为同一失败原因。

**影响页面**：P-03（`pc/product-wealth` 的 `W180`→`wealth`、`WCASH`→`cash`）、P-12（`bondfund`）、P-14（`m/wealth` 的 `cash`/`wealth` 卡）、H-02/H-03（候选与比较）、P-16。

**验收要求**：
- `wealth`/`bondfund`/`cash` 的**解释类**任务：成功态必须显示「无知识片段引用（仅结构化事实）」，且不得显示伪造的 `chunk_id`；
- `wealth`/`bondfund`/`cash` 作为**研究/摘要/写作**的问题源：必须触发 `422` 并显示「证据不足」页面，E2E 需一条用例断言 `error.code === 'INSUFFICIENT_EVIDENCE'`；
- 本项**不得**通过「给这三个产品补片段」来掩盖——补片段属于 W2 知识加工范围，且需另立 PR。

### 5.2 12 个已退出运行前端的路由：能力整体延后，不属于 W1 并行研发范围

`pc/delivery`、`pc/model-delivery`、`pc/rollout`、`pc/acceptance`、`pc/models`、`pc/orchestration`、`pc/standards`、`pc/integration`、`pc/select-fund`、`pc/select-wealth`、`pc/select-insurance`、`pc/sources` 已删除菜单、路由分发与跨页入口（`tests/unit/frontend-menu.test.js` 断言其字符串不出现在前端源码中）。

- **不实现、不建入口、不写脚本、不纳入 W1 验收用例**；
- 对应能力**整体延后**到 W2（预发布集成流水线、行方交付物评审、真实模型评测、受控脚本与设计文档评审、数据包导入），按 `CONTEXT.md` 的能力域表执行；
- 运行路由**仍为 30 个**，不得因 A–G 列存在对应指标而补建（架构文档 0.2 / 2.2）；
- `public/requirements.js` 中 F22–F33 仍登记这 12 个路由但在需求清单里显示「无独立运行页面」（`hasRuntimePage()` 判定），属预期，不得改为可跳转。

### 5.3 明确不属于本清单（后置或非 W1 界面）

| 类别 | 内容 | 承载与判定 |
|---|---|---|
| E 类 | 70 QPS、24 小时连续运行、多集群、四类任务各 5 次、各专业评测集评分 | 行内等价环境与统一评测集；DEMO 只记录真实 `latency_ms` 与运行日志，**不作达标结论** |
| D 类 | 承诺书、商务资质、行内集成适配、信创、专利与授权 | 书面材料；**不建模拟页面** |
| C 类 | 导入、知识加工、部署、文档 | `scripts/`、`docs/`、`db/`、交付物评审 |
| 非 W1 能力 | 扫描件 OCR（未装配）、真实交易/投保/理赔、通用互联网搜索 | 架构文档 2.2 明确不建设，**不得在页面上示意已支持** |

## 6. 不得违反的红线（Worker 领取时必须自查）

1. 不新增 0.2 白名单之外的运行页面或入口（运行路由恒为 30 个）；
2. 不改写或裁剪 A–G 列任何指标，不新增指标；
3. 不把 C/D/E 类指标写成「已由 W1 fixture 判定」；
4. 不把 fixture 结果表述为真实模型或生产验收结论；
5. 不改 `CONTEXT.md` 的「受限/静态页面定性」、`docs/pr-merge-gate-ci.md` §10.1 演练记录与 §11.1 前置就绪说明；
6. 不提交只读的 xlsx 与任何 `.docx`/`.xlsx`/`.xls`；不使用 `git add -A` / `git add .`；
7. 不改 CI/workflow/分支保护/required check/所有权规则；不加任何 PR label（尤其 `baseline`）；不 force push；不手动 Re-run；不自行合并。

## 7. 逐条修正项（以架构文档第 11 章 A01–A35 为验收标准，仅供登记，不在本 PR 实现）

| A 项 | 现状（代码事实） | 修正后应满足 | 归属测试 |
|---|---|---|---|
| A04 授权拦截 | 未授权时 `auth-needed`；`assertAuthorized()` 拒绝方案/候选/比较/陪伴命令；~~取消授权命令已存在但页面无入口~~（**波次 5 · PR#24 已收口**：`public/actions-registry.js` 新增 `m-revoke-auth`，点击调用 `set_authorization(authorized:false)` 并要求服务端返回 `APPLIED` + `authorized=false` 才显示成功；未新增命令、未改 PATCH 白名单）。**仍缺**：撤销后 `downstreamReset()` 逐 key 的独立 E2E 断言（现有 `mobile-flow.spec.js` 只断言 `plan` / `candidates` / `compareSaved`，未逐步断言 11 个 key，也未断言 `writingDrafts`——后者属变更 C-02） | 页面上可见「撤销授权」并验证下游 `downstreamReset()` | `tests/integration` |
| A09 问答边界 | `research_qa` 无片段 → `422`（已有 E2E）；`assistant_qa` 结构化事实不足才 `422` | `pc/events`/`macro`/`industry` 与 `m/assistant` 分别验证 | `tests/e2e` |
| A10 分支闭环 | 保险、私行、持仓收益仍为静态（**波次 4 更新**：保险动作与持仓收益已改接服务端，#20/#17；私行 P-05 仍整页受限、未消费 `qualified_status` 派生投影） | P-05、P-13、P-15 收工后闭环 | `tests/e2e` |
| A13 真实表达 | ~~存在硬编码 KPI 与「99.98%」「94.6%」~~（**波次 5 复核**：`pageArchitecture()` 已改为只读 `GET /api/health` 的 `dependencies.*` 与 `api_version`/`frontend_contract_version`，无来源的调用量/评测通过率不展示；#21 进一步清除了 P-02 / P-03 / P-06 / P-08 / P-14 / P-16 的产品与计数硬编码。`99.98` / `94.6` 在 `public/app.js` 已无命中；**PR#25 已补**成功态下「页面不含 `99.98%` / `18,426` / `94.6%`」的独立断言；**仍缺**失败态（`/api/health` 不可达）与空态（无待处理事项）断言，且 `/ready` 的 7 项 checks 前端仍未消费） | 由 P-01 清除 | `tests/e2e` |
| A18 请求一致性 | `runRealAiTask()` 用 `activeAiRequestToken` 丢弃旧响应；**PR#9** 在规则执行前复核会话版本 | 现有机制需一条显式用例 | `tests/e2e` |
| A20 知识引用可回指 | ~~页面仅显示 `chunk_id`，**未显示标题与页码**~~（**波次 5 · PR#24 已收口页面侧**：研究问答、摘要、写作结果卡片的引用改为 `chunk_id` + 标题 + 页码，由 `GET /api/knowledge` 的文档/片段投影驱动；`pageReader()` 与 `pageLibrary()` 原有页码/文档回指保留）。**仍缺**：一条断言「引用卡片同时含标题与页码」的 E2E；`chunk_id` 缺失时页面须显式「无知识片段引用」而非空标签——该空态尚未有独立断言 | 引用展示 `title` + `page`（`/api/knowledge` 自 PR#6 起文档条目显式带 `title`，`chunk_id` 可回指） | `tests/e2e` |
| A34 服务开放 | `/api/demo-data` **不带 `session_id` 时在 `DATA_MODE=database` 直接 400** | 外部调用者需先建会话再传 `session_id`；验收用例必须体现该前置 | `tests/unit`（不含 DB 的接口契约用例） |
| A35 真实时延 | `ai_requests` 记录 `latency_ms`、`model`（已存在）；页面展示时延 | 保持 | `tests/integration` |

> 说明：A14「八类 AI 任务均产生可验证的真实模型调用」在 W1 的 `AI_MODE=fixture` 下只能证明「八类任务均产生可验证的（fixture）调用与真实证据链」，模型名恒为 `fixture-generate-1`；真实模型调用按 E 类/后续波次判定，**本清单不宣称 A14 已满足**。

## 8. 待批准规格（状态契约变更登记 · 供波次 3 集中处理）

> **本节是唯一入口**：下列 8 项任一落地都属于契约变更。**任一项落地需状态契约 owner 批准，并同步 `docs/api-contract.md`「共享会话状态契约（W1 冻结）」与 `tests/unit/session-contract.test.js` 的 36 key / 19 PATCH 字段 / 7 命令 / 11 `downstreamReset` 集合断言**。未获批准前，Worker 不得先行改动冻结集合，也不得在前端构造对应状态。
>
> **2026-11-06 修订 + 2026-11-08 再修订（用户已批准）**：原「同一 PR 内同时改文档、代码与测试断言」与 `ci-ownership` 的单 Agent 目录约束冲突。**对原子契约变更（C-01 / C-02），落地形态是「一个变更一个原子 PR」，只依赖 `#28` 已登记的 3 条精确共同 owner**（实现 + `docs/api-contract.md` + `session-contract.test.js` + `activities.test.js`）；**不再新增/扩大 owner，stacked 不作为现行方案**。`frozen-set-regression.test.js` 的 owner 缺口见 §16-H；DB 集成与前端切换按 §14.6 的后续步骤。详见 §8.3 与 §14.6；本条第 3 项（`contactTodo`）与第 7 项（写作草稿）的批准结论见 §14。
>
> - **冻结集合 owner**：`contract`（`scripts/ci/check-ownership.mjs`：`public/demo-data.js`、`public/session-sync.js`、`src/components/sessions/`、`src/fixtures/`、`src/interfaces/http/`、`src/config/`）。
> - **业务规则/计算 owner**：`backend`（`src/components/business-rules/`、`src/components/ai-orchestration/`）。
> - **数据源 owner**：`data`（`db/`、`scripts/seed/`）。跨 owner 的项必须由 `contract` 牵头会签，不得由单一 owner 自行合并。
> - 状态行含义：**不改冻结集合** ＝ 不触碰 36/19/7/11；**改 PATCH 白名单** ＝ 同时改 19 项断言；**新增命令** ＝ 同时改 7 项断言与 `ACTIVITY_KINDS`（如适用）；**新增状态 key** ＝ 同时改 36 项断言。

### 8.1 八项变更清单

| # | 变更（批准状态） | 涉及页面 | 变更类型 | 是否改动冻结集合（36 key / 19 PATCH / 7 命令 / 11 `downstreamReset`） | 需同步的文档与测试断言 | 前置依赖 | 现状（`e4d8f49`） |
|---|---|---|---|---|---|---|---|
| 1 | **规则匹配产出有效 `rule_id`**：默认目标 → `allocation-balanced-r3`，R1/R2 → `allocation-liquid-r2`（**已成立**，无需再审批） | H-06 → `m/candidates`、`m/compare`、`m/companion` | 无需变更（既有 fixture 行为，非契约） | **不改冻结集合** | 无需改 `session-contract.test.js`；`tests/unit/fixture-model-client.test.js`、`tests/integration/w1-flow.test.js` 已断言 `allocation-balanced-r3` | 无 | **已达**：`pickAllocationRule()` 自 `2d9ad15` 起生效。原「`rule_id: null` → `UNSUPPORTED_RULE`」登记作废。仅剩 **H-06 缺口 ②③**（`UNSUPPORTED_RULE` 独立结果页、`NEED_CONFIRMATION` 可达性）需**前端结果页**改动，仍属契约外的 UI 变更，可随 `frontend-flow`/`frontend-lead` 提交 |
| 2 | **合格投资者认定状态**：新增只读字段（如 `qualifiedStatus`），由服务端快照派生，浏览器不可写 | P-05（`pc/product-private`、`m/private`） | 新增只读状态 key | **新增状态 key**：36 → 37（读模型）；若同时从 `defaultSessionState()` 落值，需在只读项（现 9 项）中登记 | `docs/api-contract.md` 契约表 + `session-contract.test.js` 的 36 项断言与只读分组断言；`CONTEXT.md` P0 #3 状态表 | 数据侧需先有认定来源（`db/`）；若复用 `customer.authorized`，须说明与授权的语义差别（A13） | 无写入方，`qualified` 已归只读。**已推进 · 波次 3**：口径改按只读派生投影（不进 `defaultSessionState()`，不新增状态 key），页面接线后落地，见下方「波次 3 决策记录」一 |
| 3 | **`contactTodo` 迁移（已批准 · C-01）**：由 `PATCH` 可选字段改为 `record_activity(kind='contact-request')`；`contactTodo` 保留为**只读兼容字段**（读时由 `activities[]` 派生，不作写入真源） | P-05（`m/private` 的 `m-contact`） | 命令迁移（新增 activity kind，不新增命令） | **PATCH 19 → 18**；**activity kind 14 → 15**；命令 7 → 7；状态 36 → 36；`downstreamReset` 11 → 11（`activities` 已在清理集合内，派生字段随之清零） | `docs/api-contract.md`（本 PR 已写批准规格）+ `tests/unit/session-contract.test.js` 的 19 项 + `tests/unit/activities.test.js` 的 15 kind 白名单 + 前端 `landingSpec` 文案与 `m-contact` 分支 | 无（`record_activity` 已存在）；需回归「撤权后联系记录不残留」 | **已批准 · 待按 §14.6 的原子 PR + 共同 owner 落地**；现仍为 PATCH 写入（`public/actions/flow.js` 的 `m-contact`），且 `submit_care` 仍写 `contactTodo: true`（必须一并删除） |
| 4 | **存款本息确定性计算**：接入已有 `deposit-interest-simple`，统一百分数/小数单位（`2.15%` → `0.0215`），入口在**只读计算接口**与**会话命令**中二选一 | P-04（`pc/product-deposit`、`m/deposit`、`m-deposit-compare`） | 新增入口（计算已存在） | 二选一：**只读接口**（`src/interfaces/http/`，不改冻结集合，但属 API 契约新增）／**新增命令**（7 → 8，改冻结集合） | 只读接口：`docs/api-contract.md` 新增端点节；命令：契约表 + 7 项断言。两种都需 `tests/unit` 单位回归（`2.15` vs `0.0215`） | `backend` 需先给 `executeDeterministic()` 补调用方与单位守卫；`data` 保证 `products.annual_rate`（`deposit`=2.15%）唯一真值 | 浏览器计算；`executeDeterministic()` **全仓无调用方**；百分数误传会放大 100 倍。**已推进 · 波次 3**：PR#11 已落 `calculateDeposit()` 只读入口与单位守卫，改走只读接口形态；端点路径以 contract PR 描述为准，见「波次 3 决策记录」一 |
| 5 | **持仓收益/贡献/集中度计算**：复用 `portfolioCalculation`，页面字段经服务端产出 | P-15（`m/holdings`） | 新增只读计算入口 **或** 复用已有证据包装配 | **不改冻结集合**（若走 `portfolio_calculation` 证据路径）／**新增状态 key**（若要求直接落会话字段） | 走证据路径：`tests/integration` 断言 `calculation_id` 与 `max_concentration`；落会话字段：契约表 + 36 项断言 | **PR#9 已提供前提**：`finalizeEvidence()` 将 `portfolio_calculation` 嵌入 `structured_facts.holdings[]`；剩余为页面侧消费与分母口径（全资产 41.76% vs 权益内 68%） | 页面硬编码；分母口径与文案未统一。**已推进 · 波次 3**：PR#11 已落 `PortfolioService.calculate()` 只读投影（双分母 + `estimated`），改走只读投影形态，见「波次 3 决策记录」一 |
| 6 | **保单与保障缺口数据来源**：新增保单表/接口（覆盖度、缺口、待办，按保单 ID 区分） | P-13（`m/insurance`）、P-03 保险板块 | 新增数据源 | **不改冻结集合**（只读数据接口）；若需写入会话则另行登记 | `docs/api-contract.md` 新增只读数据节；`tests/integration`（不含 DB 时用契约桩）与 `tests/e2e`（两张保单内容不同 + 空态） | `data` 新表 + seed；`contract` 定路由；**不得前端伪造**（A13、R32） | 无任何保单来源；`m-coverage`/`m-policy` 只开同一固定弹窗。**已推进 · 波次 3**：口径改按只读派生投影（仅产品事实可确定字段，无来源即空态），页面接线后落地，见「波次 3 决策记录」一 |
| 7 | **写作草稿持久化（已批准 · C-02）**：新增 `save_draft` 命令 + 服务端权威 `writingDrafts`（draft id/content/source request_id/created/updated，沿用 `expected_version` + `request_id` 幂等） | P-10（`pc/writing`） | 新增命令 + 新增状态 key | **命令 7 → 8**（`save_draft`）；**状态 key 36 → 37**（`writingDrafts`）；PATCH 白名单**不扩大**（C-01 后保持 18）；`downstreamReset` 11 → 11，撤权时在 `set_authorization` 撤权分支显式清空（见 §14.4） | 契约表 + `session-contract.test.js` 的 36/7/19 断言；新增 `tests/unit/writing-drafts.test.js`（幂等、越权、超限、撤权清理）；`tests/e2e`（生成→保存→刷新→回看 + 失败/空） | 需确认 `source_request_id` 与 `ai_requests` 的**服务端**一致性校验（不以浏览器 `aiRequests` 数组为真） | **已批准 · 待按 §14.6 的原子 PR + 共同 owner 落地**；现草稿只在结果页显示，回页即消失 |
| 8 | **H-06 失败态结果页拆分**（登记以便集中处理，**不属状态契约**）：`UNSUPPORTED_RULE` 使用独立 `landingSpec`，`NEED_CONFIRMATION` 保留 `rule-confirmation` 且文案与 `missing_fields` 对应 | H-06（`m/allocation`） | 前端 `landingSpec` + `public/actions/flow.js` 分支 | **不改冻结集合** | 无需改契约文档与 `session-contract.test.js`；需 `tests/e2e`（规则不匹配失败态）与 `tests/unit`（三类状态映射） | 无（服务端已在非 MATCHED 时返回 `patch: {}`，不覆盖旧方案） | 两类状态共用 `rule-confirmation`，`UNSUPPORTED_RULE` 文案错位 |

#### 波次 3 决策记录（2026-11-05，基线 `cf07b1b`）

> 本节是对 §8.1 八项的**逐项处置结论**，不是新规格。结论只涉及「口径如何表达」，**不改动 36 / 19 / 7 / 11 任何冻结集合**；具体端点路径、查询参数拼写与响应字段名以波次 3 `contract` Worker 的 PR 描述为准，本节只登记语义（与 `docs/api-contract.md`「只读计算与派生投影（W1 波次 3）」一节互相对应）。

**一、口径已由只读端点 / 派生投影覆盖（状态契约层面无需批准；页面接线并交齐三态后才算收工）**

| §8.1 | 处置 | 依据（波次 2 已合并） | 剩余工作 |
|---|---|---|---|
| 4 P-04 存款 | **口径已定：只读计算端点**（端点路径待 contract PR），不新增会话命令 | PR#11 `calculateDeposit()` 已落 `rate_unit`、单位守卫、`calculation_id`、`rule_version` 精确匹配；PR#12 已停用浏览器自算 | contract 暴露 HTTP 端点；`pc/product-deposit`/`m/deposit`/`m-deposit-compare` 改接端点并交齐三态 |
| 5 P-15 持仓 | **口径已定：只读计算投影**（复用共享 `computePortfolio()`），不落会话字段 | PR#11 `PortfolioService.calculate()` 已定义 `all_assets` / `equity_assets` 双分母与 `estimated` 收益口径 | contract 暴露端点；页面按分母口径改接并映射空态 |
| 2 P-05 认定状态 | **口径已定：只读派生投影**，不进 `defaultSessionState()`，**不新增状态 key** | 无写入方；派生自客户快照与 `products` | contract 暴露投影；页面改接并区分未认定/已认定/无受限产品三态 |
| 6 P-13 保单 | **口径已定：只读派生投影（限产品事实可确定字段）**，无保单写入 | 无保单来源 | contract 暴露投影；页面只在有来源时展示，否则显式空态；**不得**再回退到 72% / ¥4,000,000 硬编码 |

> 上述四项的冻结集合影响一律为「**不改**」：不新增状态 key、不改 19 个 PATCH 白名单字段、不新增 7 个命令、不改 11 个 `downstreamReset` key。因此 `tests/unit/session-contract.test.js` 的 36/19/7/11 断言**保持原样**，落地这批端点**不构成契约变更**。

**二、仍明确滞后，且确需状态契约 owner 批准（本波次不实现）**

| §8.1 | 处置 | 为什么只读端点不能替代 |
|---|---|---|
| 3 `contactTodo` 迁移 | **滞后**：由 `PATCH` 白名单字段改为 `record_activity` 新 `kind` 或独立命令，需批准（19/7/14 kind 断言同步） | 「联系客户经理」要求产生服务端可见记录（A11）；这本质是一次**写入**，只能落命令或 activity kind，只读投影无法承载 |
| 7 写作草稿持久化 | **滞后**：需新增状态 key 或新增 `save_draft` 命令，需批准 | 草稿需刷新后可回看（A11），属持久写对象；只读投影没有写入口，无法伪造 |
| 其余任何需要**新增状态 key**的项 | **滞后**：一律先过 §8.2 流程 | 新增写入面必然改动 36 项断言，属契约变更 |

> 再次明确：凡需要「写进会话」的需求（草稿、联系记录、认定结果落库、保单落库），**不能**用本波次的只读派生投影绕过；本波次不为这些需求提供任何写入通道。

**三、本波次的架构选择：「不改冻结集合」**

波次 3 在 P-04 / P-15 / P-05 / P-13 四项上选择「只读端点 + 派生投影、冻结集合零改动」，理由是：

1. **可验证性**：只读端点不推进 `version`、不需 `expected_version`/`request_id`，与 7 个命令的状态机完全解耦，可独立验收（三态各一条），不牵连 `downstreamReset()` 级联；
2. **不扩大写入面**（§8.2 第 3 条「只读优先」）：浏览器仍旧不能写认定状态、保单、计算值，A13「真实表达」与 A07「缺失值不编造」由服务端派生保证；
3. **一次 PR 单侧改动即可通过**：冻结集合不变，因此本波次**不需要**在同一 PR 内改 `docs/api-contract.md` 契约表与 `session-contract.test.js` 断言；§8.2 第 2 条的「一次性同步」只对真正改集合的项生效；
4. **可回退**：若后续 owner 决定把认定状态或草稿落成会话 key，只需在 §8.1 重新登记并按 36 → 37 正规模变更处理，已落地的只读端点是其**前置口径**，不会作废。

**四、验收边界（红线沿用 §6）**

- 上述只读端点与派生投影的**成功态只证明链路与结构真实**，不证明页面内容质量，也不构成生产验收结论（§0.1）；
- 保单派生投影在无真实来源时**只能**返回空态与 `unavailable_reason`，**绝不伪造**保单号、生效日期、理赔进度（A13、R32）；
- 持仓收益口径为 `estimated`，页面必须标明「估算」，不得把它写成已达成的收益率指标；集中度必须以 `basis` 明确分母（全资产 vs 权益资产）；
- 存款利率口径以 `deposit-interest-simple` 的小数为准（2.15% 传 `0.0215`），百分数须显式 `rate_unit=percent`，不得让页面自行换算后再传小数。

### 8.2 波次 3 处理约定

1. **先批准后实现**：§8.1 的 2–7 任一项，须先取得 `contract` owner 批准（跨 owner 项含会签），再改代码；批准结论记录在对应 issue/PR 描述中；
2. **同提交/同 PR 同步（2026-11-06 修订，2026-11-08 再修订）**：批准后，契约实现、`docs/api-contract.md`、`tests/unit/session-contract.test.js`、`tests/unit/activities.test.js` **必须在同一原子 PR 内同提交**；跨 owner **只使用 `#28` 已登记的 3 条精确 `owners`**，不得新增/扩大。`tests/unit/frozen-set-regression.test.js` 的 owner 缺口见 §16-H；DB 集成与前端切换按 §14.6 的后续步骤，不塞进原子 PR。集合断言与文档任一侧缺失即视为未获批准；**不得用 label、改名、`CHANGED_FILES` 环境变量或目录级放宽绕过，也不得拆 stacked 中间态**；
3. **只读优先**：能用只读接口/证据包表达的（第 4 项接口形态、第 5、6 项）优先，避免扩大写入面；
4. **不得搭便车**：任何条目不得顺手改动与自身无关的冻结项或新增运行页面（§6 红线 1）；
5. **波次 3 补充**：「波次 3 决策记录」一列出的 P-04 / P-15 / P-05 / P-13 四项走只读端点或派生投影，**不属于**本条第 1 款的批准范围（冻结集合不变），因此无需 owner 批准即可实现与验收；但若实现过程中发现必须改任一笔冻结集合，须立刻停止，回到 §8.1 重新登记并回到第 1、2 款流程；

#### 波次 3 决策记录的波次 4 补充（2026-11-06，基线 `9411ead`）

> 本节只登记「#14 落地后口径是否变化」，**不新开规格**，也不再改 36 / 19 / 7 / 11 任何集合。

1. **冻结集合未因波次 3 改动**：#14 的新输出一律落在只读响应的独立命名空间（`readonly_projections`）与 GET 路由上，不写会话、不新增命令（新增路由见 `src/interfaces/http/routes.js`，控制器见 `controllers.js`）；#15 未改 `tests/unit/session-contract.test.js`；#16 为纯文档。#17 只改前端。四者均未触碰 36 key / 19 PATCH / 7 命令 / 11 `downstreamReset` 集合断言。
2. **8 项中已由只读端点或派生投影覆盖口径的项**（这是「口径已覆盖」，**不是**「条目已收工」；页面仍须交齐三态用例）：
   - 原则匹配 `rule_id` 已成立（§8.1 第 1 项，非契约变更）；
   - P-04 存款本息（§8.1 第 4 项）：`GET /api/calculations/deposit` 已可用，`rate_unit` 单位口径由服务端守卫；
   - P-15 持仓收益/集中度（§8.1 第 5 项）：`GET /api/calculations/portfolio` 已可用，双分母与 `estimated` 口径由服务端给出；
   - P-05 合格投资者认定（§8.1 第 2 项）：`qualified_status` 只读派生，当前恒为 `UNKNOWN` / `no_qualified_source`，**不得用 `authorized` 冒充**；
   - P-13 保单（§8.1 第 6 项）：`insurance_coverage` 只读派生，`policy_id` 恒 `null`、`coverage_gap.available=false`，**不伪造**保单号与缺口金额。
3. **仍需状态契约 owner 批准、只能改写入面的项**：`contactTodo` 由 `PATCH` 迁到 `record_activity`（§8.1 第 3 项）、写作草稿持久化（§8.1 第 7 项），以及任何需要新增状态 key 的项（含若后续要把认定结果或保单落成会话字段）。只读派生投影**不是**写入通道，不能替代。
4. **明确红线**：**未获批准前 Worker 不得先行改动冻结集合**——不得先加状态 key / PATCH 字段 / 命令，再补 `tests/unit/session-contract.test.js` 断言；集合断言失败即按 §8.2 第 2 款视为未获批准。
5. **波次 4 新引入的前置（不计入本节的 8 项）**：真库 `NUMERIC` 字符串归一化属 `backend` owner 的实现缺陷修复，**不涉及**契约集合与口径变更，但它是 P-04 / P-15 / P-17 三页成功态的前置；在归一化落地前不得把这三页记为达标。

#### 波次 4 / 5 决策记录补充（2026-11-06，基线 `5bcb1cc`）

> 本节只登记「波次 3 / 4 / 5 全程是否改动冻结集合」与「仍未落地的待批准项」，**不新开规格**，也不改 36 / 19 / 7 / 11 任何集合。

- **冻结集合全程未变**：波次 3、波次 4（#18 / #19 / #20 / #21）与波次 5 并行工作包均未改动会话状态契约——`defaultSessionState()` 36 key、`SESSION_PATCH_FIELDS` 19 项、`SESSION_COMMANDS` 7 项、`downstreamReset()` 11 key 一律原样，`tests/unit/session-contract.test.js` 的冻结断言未被改写（#18 的归一化只改 `src/platform/` 与两个 service 的入口类型处理，不写状态；#20 / #21 为前端；#19 与本 PR 为纯文档）。
- **仍未批准的待批准项**：`contactTodo` 从 `PATCH` 迁出（§8.1 第 3 项）、写作草稿持久化（§8.1 第 7 项），以及**任何新增状态 key**（含若后续要把认定结果或保单落成会话字段），仍属「需状态契约 owner 批准」的待批准项，**W1 全程不落地、不先行实现**；批准前页面只能消费只读投影与派生投影。
- **P-05 / P-13 的派生投影仍只读**：`qualified_status`（恒 `UNKNOWN` / `no_qualified_source`）与 `insurance_coverage`（`policy_id` 恒 `null`、`coverage_gap.available=false`）不构成写入通道，页面改接它们**不属于** §8.1 的批准范围。

### 8.3 变更组、原子契约 PR 与共同 owner（2026-11-06 批准，2026-11-08 修订）

> 本节解决「同一变更必须同步文档 + 契约代码 + 冻结集合测试，但 `ci-ownership` 只允许单个 Agent 目录」的结构性冲突。**不降低同步要求，只改变落地形态。**
>
> **2026-11-08 关键修订**：C-01 / C-02 是**原子契约变更**——删 PATCH 字段或改集合断言的那一提交会让 `tests/unit/session-contract.test.js` / `frozen-set-regression.test.js` 立即变红，简单 stacked PR 的**中间态无法全绿**；若把中间态全部攒到一个功能分支再合并，最终功能 PR 的 diff 又必然跨 `docs` / `contract` / `test-unit` / `test-db` 而**越界**。因此 **C-01 / C-02 采用「每项变更一个原子 PR」，只依赖 `#28` 已登记的 3 条精确共同 owner**，不再新增/扩大 owner；具体文件与缺口见 §14.6。**stacked PR 已不作为现行方案**，未纳入原子集的变更按各自 owner 发独立 PR（§8.3.2）。

**事实前提（代码）**：`scripts/ci/check-ownership.mjs` 按分支名 `ao/<agent-id>/<topic>` 取 Agent 身份，再校验 PR 的 changed files 是否落在该 Agent 的路径前缀内；`docs/` 只属 `docs`、`src/components/sessions/` 只属 `contract`、`tests/unit/` 只属 `test-unit`、`tests/integration/` 只属 `test-db`、`public/app.js` 只属 `frontend-lead`。**任何单个 PR 同时改这些路径都会被拒绝**，这不是改名、加 label 或跳过 job 能解决的。`OWNERSHIP` 的条目值是 `owners` 数组，`ci-ownership` 用 `owners.includes(agent)` 判定——这就是不绕过检查的合法扩展点（§14.6）。

#### 8.3.1 原子契约变更（C-01 / C-02 适用，依赖 #28）

1. **一个变更一个 PR**：C-01、C-02 各自一个 PR，分支 `ao/contract/<topic>`；同一提交内包含**实现 + `docs/api-contract.md` + `tests/unit/session-contract.test.js` + `tests/unit/activities.test.js`**（后两者按变更实际需要），不拆中间态。
2. **只使用 #28 的共同 owner**：#28 已登记 3 条精确路径（`docs/api-contract.md`、`tests/unit/session-contract.test.js`、`tests/unit/activities.test.js`），**不再新增或扩大**；不扩 `docs/`/`tests/` 前缀，不加 `public/app.js`/`flow.js`/`w1-flow`/`frozen-set-regression`，不加 `baseline`。
3. **单 head 全量验证**：原子 PR 的 head 必须 6 个 job + `ci-merge-gate` 全绿，并在该 head 上跑：新集合断言（C-01 18/15/7/36/11；C-02 叠加后 18/15/8/37/11）、`session-contract.test.js`/`activities.test.js` 的新增断言；`docs/api-contract.md` 与本清单的集合数字逐项一致。
4. **前置**：`#28`（`scripts/ci/check-ownership.mjs` 的 3 条 owner）必须先合并；合并后同步最新 `main` 再重跑 CI。**本 docs PR 不改 CI、测试或代码。**
5. **未覆盖文件**：`frozen-set-regression.test.js` 的 owner 缺口见 §14.6.7 / §16-H，**在 H 解决前原子 PR 不能合并**；DB 集成测试（`w1-flow`）与前端切换（`flow.js`）不在原子 PR，分别由后续 test-db PR 与 §14.6.6 的兼容序列处理。
6. **回退**：回退该原子 PR 即整体回退；不允许只回退测试保留代码。

#### 8.3.2 未纳入原子集的变更（按 owner 分 PR，不做 stacked）

- 页面三态/前端消费/DB 集成断言：各自由 `test-e2e` / `frontend-lead` / `frontend-flow` / `test-db` 发**独立 PR**，基于已合并的 contract 原子 PR；**不采用 stacked 中间态作为现行方案**。
- 每条 PR 只用自己 owner 的路径；跨 owner 的需求回到 §14.6 检查是否属于原子集，**不得临时扩 owner、不得加 `baseline`、不得跳过 `ci-ownership`**。
- 文档、契约、测试的同步性由 contract 原子 PR 保证；后续 PR 只追加消费/断言，不回溯修改冻结集合。

> **历史说明（仅追溯）**：stacked PR 曾被考虑为非原子多 owner 变更的备选，但中间态无法全绿且最终功能 PR 会越界，**已不作为现行方案**。

## 9. 领取与验收流程

1. Worker 按表领取条目，先写「逐页填写模板」（§2）再改代码；
2. 实现限于条目路由与必要的服务端计算/命令，**不改其他 owner 的目录**（`scripts/ci/check-ownership.mjs` 按 `docs/`、`public/actions/*`、`src/` 等前缀分派）；
3. 提交 PR 时在描述中引用本条目编号（例如 `P-05`、`H-06`），并逐项勾选：成功/失败/空三态各有用例、改动路径在本 Agent 的 owner 范围内、fixture 标注保留；
4. 架构文档第 11 章 A01–A35 仍是 DEMO 通过条件；本清单**不替代**第 11 章，也不替代附录 A 的判定归属。

## 10. 文档维护

- 本清单随 W1 并行研发推进更新：条目收工时在对应行追加「已收工 · PR#」，**不删除**原条目（保留追溯）；
- 涉及 A–G 列指标的变化只能登记承载与判定归属，不得改写指标原文；
- 若与 `CONTEXT.md` 冲突，以 `CONTEXT.md` 为准，并在 PR 中请求 orchestrator 裁决；
- **基数只在 §1.1 维护**：任何缺口数变化先改 §1.1，再同步引用处；旧一轮的缺口基数不得继续用于排期；
- **事实复核责任**：涉及「某链路必然失败/不可达」的断言，领取前必须在当前基线用代码事实 + 现有测试复核；被证伪的断言保留原文并标注「已撤回（基线 + 依据）」，不得直接删除，以免后续 Worker 重复误判；
- **契约变更只在 §8 登记**：新增/调整状态一律进 §8.1，并遵守 §8.2 的「先批准后实现、一次性同步」；未获 `contract` owner 批准不得改动冻结集合；
- **波次 3 起追加登记点**：流程口径未变，仍以 §8.1 为契约变更唯一入口；波次 3 只新增了 §0.5（收工登记）、§1.1（缺口基数重算）、§8「波次 3 决策记录」的波次 4 补充与 §12（波次 4/5 排期参考），以及各条目行/条目的「已推进 · 波次 3」标注，**未新增任何指标、未新增运行页面、未登记 C/D/E 类指标的判定结论**。

## 11. 波次 4 / 5 进度登记位（供后续 docs 波次回填）

> 每合并一批 PR，在本节追加一行，并在 §0.5 后另起「§0.6 波次 4 收工登记」；缺口数只改 §1.1（波次 4 后以 §1.2 为准）。

| PR | 类型（owner） | 性质 | 落到本清单的哪一节 | 状态 |
|---|---|---|---|---|
| #18 | backend（`backend`） | 真库 `NUMERIC` 归一化（只读计算入口） | §0.6、§1 行 6/23/26/29、§1.2、§3 P-04/P-15/P-17、§8 波次 4/5 补充 | 已合并 `39147e4` |
| #19 | docs（`docs`） | 波次 3 进度登记与波次 4/5 排期 | §0.5、§1.1、§8 波次 4 补充、§11、§12 | 已合并 `4c2bcda` |
| #21 | frontend-lead（`frontend-lead`） | P-02/P-03/P-06/P-08/P-14/P-16 改接 `/api/demo-data` 与 `/api/knowledge` | §0.6、§1 行 3/4/5/10/15/22/27、§1.2、§3 P-02/P-03/P-06/P-08/P-14/P-16 | 已合并 `6fcdb0e` |
| #20 | frontend-diagnosis（`frontend-diagnosis`） | 保险动作改接真实产品事实（P-13），`m-diagnose` 停止静默改诊（P-12） | §0.6、§1 行 20/21、§1.2、§3 P-12/P-13 | 已合并 `5bcb1cc` |
| 本 PR（波次 5 · docs） | docs（`docs`） | 波次 5 收档自检：基线更新为 `5bcb1cc`、波次 4 收工登记（§0.6，位于 §0.5 之后、§0.1 之前）、缺口基数重算（§1.2）、P/H 条目「已推进 · 波次 4」标注、§7 逐条修正复核、§8 决策记录补充、§11.1 A01–A35 自检、§13 波次 5 之后的剩余工作 | §0.6、§1 表行、§1.2、§3、§4、§7、§8、§11、§11.1、§12、§13 | 见本 PR |

> **勘误（保留原文追溯）**：上表在 `4c2bcda` 时曾把行 `#18` 记为「docs（本 PR）：波次 3 进度登记与缺口基数重算」——该行实际对应的 PR 是 **#19**（`4c2bcda`，docs）；而真正合并的 **#18 `39147e4` 是 backend（真库 `NUMERIC` 归一化）**。本 PR 按 `gh pr view` 与 `git log` 更正，原文保留于此以免后续 Worker 误判。

### 11.1 A01–A35 自检登记（波次 5 收档，基线 `5bcb1cc`）

> **自检口径**：以架构文档 V2.3 第 11 章 A01–A35 逐条比对 `5bcb1cc` 代码事实与已合并 PR。只分三类：**已完成**（W1 fixture / 单节点或已合并证据足以支撑本章通过条件）、**W1 fixture 下部分完成**（链路或结构已真、但缺用例、缺数据源、或仅单实例/单路径验证）、**明确后置**（E 类性能与统一评测集、C/D 类交付物、真实模型调用、双节点与多集群）。**任何一条都不以 H 列自评或 fixture 结果作为「生产验收通过」证据。**
>
> 关于 A14 的唯一允许表述：**八类任务均产生可验证的 fixture 调用与真实证据链，模型名恒为 `fixture-generate-1`，真实模型调用后置。**

| A 项 | 验收场景 | 分类 | 一句话代码事实 / PR 证据 |
|---|---|---|---|
| A01 | 双节点启动与界面边界 | 部分完成 | 0.2 白名单 30 路由可达，`tests/e2e` 的 `contract`/`mobile-flow`/`pc-flow`/`work-items` 覆盖菜单与路由边界（15 次运行）；**「A、B 两个实例 + 负载均衡」本轮未在 W1 验证**（单实例开发态），双节点归后置。 |
| A02 | 数据与知识真实性 | 部分完成 | `GET /api/demo-data` 发布 `products[]` / `holdings[]` / `knowledge` 投影，字段带 `source_id` / `source_timestamp`（#14 / #21 页面消费）；知识条目带 `page`（`tests/unit/fixture-parity.test.js`、`fixture-parity` 断言 JS fixture 与 SQL seed 一致）；**行内客户/持仓与当天产品仍为演示 fixture**，非行内真实数据。 |
| A03 | 主流程 | 部分完成 | 手机主闭环 E2E 通过（`tests/e2e/mobile-flow.spec.js`「助手 → 配置 → 候选 → 比较 → 投后陪伴」），`ensureAuthorization()` 真实点击生成方案；PC 闭环见 `pc-flow.spec.js`；**要求的是「助手 → 持仓 → 诊断 → 配置 → 候选 → 比较 → 陪伴」连续串行**，现有用例把持仓/诊断段拆开或跳过，故仅部分完成。 |
| A04 | 授权拦截 | 部分完成 | `m/allocation` 未勾选 → `auth-needed`；`tests/unit/sessions.test.js`「generic session patch cannot forge authorization…」与「comparison requires two real products and revocation clears downstream state」已验证下游清理；**PR#24 已补页面「撤销授权」入口**（`public/actions-registry.js` 的 `m-revoke-auth` 复用 `set_authorization`，未新增命令）；`mobile-flow.spec.js` 仍只断言 `plan` / `candidates` / `compareSaved` 三项，**`downstreamReset()` 的 11 个 key 未逐 key 断言**；C-02 落地后还须断言 `writingDrafts` 被清空。 |
| A05 | 配置一致性 | 已完成 | `generate_allocation` 100% 合计（`tests/unit/rules.test.js`）；目标变更使旧候选/比较失效（`tests/unit/sessions.test.js:56`「goal changes invalidate plans, candidates and comparisons」）。 |
| A06 | 候选逻辑 | 部分完成 | 候选资格/理由/排序由 `candidateCalculation` 给出（#9），`reasons[].constraints` 与 `holding_months` 已由 #21 在 `m/candidates` 消费；`tests/unit/rules.test.js:22` 断言风险/期限/流动性/可售四类约束；**`pc/candidates` 仍未消费 `score`/`candidateCalculation`**（§4 H-02 波次 5 复核）。 |
| A07 | 比较逻辑 | 部分完成 | `save_comparison` 要求 2–3 个真实产品（`tests/unit/sessions.test.js:43`），`m-compare-add` 经 `/api/demo-data` 校验 `product_id`（#12）；服务端产出 `comparable` / `incomparable_reason`；**前端仍未消费该口径**（H-03）。 |
| A08 | 计算一致性 | 部分完成 | 存款本息 `POST`…即 `GET /api/calculations/deposit` 可由 `principal × rate × years` 复算（`tests/unit/deposit-calculation.test.js`）；持仓合计/占比/集中度由 `GET /api/calculations/portfolio` 复算（`tests/unit/portfolio-calculation.test.js`），真库字符串入口已归一（#18）；**提前支取结果未实现**（`m-deposit-compare` 无服务端入口），页面三态用例缺。 |
| A09 | 问答边界 | 已完成 | `research_qa` 无片段 → `422 INSUFFICIENT_EVIDENCE`（`tests/e2e/contract.spec.js:48` + `tests/integration`）；前端不吞错（`ai-error` 卡片）。 |
| A10 | 分支闭环 | 部分完成 | 保险动作已按被点击产品渲染真实事实（#20），持仓收益接只读端点（#17），理财/存款有入口；**私行 P-05 仍整页受限、未消费 `qualified_status`**；报告阅读与智能写作能到达结果页但正文/草稿无真实持久化；选品/模型运营/来源接入/交付验收不设运行页面（§5.2）。 |
| A11 | 动作状态 | 部分完成 | `record_activity` 服务端生成 `activity_id`，同 `request_id` 幂等（`tests/unit/activities.test.js`）；比较/陪伴提交用 `showActionError` 显示真实错误；**写作草稿不持久**（§8.1 第 7 项待批准）；部分 `landingSpec` 条目仍为说明性文本。 |
| A12 | 会话恢复 | 已完成 | `tests/e2e/contract.spec.js:21`「创建 session，刷新后恢复同一 session_id 与服务端状态」；`tests/integration/db-smoke.test.js:84`（opt-in）证明会话落 PostgreSQL。 |
| A13 | 真实表达 | 已完成（页面侧） | `pageArchitecture()` 只读 `/api/health`、无来源指标不展示；`99.98` / `94.6` 已无命中；#21 清除了 P-02/P-03/P-06/P-08/P-14/P-16 的产品与计数硬编码；#25 补了成功态下「无默认 KPI」的独立断言；页面保留「演示桩 fixture」标注。**仍存**：`m-event` 固定文本含虚构「权益暴露 20%」（F-09），属未修复缺陷。 |
| A14 | 真实模型调用 | 部分完成（真实模型后置） | **八类任务均产生可验证的 fixture 调用与真实证据链**（`tests/unit/fixture-model-client.test.js`、`ai.test.js` 覆盖八类 `task_type` 的引用白名单与证据包，模型名恒为 `fixture-generate-1`，`latency_ms` 落库）；**真实模型调用后置**，本清单不宣称 A14 已满足。 |
| A15 | 密钥安全 | 已完成 | `scripts/ci/check-secrets.mjs` + `tests/unit/security-check.test.js`（`.env`、`qwen.key`、私钥与模型 API key 模式全部拒绝）；`/api/health` 不返回连接串。 |
| A16 | AI 异常处理 | 已完成 | `tests/unit/ai.test.js`「AI response is rejected when the session advances during generation」；`tests/e2e` 证据不足与 `ai-error` 路径；模型不可用返回 `DEPENDENCY_UNAVAILABLE` 而非预置答案（`tests/http/app.test.js:36`）。 |
| A17 | 事实与引用 | 已完成 | `tests/unit/ai.test.js`「AI rejects fabricated prefixed citations」「research generation returns only evidence-backed citations」；模型无法改写数值（`rule matching executes the stored action and ignores model supplied action values`）。 |
| A18 | 请求一致性 | 部分完成 | `runRealAiTask()` 用 `activeAiRequestToken` 丢弃旧响应、`request_id` 不匹配即抛错（`public/app.js:1304–1346`）；`tests/unit/ai.test.js:69` 覆盖会话推进后拒绝；**超范围转人工状态机的专用用例仍缺**（H-04）。 |
| A19 | 真实数据参与生成 | 已完成 | 诊断/候选/解释证据包携带 `data_id` / `calculation_id`，`finalizeEvidence()` 嵌入 `portfolio_calculation`（PR#9）；`tests/unit/ai.test.js` 断言引用与证据一致。 |
| A20 | 知识参与生成 | 部分完成 | 研究/摘要/写作均带 `chunk_id`（`tests/unit/fixture-model-client.test.js`）；`pageReader()` 已展示片段 `title` + 页码 + `source_id`；**PR#24 已把引用卡片的标题与页码补上**（§7 A20）。**仍缺**：同时断言标题+页码的 E2E，以及「无知识片段引用」真实空态的独立断言。 |
| A21 | 真实向量检索 | 部分完成（后置真实 Embedding） | `tests/unit/fixture-vector.test.js`（1536 维确定性向量、Top-1 回归）与 `tests/integration/db-smoke.test.js:57`（pgvector 每条片段有向量，opt-in）；**真实 Embedding API 后置**，W1 为 `fixture-deterministic-1536`。 |
| A22 | 索引一致与隔离 | 已完成 | 迁移创建 `vector(1536)` + hnsw 索引（`db-smoke.test.js:29`）；模型/知识版本不一致即阻止调用并由 `fixture-parity.test.js` 断言两端一致；客户持仓与回答不写入向量库。 |
| A23 | AI 规则匹配 | 已完成 | `tests/unit/ai.test.js:23`「rule matching executes the stored action and ignores model supplied action values」；`rule_id` + `rule_version` 精确匹配（#9）。 |
| A24 | 规则确认与越界 | 部分完成 | 服务端非 `MATCHED` 返回 `patch: {}` 不覆盖旧方案（#9）；`openLanding('rule-confirmation')` 显示 `ruleMatch.status` 与 `missing_fields`；**`UNSUPPORTED_RULE` 仍与 `NEED_CONFIRMATION` 共用同一结果页，`NEED_CONFIRMATION` 在表单恒有默认值 + fixture 置信度 0.99 下不可达**（H-06）。 |
| A25 | 当天快速导入 | 明确后置（C 类） | `scripts/import/validate.js` / `run.js` 与 `tests/unit/import.test.js` 提供导入校验；**「当天」在行内真实数据上完成校验、入库、加工、激活需行内环境**，不由 W1 判定。 |
| A26 | 产品最新与实时 | 明确后置（C/E 类） | W1 只有单版本 `ACTIVE` 数据/知识版本（`db-smoke.test.js:45`）；**当天基线/增量双节点可见、来源超期提示、属性变更使旧候选失效**需行内数据源与双节点，后置。 |
| A27 | 双节点会话一致 | 明确后置 | 单节点验证；A/B 交替请求的会话一致性需双节点环境。 |
| A28 | 知识双节点一致 | 明确后置 | 同上；W1 只证明单库 `ACTIVE` 知识版本可召回（`db-smoke.test.js:57`）。 |
| A29 | 节点故障续接 | 明确后置 | `GET /api/health/checks`（#14）暴露 7 项 checks 可作就绪判据，但停止节点后续接的原会话**未在 W1 验证**。 |
| A30 | 就绪与版本控制 | 已完成 | `GET /ready` 的 7 项 boolean checks（`tests/http/readonly-contract.test.js:90`）；未就绪节点 503 `NODE_NOT_READY`（`src/app.js`）；半成品版本不激活（`db-smoke.test.js:45`）；`/api/health` 携带 `api_version` / `frontend_contract_version` 且与 `public/index.html` 一致（`readonly-contract.test.js:81`）。 |
| A31 | 界面边界与可替换性 | 已完成（结构） | 前端只经 `session-sync.js` 适配层访问 API，播放层替换不改后端；30 路由冻结；`tests/unit/frontend-menu.test.js` 断言 12 个退出路由字符串不出现在前端源码。 |
| A32 | 总体需求规格覆盖 | 已完成（台账） | 架构文档附录 A 逐条登记 R2–R62（61 条）的承载与判定归属；本清单不登记满足情况、不引用 H 列。 |
| A33 | 界面边界一致性 | 已完成 | 运行路由/菜单/动作与 `public/` 一致（`tests/unit/frontend-menu.test.js`、`tests/e2e/work-items.spec.js` 的未知操作 `not-implemented`）；`public/requirements.js` 中 F22–F33 显示「无独立运行页面」。 |
| A34 | 服务开放与非封闭 | 部分完成 | 不经浏览器可完成同一链路：`GET /api/demo-data`（database 模式必须带 `session_id`，否则 400）、`GET /api/knowledge`、会话命令、`POST /api/ai/generate`（`tests/http/app.test.js`、`tests/integration/w1-flow.test.js`）；**「统一 JSON 与错误码 + 先建会话再传 session_id」的专门接口契约用例仍缺**（§7 A34）。 |
| A35 | 真实时延与日志 | 部分完成 | `ai_requests` 记录 `model` / `latency_ms` / `request_id`（`tests/unit/ai.test.js`、`tests/integration/db-smoke.test.js` 查询）；运行日志含时间、路径、状态、耗时与追踪标识；**逐条 70QPS / 24 小时 / 统一评测集不作结论**（E 类）。 |

**A01–A35 自检合计（逐行标注统计）**

| 分类 | 条数 | A 项 |
|---|---|---|
| 已完成 | **13** | A05、A09、A12、A13、A15、A16、A17、A19、A22、A23、A30、A31、A32、A33 |
| W1 fixture 下部分完成 | **17** | A01、A02、A03、A04、A06、A07、A08、A10、A11、A14、A18、A20、A21、A24、A34、A35 |
| 明确后置 | **5** | A25、A26、A27、A28、A29（A14 的「真实模型调用」与 A21 的「真实 Embedding API」两个子项虽后置，但整条只计一次并归入「部分完成」；A23 的规则排名复核子项不单独计条） |

> 核对：已完成 **13** + 部分完成 **17** + 明确后置 **5** = **35**，与第 11 章 A01–A35 条目数一致。上表逐行「分类」单元格是唯一依据；本行只作合计核对。

> **红线复核**：上表未把 E 类（70 QPS、24 小时、多集群、四类任务各 5 次、统一评测集）、C 类（导入、知识加工、部署、文档）、D 类（承诺书、行内集成、信创、专利与授权）或真实模型/真实 Embedding 调用写成「已完成」或「已由 W1 fixture 判定」；A14 只写「八类任务均有可验证的 fixture 调用与真实证据链、模型名恒为 `fixture-generate-1`、真实模型后置」。

## 12. 波次 4 / 5 排期（供 orchestrator 参考）

> 本节是**排期建议**，不是验收结论，也不改 §1.1 的缺口数。排期时以 §1.1 前四行为准，本节只说明「先解哪一类前置」。

### 12.1 波次 4（建议按此顺序）

1. **`backend`：真库 `NUMERIC` 归一化（最高优先级前置）**。定位点：`portfolioCalculation.js` 的 `Number.isFinite(holding.amount)` 校验与 `depositCalculation.js` 的 `parseNumber` 在 `DATA_MODE=database` 下的字符串输入路径，以及 `demoDataRepository.js` 读取 `holdings.amount` / `holdings.return_rate` / `products.annual_rate` 时未做行级归一。归一化后 `GET /api/calculations/portfolio` 与 `/api/calculations/deposit` 才能在真库下取得成功态；同一输入缺陷也存在于 `diagnosis_explain` 证据路径（`ai-orchestration`），须一并处理。**不涉及冻结集合。**
2. **P 类页面改接 `/api/demo-data`**：把仍硬编码的 P-01/P-02/P-03/P-06/P-07/P-08/P-09/P-10/P-11 / P-12 / P-14 页面的主体数据改为服务端来源（顺序建议：P-08 `pc/library`、P-02 `pc/product-fund`、P-03 → P-06 → P-07 → P-09 → P-10 → P-11 → P-12 / P-14；P-01 另依赖 `/api/health/checks`，见 #14 已暴露的 7 项 checks）。回填 §1 表行与 §1.1 时，**以页面在真库下取得成功态 + 三态用例齐备**为冲减条件。
3. **保险动作真实数据**：`m-coverage` / `m-policy` 改接 `GET /api/insurance/coverage`，在无保单来源时显示显式空态、不再开固定弹窗；「两张保单内容不同」在 `data` 提供保单表前**仍不得记为达标**（§8.1 第 6 项、§3 P-13）。
4. **进度登记**：本波次结束时按 §11 回填，并重算 §1.1（含 ①②③④ 细分行）。
5. **待批准项不进入本波次实现**：`contactTodo` 迁移与写作草稿持久化（§8.1 第 3、7 项）须等 `contract` owner 批准，本波次只登记不实现。

### 12.2 波次 5

1. **H 类收尾**（H-01…H-06 剩余缺口）：无候选引导空态、比较结论可复算、重复提问幂等、`UNSUPPORTED_RULE` 独立结果页与 `NEED_CONFIRMATION` 可达性等，逐条对齐 §4 的「完成条件」列。
2. **§7 逐条修正项**：A04 撤销授权入口、A20 引用页码、A34 服务开放前置、A18 请求一致性用例。
3. **E2E 从 15 项扩到覆盖 30 页**：当前 9 用例 × 2 工程 = 15 次运行；波次 5 需按 §1 路由逐页补成功/失败/空三态，使 ② 口径有可执行证据，而非仅靠人工核验。
4. **A01–A35 自检**：以架构文档第 11 章逐条比对，登记未达成项；**不得**在自检中把 E 类（性能/评测集）或 C/D 类指标写成「已由 W1 fixture 判定」（§6 红线 3）。

> 波次 5 执行状态（基线 `5bcb1cc`，据已合并 PR 登记）：第 1 项 H 类收尾**未全部落地**（H-03 固定文案已不在代码中、前端仍未消费 `comparable`；H-02 / H-04 / H-05 / H-06 未变化，见 §4「波次 5 代码事实复核」）；第 2 项 A04 / A18 / A20 / A34 **未落地**（A20 仅阅读器页面已有页码，见 §7）；第 3 项 E2E 仍为 15 次运行、**未扩页**；第 4 项 A01–A35 自检已在本 PR 登记于 §11.1（纯文档，不改任何代码）。波次 5 的并行工作包（frontend-lead 的 H 类收尾、test-e2e 的三态扩展、test-unit 的接口契约用例）若已提交，其结论以对应 PR 描述为准，**本清单不代其判定达标**。

## 13. 波次 5 之后的剩余工作（供 orchestrator 决定是否需要后续波次）

> 本节只列「仍未达标 / 仍缺数据源或契约 / 仍无助跑证据」的事实清单，不改 §1.2 的任何缺口数，也不构成验收结论。条目编号沿用 §1 与 §3 / §4。

### 13.1 仍未达标的 P 类条目（17 条，按缺什么分组）

| 分组 | 条目（路由） | 剩余事实（代码/PR 可核） |
|---|---|---|
| A. 页面已改接服务端读数，缺真库成功态与三态用例 | P-02 `pc/product-fund`、P-04 `pc/product-deposit` / `m/deposit`、P-08 `pc/library`、P-15 `m/holdings`、P-17 `m/companion`、P-14 `m/wealth` | 读数已接 `GET /api/demo-data` / `GET /api/calculations/*`（#17 / #21），真库字符串入口已归一（#18）；`tests/e2e` 无任何失败态与空态断言；P-04 的本金/期限仍为固定输入。 |
| B. 缺数据源 | P-03 `pc/product-insurance` + `pc/product-wealth`、P-06 `pc/supply`、P-13 `m/insurance` | 保单表（§8.1 第 6 项）、管理人字段、资讯/策略供给均无服务端来源；P-13 的「两张保单内容不同」无法真实达成；`m-policy` 无页面入口。 |
| C. 缺计算入口或持久化 | P-10 `pc/writing`、P-11 `pc/result` + `m/result` | 写作草稿持久化（§8.1 第 7 项，需 owner 批准）；`landingSpec` 中 `workspace` / `subscribe` / `templates` / `extract` / `review-writing` / `filter-panel` / `task-center` 仍为说明性文本而非服务端事实。 |
| D. 契约与页面均未动 | P-05 `pc/product-private`、`m/private` | `qualified_status` 只读派生投影已由 #14 暴露，但两页仍整页受限、未消费；`contactTodo` 写入面迁移待 owner 批准（§8.1 第 3 项）。 |
| E. 仍未改接或只部分接线 | P-01 `pc/architecture`、P-07 `pc/events` / `pc/macro` / `pc/industry`、P-09 `pc/reader`、P-12 `m/fund` | P-01 已接 `/api/health` 但未消费 `/ready` 的 7 项 checks；P-07 三页共用 `researchPage()`，仅显示「暂无可引用材料」空态；`pc/reader` 已显示片段页码但正文仍无来源；`m/fund` 列表仍为前端 4 条硬编码，`422` 专用文案未实现（#20 已注明属 `frontend-lead`）。 |

### 13.2 仍未达标的 H 类条目（6 组）

- **H-01** `pc/workspace`：`pageWorkspace()` 在无 `researchAnswer` 时已显示「当前无最近使用记录」空态，消息提醒改取 `activities[]`（无写入时「当前无消息提醒」）；**仍缺**：`research-plan` 结果页的「拆解步骤」没有服务端来源（`landingSpec` 只显示活动记录与「以服务端返回为准」的说明，无步骤数据、也无 E2E）。原「『已拆解 3 步』显示」表述**按代码事实撤回**（`public/app.js:907` 已改为不展示预置步数）。
- **H-02** `pc/candidates`：无候选仍为表体缺省行；「适配度」列仍渲染恒为 `—` 的 `p.match`；排序未消费 `candidateCalculation`；`score` 字段未产出。
- **H-03** `pc/compare` / `m/compare`：固定结论文案已不在代码中，但 `comparable` / `incomparable_reason` **仍未被前端消费**，口径切换仍只改行标签。
- **H-04** `pc/research`：重复提问无「已存在结果」提示；超范围问题无专门拒答文案。
- **H-05** `m/assistant`：多轮上下文仍只有 `lastAnswer` 单槽；澄清场景无入口。
- **H-06** `m/allocation`：`UNSUPPORTED_RULE` 与 `NEED_CONFIRMATION` 仍共用 `rule-confirmation` 结果页；`NEED_CONFIRMATION` 在表单恒有默认值时不可达；规则不匹配失败态无 E2E。

### 13.3 需要契约或其他 owner 批准 / 变更的项

1. `contactTodo` 从 `PATCH` 迁出（§8.1 第 3 项，**已批准 C-01**；19 → 18 + activity kind，按 §14.6 的原子 PR 落地）。
2. 写作草稿持久化（§8.1 第 7 项，**已批准 C-02**；7 → 8 命令 + 36 → 37 状态，按 §14.6 的原子 PR 落地）。
3. 保单与保障缺口数据来源（§8.1 第 6 项，需 `data` 新表 + seed、`contract` 定路由）。
4. 产品快照补字段：净值序列（区间收益/回撤多区间）、规模、持仓与行业分布、基金经理、费率结构、管理人字段——P-02 / P-03 的成功态依赖这些字段（新增只读投影字段，不新增状态 key）。
5. `diagnosis_explain` 证据包路径在真库下的 `NUMERIC` 归一（#18 描述自述为后续项，涉及 `ai-orchestration` owner）。
6. 候选排序的独立可复算 `score`（服务端 `candidateCalculation` 产出，前端消费）——涉及 `backend` 与 `frontend-lead`；**仍待裁决（E），未批准，不得实施**。
7. `/ready` 的 7 项 checks 前端消费（P-01 的「服务未就绪」失败态），需确认是 `contract` 还是 `frontend-lead` 范围。

### 13.4 E2E 覆盖仍缺的页面（基线 `5bcb1cc`，15 次运行）

> **已被 §15 取代（基线 `e4d8f49`）**：本节是波次 5 之前的快照，原文保留追溯；现行逐路由三态覆盖、计数与派工一律以 §15 为准。两者冲突时以 §15 为准。

现有 9 个用例只覆盖：页面契约标记与 `/ready`、会话创建与刷新恢复、409 版本冲突、证据不足 422、工作项写入与刷新恢复、未知操作 `not-implemented`、PC 闭环、手机闭环、撤销授权清理。**下列路由没有任何三态用例**：`pc/architecture`、`pc/supply`、`pc/product-fund`、`pc/product-insurance`、`pc/product-wealth`、`pc/product-deposit`、`pc/product-private`、`pc/candidates`、`pc/compare`、`pc/events`、`pc/macro`、`pc/industry`、`pc/library`、`pc/reader`、`pc/writing`、`pc/result`、`m/assistant`（多轮追问）、`m/fund`、`m/insurance`、`m/wealth`、`m/deposit`、`m/private`、`m/allocation`（规则不匹配失败态）、`m/holdings`、`m/candidates`、`m/compare`、`m/companion`、`m/result`。其余路由只在闭环用例的正常路径里被经过（`pc/workspace`、`pc/research`、`m/allocation` 匹配成功路径），**没有任何失败态或空态断言**。

### 13.5 是否继续后续波次的判断依据（事实，不给结论）

- 若目标是「主链路闭环」（口径 ①）：`9411ead` 上 30 / 30 与 E2E 15 / 15 已绿；`5bcb1cc` 的合并后门禁结论**待编排器确认**，未见新增失败证据。
- 若目标是「30 页逐页达标」（口径 ②）：仍为 `0 / 30` 页，需按 §13.1–§13.3 与 §15 补齐三态用例与数据源；**#18 只消除了 A 组的服务端阻塞，未产生任何达标页**。基线 `e4d8f49` 的实际覆盖为：完整三态 2 / 30（受控契约响应）、仅成功态 4 / 30、零独立三态 26 / 30，详见 §15.1。
- E 类（70 QPS、24 小时、多集群、四类任务各 5 次、统一评测集）、C/D 类（承诺书、行内集成、信创、专利）与真实模型 / 真实 Embedding 调用，**无论是否继续波次都不由 W1 判定**（§5.3、§11.1）。

## 14. 状态契约变更批准记录（C-01 / C-02，2026-11-06）

> **批准来源**：用户于 2026-11-06 明确批准下列两项方案，并由编排器会话 `ai_wealth-36` 转达本 Worker。基线为 `origin/main` = `e4d8f49`。本节是**批准记录与实现规格**，不是实现结果；在 §14.6 的原子 PR（含前置 `ci` PR 与共同 owner 登记）落地前，服务端行为仍以现行冻结集合为准，页面不得提前写入。
>
> **批准边界**：只批 C-01、C-02 两项。真实数据源接入（保单、合格投资者认定、产品扩展字段、事件/宏观/行业资讯）、W2、真实模型与多轮上下文**均不在本次批准范围**；不得借本次变更搭便车（§6 红线、§8.2 第 4 款）。

### 14.1 C-01：`contactTodo` 从 PATCH 迁到 `record_activity(kind='contact-request')`

**目标**：「联系客户经理」必须产生服务端可见记录（A11），且浏览器不能直接把一个布尔值写成「已联系待办」（A13 真实表达）。

**目标语义（实现规格）**

| 项 | 规格 |
|---|---|
| 触发 | `m/private` 的「联系客户经理」按钮；可携带可选 `title`（≤ 200 字符），不得携带客户事实、金额或时间戳 |
| 接口 | `POST /api/sessions/{id}/commands`，`command="record_activity"`，`input={kind:"contact-request", title?}`；沿用 `expected_version` + UUID `request_id` |
| 服务端权威 | 服务端生成 `activity_id` / `created_at` / `data_version`，追加到 `state.activities[]`，上限仍为 50；同一 `request_id` 重放返回首次结果，不重复追加 |
| 成功响应 | `{ session, result:{ status:"APPLIED", activity_id, kind:"contact-request", created_at, data_version }, api_version }`；页面只显示服务端返回值 |
| `contactTodo` 兼容字段 | 保留在 `defaultSessionState()` 的 36 个 key 中，但**从 PATCH 白名单移除**，改为**读时派生**：`contactTodo = activities.some(a => a.kind === 'contact-request')`。浏览器不可写；旧会话若存有 `true`，读取时以派生值为准（无需 DB 迁移） |
| 错误 | 通用 PATCH 携带 `contactTodo` → `400 VALIDATION_ERROR`（unknown field）；`kind` 不在白名单 → `400`；`expected_version` 过期 → `409 VERSION_CONFLICT`；`title` 超长 → `400` |
| 授权语义（已批准） | **仅 `kind='contact-request'` 豁免 `assertAuthorized()`**；其他 `record_activity` kind 与其他会话命令的授权前置不变。实现必须在 `sessionService.command()` 入口按 `command === 'record_activity' && input.kind === 'contact-request'` 精确分支，**不得**把豁免放在整个 `record_activity` 或所有命令上。未授权客户因此可发起联系请求，但读持仓/KYC 仍走原授权门禁。 |
| 撤权清理 | `activities` 已在 `downstreamReset()` 内，撤权即清空；派生 `contactTodo` 随之变 `false`，**不需要把 `contactTodo` 加入 reset**。若业务要求联系请求在撤权后仍保留，它必须脱离 `activities` 单独持久化，属新变更，不在本次批准内 |
| `submit_care` 既有副作用（必须处理） | 现行 `sessionService.submit_care` 在 patch 里写入 `contactTodo: true`。C-01 落地时必须**删除该写入**：`careSubmitted` 才是 submit_care 的权威状态；否则「存量 `true` + 读时派生覆盖」会造成写入与读取语义不一致，且会把「提交陪伴建议」误显示为「已联系客户经理」。若产品确实要求提交陪伴即等同联系请求，应改为由**服务端**追加一条 `contact-request` activity（不得恢复 PATCH 写入），并另立语义确认 |
| 页面 | `m/private` 读服务端 `activities` / 派生 `contactTodo`；成功显示 `activity_id` 与时间；失败显示真实错误码；无记录显示「尚未发起联系请求」空态 |

**为什么不是独立命令**：独立命令会把集合从 7 推到 8，而 C-02 也要用掉一个命令名额；本次批准明确「命令 7 不变」，故走既有 `record_activity` + 新 kind。**这也是 A11 与 §8.2「只读优先」的最小写入面**。

### 14.2 C-02：写作草稿持久化（`save_draft` + 服务端权威 `writingDrafts`）

**目标**：P-10 的草稿刷新后可回看（A11），且草稿 id、时间、来源请求都由服务端生成，浏览器不能伪造「已保存」。

**目标语义（实现规格）**

| 项 | 规格 |
|---|---|
| 命令 | 新增 `save_draft`（命令集合 7 → 8） |
| 请求 | `POST /api/sessions/{id}/commands`，`input={ content, source_request_id, title? }`；必须带 `expected_version` 与 UUID `request_id` |
| 字段约束 | `content` 为字符串，1–20000 字符（与 `lastAnswer.text` 上限一致）；`title` 可选，≤ 200 字符；`source_request_id` 必须是本会话 `ai_requests` 中**真实存在**的 `request_id`（服务端按 `session_id + request_id` 查表校验，**不读浏览器 PATCH 的 `aiRequests` 数组**） |
| 授权前置（已批准） | `save_draft` 要求 `authorized=true`（会话与客户快照同时为真），否则 `422 INSUFFICIENT_EVIDENCE`；与其他业务命令一致。W1 不为草稿提供未授权旁路。 |
| 状态 | `writingDrafts: []`（`defaultSessionState()` 36 → 37）；每项 `{ draft_id, title, content, source_request_id, created_at, updated_at, data_version }`；`draft_id` 由服务端生成（如 `draft-<uuid>`），客户端不得提交 |
| 上限与幂等 | 每会话最多 20 条；同 `request_id` 重放返回首次结果，不新增；`expected_version` 过期 → `409`；超上限 → `400`（不静默淘汰旧草稿） |
| 响应 | `{ session, result:{ status:"APPLIED", draft_id, created_at, data_version }, api_version }`；页面用返回值渲染，不自行生成 id/时间 |
| 错误 | 未授权 → `422 INSUFFICIENT_EVIDENCE`（已批准：`save_draft` 要求授权；未授权 422）；`source_request_id` 不存在或不属于本会话 → `400 VALIDATION_ERROR`；`content` 空或超长 → `400`；`writingDrafts` 经 PATCH 写入 → `400` |
| 撤权清理 | **必须清空**。草稿由 AI 基于授权持仓/研究材料生成，含客户专属内容与引用；撤权后仍可读会违反 A04 的下游失效语义。实现位置：`set_authorization` 撤权分支显式 `writingDrafts: []`（与现有 `diagnosis` / `lastAnswer` / `researchAnswer` 同处），**不加入 `downstreamReset()`**，以免 `generate_allocation` 或目标变更误清用户草稿（分析见 §14.4） |
| 目标变更 / 方案重生成（已批准） | **均不清空** `writingDrafts`；草稿是带 `created_at` 的历史产物，不声称代表当前目标。只有撤权清空。该语义必须在 `tests/unit/session-contract.test.js` 的行为测试中断言（目标变更与 `generate_allocation` 后草稿仍在） |
| 页面 | `pc/writing` 读取 `writingDrafts`：成功显示草稿 id/时间/来源请求；失败显示真实错误；空态「暂无已保存草稿」；刷新后仍在 |

### 14.3 冻结集合前后值（唯一权威表）

| 集合 | 变更前（`e4d8f49`） | C-01 后 | C-02 后（两项合并） | 说明 |
|---|---|---|---|---|
| `SESSION_PATCH_FIELDS` | **19** | **18**（移除 `contactTodo`） | **18**（不扩大） | `writingDrafts` 只能经 `save_draft` 写入，不进 PATCH |
| `ACTIVITY_KINDS` | **14** | **15**（新增 `contact-request`） | **15** | 仅新增一类；上限 50 不变 |
| `SESSION_COMMANDS` | **7** | **7** | **8**（新增 `save_draft`） | C-01 复用 `record_activity` |
| `defaultSessionState()` key | **36** | **36**（`contactTodo` 保留为只读派生字段） | **37**（新增 `writingDrafts`） | `contactTodo` 不删 key，避免旧会话读不到；改为不可写 |
| `downstreamReset()` key | **11** | **11** | **11** | C-02 的撤权清理走 `set_authorization` 显式清空，不扩 reset（见 §14.4） |
| `AI 结果投影` | 5 类（`lastAnswer`、`researchAnswer`、`diagnosis`、`ruleMatch`、`aiRequests`） | 不变 | 不变 | 草稿是独立服务端对象，不是浏览器投影 |

> **一致性要求**：`docs/api-contract.md`、`tests/unit/session-contract.test.js`、`tests/unit/activities.test.js` 与上表必须逐数字一致；`tests/unit/session-contract.test.js` 的测试标题也须同步（如「19 fields」→「18 fields」、「36 keys」→「37 keys」、「7 commands」→「8 commands」）。**测试标题与实际断言不一致本身即视为未完成**。`tests/unit/frozen-set-regression.test.js` 是第二份冻结快照，但**当前不在 #28 的共同 owner 内**，其 owner 缺口见 §14.6.7 / §16-H；在 H 解决前，原子 PR 无法同时更新它，因此**不得宣称原子 PR 已可全绿**。

### 14.4 撤权清理与 `downstreamReset` 分析（安全语义不得省略）

| 变更 | 是否必须同步撤权清理 | 结论与理由 |
|---|---|---|
| C-01 `contact-request` | 是，但**不改 `downstreamReset`** | `activities` 已在 `downstreamReset()` 的 11 个 key 内；`contactTodo` 改为读时派生后，撤权清空 `activities` 即让 `contactTodo=false`。若把 `contactTodo` 单独留在 reset 外并保持可写，撤权后可继续显示「已联系客户经理」，属伪造服务状态，**禁止**。 |
| C-02 `writingDrafts`（已批准） | **是，必须显式清空** | 草稿含客户专属内容与引用，属「基于授权数据的下游产物」。撤权后仍可读会让已撤销授权的客户数据继续可见，违反 A04 与 §6 红线。**不能**因为「草稿是用户自己写的」就豁免：草稿正文由 `writing_draft` 生成，含持仓/研究材料。**已批准语义：仅撤权清空；目标变更与方案重生成均保留。** |
| 为什么不是 `11 → 12` | —— | `downstreamReset()` 同时被「目标变更」与「重新生成方案」调用。把 `writingDrafts` 放进去会在用户仅调整目标或重新生成配置时**误删历史草稿**，这不是安全要求，而是可用性回归。因此把清理放在 `set_authorization` 的撤权分支，与 `diagnosis` / `lastAnswer` / `researchAnswer` 的既有显式清理同处；`downstreamReset` 保持 11，断言仍锁 11。 |
| 测试必须覆盖（A/B/C 已批准口径） | —— | ① `contact-request` 仅该 kind 豁免授权，其他命令/其他 kind 仍 422；② 撤权后 `writingDrafts=[]`（单测 + 后续 E2E）；③ 撤权后 `contactTodo` 派生为 `false`；④ 目标变更后 `writingDrafts` **仍在**；⑤ 重新生成方案后草稿仍在；⑥ `save_draft` 未授权 422。六条缺一不可。 |
| 其他下游 | 不变 | `plan` / `candidates` / `compareSet` / `compareSaved` / `careSubmitted` / `remindCreated` / `researchUsedInCandidates` / `selectPoolSynced` / `ruleMatch` / `candidateCalculation` / `activities` 的既有清理语义不变。 |

### 14.5 不在本次批准范围（明确排除，防止搭便车）

1. **多轮对话上下文持久化（D）**：需要新增会话字段或命令，属新契约变更；**仍待裁决，未批准，不得实施**（§16-D）。
2. **候选独立可复算 `score`（E）**：属服务端 `candidateCalculation` 字段扩展 + 前端消费；**仍待裁决，未批准，不得实施**；即使后续认为可独立推进，也必须先取得明确裁决，不得写入「已批准」（§16-E）。
3. **真实数据源（F）**：保单表、`customer.qualified` 认定来源、产品净值序列/规模/持仓分布/管理人、事件/宏观/行业资讯——均属 W2 或数据波次，**本次不启动**（§15.5 明确其页面只能做受控响应三态或真实无来源空态）。
4. **真实模型与真实 Embedding**：仍为 `AI_MODE=fixture`，草稿与引用的内容质量不由 W1 判定。
5. **`downstreamReset` 扩容到 12**：本记录明确不需要；若实现者认为必须，须回到 §8.1 重新批准。
6. **共同 owner 登记本身**：由 `#28` 完成（3 条精确路径），本 docs PR **不修改** `scripts/ci/check-ownership.mjs` 或 `tests/unit/ownership.test.js`；等待 #28 合并后同步 main。**`frozen-set-regression.test.js` 的 owner 缺口见 §16-H**，不得自行扩 owner。本 PR 也不改任何 CI workflow、分支保护或 required check。
7. **A/B/C 已由用户裁决**：A 仅 contact-request 豁免授权；B `save_draft` 要求 `authorized=true`；C 草稿仅撤权清空。三项不再属待裁决，按 §14.1 / §14.2 / §14.4 实施。

### 14.6 原子契约变更的文件清单与共同 owner 现状（依据 #28）

> **2026-11-08 修正**：`#28` 已在 `OWNERSHIP` 中登记 **3 条精确共同 owner**（`docs/api-contract.md`、`tests/unit/session-contract.test.js`、`tests/unit/activities.test.js`），当前 OPEN、head `08501a7`、CI 全绿，**等待合并**。本节据此改写：原子 PR 只能使用这 3 条，**不再提出或扩大 owner**；此前「7 文件共同 owner」提案作废。**仍有一个 #28 未覆盖的冻结测试缺口**（`tests/unit/frozen-set-regression.test.js`），列为 §16-H 阻塞，**不得自行扩 owner 绕过**。本 docs PR 不改 CI、测试或代码。

#### 14.6.1 为什么不是 stacked（保留分析，stacked 方案作废）

| 尝试 | 结果 |
|---|---|
| 把契约代码单独作为一环 | 删 `contactTodo` / 改集合的同一提交会让 `session-contract.test.js`（及 `frozen-set-regression.test.js`）立即断言失败；`ci-unit-api` 红 |
| 把冻结测试放到下一环 | 第一环红；且「先改代码、后补断言」违反 §8.2「集合断言失败即未获批准」 |
| 把文档放到另一环 | `docs/api-contract.md` 与代码/测试在中间态不一致，违背原子性 |
| 攒到一个功能分支再合并 | 最终 PR 对 `main` 的 diff 跨 `docs` / `src` / `tests`，`ci-ownership` 必红；用 `baseline` 或改规则绕过均被禁止 |
| **结论** | **每项变更一个原子 PR**；跨 owner 只依赖 `#28` 已登记的 3 条精确路径；未被 `#28` 覆盖的测试/前端不塞进该 PR，按 §14.6.6 / §14.6.7 处理 |

#### 14.6.2 C-01 原子文件清单（按 #28 的 3 条 owner）

| 文件 | 现 owner | 是否在原子 PR | 改动 |
|---|---|---|---|
| `src/components/sessions/domain/session.js` | `contract` | 是 | PATCH 移除 `contactTodo`；`ACTIVITY_KINDS` 增 `contact-request` |
| `src/components/sessions/application/sessionService.js` | `contract` | 是 | `record_activity` 的 `contact-request` 分支（**仅该 kind 豁免 `assertAuthorized`**）；读路径统一派生 `contactTodo`；**删除 `submit_care` 的 `contactTodo: true`** |
| `docs/api-contract.md` | `docs` + `contract`（#28） | 是 | 18/15 集合、命令语义、`submit_care` 说明、A 的授权语义 |
| `tests/unit/session-contract.test.js` | `test-unit` + `contract`（#28） | 是 | 18 PATCH / 15 kind；`contactTodo` 离白名单断言 |
| `tests/unit/activities.test.js` | `test-unit` + `contract`（#28） | 是 | `contact-request` 的成功/幂等/未知 kind/PATCH 拒绝/派生/撤权清零/授权豁免边界（**新增测试写入此文件，不新建 tests/unit 文件**） |
| `tests/unit/frozen-set-regression.test.js` | `test-unit` | **否（阻塞）** | 硬编码 19/7/36/11；C-01 改 19 → 必须同步，但 contract 无权限 → §16-H |
| `public/actions/flow.js` | `frontend-flow` | **否** | 用 §14.6.6 的三步兼容序列，避免旧 `m-contact` 在原子 PR 合并后立刻 400 |
| `tests/integration/w1-flow.test.js` | `test-db` | **否** | 撤权的 DB 级断言由后续 test-db PR 追加；原子 PR 在 `activities.test.js` / `session-contract.test.js` 做服务层断言 |
| `src/fixtures/demoData.js`、`src/interfaces/http/controllers.js`、`public/session-sync.js`、`db/` | 各 owner | **否（无需改）** | 已核对：`contactTodo` key 保留、命令通用透传、`applyRecord` 整体 patch；无 schema/迁移 |

#### 14.6.3 C-02 原子文件清单（按 #28 的 3 条 owner）

| 文件 | 现 owner | 是否在原子 PR | 改动 |
|---|---|---|---|
| `src/components/sessions/domain/session.js` | `contract` | 是 | 命令增 `save_draft`；`validateSessionState` 校验 `writingDrafts` |
| `src/components/sessions/application/sessionService.js` | `contract` | 是 | `save_draft` 分支（`authorized=true` 前置、`source_request_id` 查 `ai_requests`、幂等、20 条上限、409）；撤权分支显式 `writingDrafts: []` |
| `src/fixtures/demoData.js` | `contract` | 是 | `writingDrafts: []`（36 → 37） |
| `public/demo-data.js` | `contract` | 是 | `initial()` 增 `writingDrafts: []`（同步前投影） |
| `docs/api-contract.md` | `docs` + `contract`（#28） | 是 | 8 命令 / 37 key、输入/校验/错误、B/C 语义 |
| `tests/unit/session-contract.test.js` | `test-unit` + `contract`（#28） | 是 | 8 命令 / 37 key、`writingDrafts` 形状；**`save_draft` 的幂等/来源校验/上限/未授权 422/撤权清空/目标变更不清空行为测试也写在此文件**（#28 下唯一可用的共享 unit 文件；只增测试块，不改原锁的语义） |
| `tests/unit/frozen-set-regression.test.js` | `test-unit` | **否（阻塞）** | 硬编码 7/36；C-02 改两者 → 必须同步，但 contract 无权限 → §16-H |
| `tests/integration/w1-flow.test.js` | `test-db` | **否** | 草稿落库/刷新/撤权清空的 DB 断言由后续 test-db PR 追加 |
| `public/app.js`、`public/actions/research.js`、`tests/e2e/*` | `frontend-lead` / `test-e2e` | **否** | `save_draft` 是纯新增写入，旧前端不调用也不会坏；页面保存/回看与三态属后续 PR |
| `db/`、`db/seeds/001_demo.sql` | `data` | **否（无需改）** | 状态存 `app_sessions.state_json`，无 schema/seed 变更 |

#### 14.6.4 #28 已登记的共同 owner（唯一允许集合）

| 路径 | owners | 状态 | 用途 |
|---|---|---|---|
| `docs/api-contract.md` | `docs`、`contract` | #28 已登记 | 契约表与实现/测试同 PR |
| `tests/unit/session-contract.test.js` | `test-unit`、`contract` | #28 已登记 | 冻结集合断言 |
| `tests/unit/activities.test.js` | `test-unit`、`contract` | #28 已登记 | `record_activity` kind 与行为 |

**明确不新增**（与 #28 的范围一致）：不把 `docs/`、`tests/` 整体加给 `contract`；不加 `tests/unit/frozen-set-regression.test.js`、`tests/integration/w1-flow.test.js`、`tests/e2e/*`、`public/actions/flow.js`、`public/app.js`；不加 `baseline`；不改 `AGENTS`；不用 `CHANGED_FILES` 环境变量；不跳过 `ci-ownership`。若实施中发现还缺一个**确属契约**的文件，只能走 §16-H 的显式裁决，**不得在原子 PR 里临时扩 owner**。

#### 14.6.5 #28 前置与同步步骤

1. **#28 合并前**：C-01/C-02 原子 PR 不应开始合并；#28 当前 head `08501a7`，3 条 owner，6 job + `ci-merge-gate` 全绿、`mergeStateStatus=CLEAN`。
2. **#28 合并后**：`git fetch origin`，把最新 `origin/main` 合入本 PR 分支（普通 merge，不 rebase 共享历史、不 force-push），确认 `scripts/ci/check-ownership.mjs` 含 3 条；再重跑本 PR 的 6 job + `ci-merge-gate`。
3. **原子 PR 分支**：`ao/contract/<topic>`；`ci-ownership` 将允许 `src/components/sessions/` + 上述 3 个文件；仍会拒绝 `public/app.js`、`tests/e2e/*`、`docs/architecture.md`、其他 `tests/**`（#28 描述已本地演练）。
4. **本 docs PR 的边界**：只改两份 docs；不改 `scripts/ci/check-ownership.mjs`、`tests/unit/ownership.test.js`、workflow、分支保护或 required check。

#### 14.6.6 C-01 的前端切换（`flow.js` 不在 #28，必须用兼容序列）

`public/actions/flow.js` 属 `frontend-flow`，不在 #28 的 3 条内，**不能进原子 PR**；但删 PATCH 后旧 `m-contact` 会立即 400，因此按以下三步落地（不扩 owner）：

1. **前置 frontend-flow PR**：`m-contact` 优先调 `record_activity(contact-request)`；若服务端返回 400（旧服务端不认识该 kind），回退到 `PATCH contactTodo`。对旧服务端绿，对新契约也能工作。
2. **contract 原子 PR**：删 PATCH、加命令，同步 docs 与两个 co-owned 测试；此时 `m-contact` 已走命令，PATCH 回退路径成为死代码。
3. **frontend-flow 清理 PR**：删除回退分支与过时文案；此后 `contactTodo` 只由 `activities[]` 派生。

> 代价：第 1 步到第 2 步之间存在一个短暂的双路径窗口（旧 PATCH 仍可用），但**不会出现 main 坏掉**；第 2 步后 PATCH 被服务端拒绝，命令是唯一写入路径。若评审更希望单 PR 原子切换，唯一合法方式是显式批准把 `public/actions/flow.js` 加入 #28 的精确 owner——**本次指令不允许扩 owner，故不采用**。

#### 14.6.7 冻结测试缺口（阻塞，§16-H）

`tests/unit/frozen-set-regression.test.js` 直接 import 领域常量并硬编码 **19 PATCH / 7 命令 / 36 key / 11 reset**：

- C-01 改 PATCH 19 → 18，该文件 `SESSION_PATCH_FIELDS` 与 `size === 19` 必红；
- C-02 改命令 7 → 8、状态 36 → 37，该文件对应断言必红；
- 该文件当前 owner 仅 `test-unit`，`contract` 无权编辑；原子 PR 若带上它，`ci-ownership` 必红。

**可选处置（需 §16-H 裁决）**：

| 方案 | 做法 | 评价 |
|---|---|---|
| A（推荐） | 在 #28 中再增一条精确路径 `['tests/unit/frozen-set-regression.test.js', ['test-unit','contract']]` | 只加一个确属契约的冻结测试文件，不扩目录，能真正让原子 PR 全绿 |
| B | test-unit 先把该文件的断言并入 `session-contract.test.js` 并删除旧文件 | 会减少一份独立回归锁，**不推荐**；且仍是跨 PR 协调 |
| C | 在原子 PR 中跳过/删除该测试 | **禁止**：违反「不弱化断言」，且等同于绕过冻结锁 |

> 在 H 解决前，**C-01/C-02 原子 PR 不应合并**；本文不把「原子 PR 已可全绿」写成事实。

#### 14.6.8 排期与验收（更新）

- **顺序**：`#28` 合并 →（若 H 采用 A）`#28` 增补/另开 ci PR → 本 PR #29 同步 main → C-01 前置 frontend-flow 兼容 PR → C-01 原子 PR → C-02 原子 PR → frontend-flow 清理 → test-db（w1-flow）与 test-e2e 三态 PR。
- **集合**：C-01 后 18/15/7/36/11；C-02 叠加后 18/15/8/37/11。
- **原子 PR 必须绿**：6 job + `ci-merge-gate`；`node --check`、`npm test`、`W1_DB_SMOKE=true npm run test:integration`、`npm run test:e2e`；docs 与两份 co-owned 测试、§14.3 数字逐项一致。
- **禁止**：为了让原子 PR 变绿而扩 owner、删/跳过 frozen-set 断言、把 DB/前端/E2E 塞进原子 PR、使用 `baseline`。

## 15. 30 / 30 运行路由 × 成功 / 失败 / 空态覆盖矩阵（基线 `e4d8f49`）

> **矩阵口径**：S = 成功态、F = 失败态、E = 空态。每个格只认**该页面自身的独立断言**；「主链路用例经过该页」不算三态覆盖（用户明确要求不得以主链路代替）。「受控契约」表示用 `page.route` 注入服务端真实结构的响应；「真实空态」表示不改响应、由真实无来源/无数据触发。
>
> **允许的做法**：缺真实数据源的页面，可用**受控契约响应**验证 UI 三态，并用**真实无来源**验证空态；**不得**因此宣称真实业务数据验收通过（§15.5）。
>
> **不允许的做法**：为了让测试变绿而删断言、放宽断言、把失败态改成成功态、用 `test.fixme`/`skip` 掩盖生产缺陷；发现生产缺陷一律记入 §15.3 修复项，测试保持对**目标行为**的断言。

### 15.1 覆盖计数（按 main `e4d8f49` 代码事实重算）

| 口径 | 数量 | 路由 |
|---|---|---|
| 运行路由总数 | **30** | 18 PC + 12 手机（`pc/result`、`m/result` 各算 1） |
| 成功态具备独立断言（含下列三态齐备的 2 页） | **4 / 30** | `pc/architecture`（P-01）、`m/holdings`（P-15）、`pc/product-deposit`、`m/deposit`（P-04） |
| 其中：三态都具备独立断言 | **2 / 30** | `pc/product-deposit`、`m/deposit`（`three-state.spec.js`，受控契约响应 + 真实快照空态） |
| 失败态具备独立断言 | **2 / 30** | `pc/product-deposit`、`m/deposit`（400 契约错误） |
| 空态具备独立断言 | **2 / 30** | `pc/product-deposit`、`m/deposit`（快照无挂牌利率） |
| 零独立三态断言 | **26 / 30** | 其余全部：**11 条只在闭环/工作项用例的正常路径被经过** + **15 条从未被任何 E2E 打开** |
| 仅主链路经过（不算三态） | **11 / 30** | `pc/candidates`、`pc/compare`、`pc/research`、`pc/result`、`m/assistant`、`m/fund`、`m/allocation`、`m/candidates`、`m/compare`、`m/companion`、`m/result` |
| 从未被任何 E2E 打开 | **15 / 30** | `pc/workspace`、`pc/product-fund`、`pc/product-insurance`、`pc/product-wealth`、`pc/product-private`、`pc/supply`、`pc/events`、`pc/macro`、`pc/industry`、`pc/library`、`pc/reader`、`pc/writing`、`m/insurance`、`m/wealth`、`m/private` |
| 真实业务数据验收达标 | **0 / 30** | 受控契约响应只证明 UI 与服务端契约的映射，不构成真实数据验收 |

> 核对：4（成功独立）+ 26（零三态）= 30；26 = 11（主链路）+ 15（从未打开）。逐行以 §15.2 的「当前覆盖」列为准。

### 15.2 逐路由矩阵

| # | 路由 | 当前覆盖（S / F / E） | 目标可见行为（S / F / E） | 服务端接口 / 状态 | 所需生产修复 | 测试归属 | 缺真实数据源 |
|---|---|---|---|---|---|---|---|
| 1 | `pc/architecture` | S：有（独立，受控契约）；F：无；E：无 | S：`api_version`、`dependencies` 就绪状态、`AI_MODE=fixture` 可见，无默认 KPI；F：`/api/health` 不可达 → 「共享应用服务未连接」，不显示默认数字；E：无待处理事项 → 「当前无待处理事项」 | `GET /api/health`（`dependencies.*`）；`GET /ready`（7 项 checks，**页面尚未消费**） | F-10：消费 `/ready` 并补 F/E 渲染 | `test-e2e`（三态）+ `test-unit`（health 结构） | 否 |
| 2 | `pc/workspace` | S：无（从未打开）；F：无；E：无 | S：`researchAnswer` 卡片 + `activities[]` 记录；F：会话/数据加载失败 →「共享数据加载失败」；E：无最近使用/无提醒 → 显式空态 | `GET /api/demo-data`、`GET /api/sessions/:id`、`record_activity` | 无（#24 已收口）；仅补断言 | `test-e2e` | 否 |
| 3 | `pc/product-fund` | S：无；F：无；E：无 | S：产品卡片/费率/近一年收益/回撤/可售/来源/时点来自 `products[]`；F：`GET /api/demo-data` 失败 →「共享数据加载失败」+错误码；E：近三年/成立以来无序列 →「该区间暂无数据」 | `GET /api/demo-data`；`POST /api/ai/generate`（`product_explain`） | 无生产缺陷；三态断言待补 | `test-e2e` | **是**（净值序列、规模、持仓与行业分布、基金经理、费率结构） |
| 4 | `pc/product-insurance` | S：无；F：无；E：无 | S：产品行/事实/可售状态来自快照；F：快照失败 → 共享数据加载失败；E：保单板块无来源 →「未授权或暂无可展示保单」 | `GET /api/demo-data`；只读 `insurance_coverage` 投影 | 无生产缺陷；三态断言待补 | `test-e2e` | **是**（保单/理赔记录） |
| 5 | `pc/product-wealth` | S：无；F：无；E：无 | S：产品行/可售状态来自快照；F：快照失败；E：管理人字段/审计信息无来源 →「暂未由服务端提供的字段」 | `GET /api/demo-data` | 无生产缺陷 | `test-e2e` | **是**（管理人注册资本/在管规模/审计） |
| 6 | `pc/product-deposit` | **S/F/E：全有**（独立断言，受控契约 + 真实空态） | S：本息/利息/公式/`calculation_id`/规则版本来自端点；F：400 →「服务端错误 VALIDATION_ERROR」+消息，不显示金额；E：快照无挂牌利率 →「该期限暂无挂牌利率」 | `GET /api/demo-data`；`GET /api/calculations/deposit` | F-04：本金/期限仍固定 500000/3 年，逐期限空态未实现；真库端到端页面成功态未跑 | `test-e2e` + `test-unit`（单位矩阵） | 否 |
| 7 | `pc/product-private` | S：无；F：无；E：无 | S：`qualified_status=QUALIFIED` → 展示 `restricted_products` 事实；F：未认定/投影不可用 → 明确拒绝，不返回部分内容；E：无受限产品 →「当前无受限产品」 | `readonly_projections.qualified_status`（`GET /api/demo-data` 或独立只读响应）；`GET /api/demo-data` | F-05：页面整页受限、完全未消费投影 | `test-e2e` | **是**（`customer.qualified` 认定来源） |
| 8 | `pc/candidates` | S：仅主链路（生成后状态检查）；F：无；E：无 | S：候选行 + `reasons[]`/`constraints`/`holding_months`；F：`generate_candidates` 409/422 → `action-error` 真实错误；E：无候选 → 引导空态（去配置页） | 命令 `generate_candidates`；`candidateCalculation`；`POST /api/ai/generate`（`candidate_explain`） | F-08b：无独立可复算 `score`；F/E 断言待补 | `test-e2e` + `test-unit`（候选计算） | 否 |
| 9 | `pc/compare` | S：仅主链路（保存）；F：无；E：无 | S：表格 + `comparable`/`incomparable_reason`/`comparison_basis`；F：`save_comparison` 400/409 → 真实错误；E：比较集为空 → 引导空态 | 命令 `save_comparison`；`PATCH compareSet`；`GET /api/demo-data` | 无（#24 已消费口径）；F/E 断言待补 | `test-e2e` + `test-unit`（2–3 个边界） | 否 |
| 10 | `pc/supply` | S：无；F：无；E：无 | S：产品行作为供给单元，带 `product:<id>`/来源/时点/可售；F：快照失败 →「供给目录加载失败」；E：资讯/策略/行业无来源 →「当前分类暂无已审核供给」 | `GET /api/demo-data`；`record_activity`（`new-supply`） | 无生产缺陷 | `test-e2e` | **是**（资讯/策略/行业观点供给） |
| 11 | `pc/research` | S：仅主链路；F：无；E：无 | S：`researchAnswer` + 引用（标题+页码）+ 时延/模型；F：422/503 → `ai-error` 或超范围拒答；E：空问题 → `prompt-needed` | `POST /api/ai/generate`（`research_qa`） | 无（#24 已补提示/拒答）；F/E 断言待补 | `test-e2e` + `test-unit`（引用白名单） | 否 |
| 12 | `pc/events` | S：无；F：无；E：无 | S：有事件片段时按知识片段渲染并标时点；F：`GET /api/knowledge` 失败 → 真实错误；E：无事件片段 →「暂无可引用材料」 | `GET /api/knowledge`；`research_qa`（`events` 片段缺失） | 无（空态为真实结果） | `test-e2e` | **是**（事件源/片段） |
| 13 | `pc/macro` | S：无；F：无；E：无 | S：有宏观指标时渲染指标+时点；F：知识/数据接口失败；E：无指标序列 → 空态 | `GET /api/knowledge`；`research_qa` | 无（当前无指标来源，空态正确） | `test-e2e` | **是**（宏观 8 指标序列） |
| 14 | `pc/industry` | S：无；F：无；E：无 | S：有行业片段时渲染；F：接口失败；E：无片段 → 空态 | `GET /api/knowledge`；`research_qa` | 无 | `test-e2e` | **是**（行业数据/研报） |
| 15 | `pc/library` | S：无；F：无；E：无 | S：产品卡片 + `knowledge_version` + 片段数；F：`/api/demo-data` 或 `/api/knowledge` 失败 →「共享数据加载失败」；E：无知识版本 →「暂无已发布产品知识」 | `GET /api/demo-data`；`GET /api/knowledge` | 无生产缺陷 | `test-e2e` | **部分**（观点资产/审核状态） |
| 16 | `pc/reader` | S：无；F：无；E：无 | S：文档/片段 `title`+`page`+`source_id`，摘要带 `document_id`；F：422/400 → 真实错误；E：无 ACTIVE 知识 →「暂无已发布报告」 | `GET /api/knowledge`；`POST /api/ai/generate`（`report_summary`） | 无生产缺陷（#24 已补页码） | `test-e2e` + `test-unit`（缺 `document_id` 拒绝） | 否（扫描件 OCR 后置） |
| 17 | `pc/writing` | S：无；F：无；E：无 | S：草稿保存后显示服务端 `draft_id`/时间/来源请求，刷新可回看；F：`save_draft` 400/409/422 → 真实错误；E：无草稿 →「暂无已保存草稿」 | 命令 `save_draft`（C-02，待实现）；`writing_draft` | F-06：草稿不持久（C-02 未落地） | `test-e2e` + `test-unit`（新增 writing-drafts） | 否 |
| 18 | `pc/result` | S：仅主链路（保存后 landing）；F：无；E：无 | S：只显示服务端 `activities[]`/`aiResult` 记录；F：`action-error` 真实错误码；E：`not-implemented` / 「尚未写入服务端记录」 | `record_activity`；`landingSpec` | 无（#24 已清理）；F/E 断言待补 | `test-e2e` | 否 |
| 19 | `m/assistant` | S：仅主链路；F：无；E：无 | S：`assistant_qa` 回答 + 引用 + fixture 标注；F：422/503 → `ai-error`；E：空问题 → `prompt-needed` | `POST /api/ai/generate`（`assistant_qa`）；`lastAnswer` | F-07：多轮上下文仅 `lastAnswer` 单槽（需新契约，未批准） | `test-e2e` | 否 |
| 20 | `m/fund` | S：仅主链路（work-items 的 `mobile-search`）；F：无；E：无 | S：列表与产品事实来自 `products[]`；F：无持仓诊断 422 →「当前客户无该产品持仓，无法生成诊断」；E：分类无产品 →「该分类暂无产品」 | `GET /api/demo-data`；`POST /api/ai/generate`（`diagnosis_explain`） | F-02：422 专用文案不可达（`runRealAiTask` 吞错）；F-08a：列表仍 4 条硬编码 | `test-e2e` | 否 |
| 21 | `m/insurance` | S：无；F：无；E：无 | S：按被点击产品渲染保险事实（非保单）+ 可售/来源；F：`insurance_coverage` 不可用 → 真实错误/未授权；E：无保单来源 →「未授权或暂无可展示保单」 | `GET /api/demo-data`；`readonly_projections.insurance_coverage` | F-03：`m-policy` 无页面入口；保障缺口/覆盖度仍无计算来源 | `test-e2e` | **是**（保单/缺口/待办） |
| 22 | `m/wealth` | S：无；F：无；E：无 | S：产品卡 + `sale_status` 徽章；F：快照失败 → 共享数据加载失败；E：分类无产品 →「当前视图暂无产品」 | `GET /api/demo-data` | 无生产缺陷 | `test-e2e` | 否 |
| 23 | `m/deposit` | **S/F/E：全有**（独立断言） | S：本息/利息/`calculation_id` 来自端点；F：400 → 真实错误、不显示金额；E：无挂牌利率 →「该期限暂无挂牌利率」 | `GET /api/demo-data`；`GET /api/calculations/deposit` | F-04：本金/期限固定；真库端到端未跑 | `test-e2e` | 否 |
| 24 | `m/private` | S：无；F：无；E：无 | S：已认定 → `restricted_products`；F：未认定 → 明确拒绝；E：无受限产品 →「当前无受限产品」；联系成功显示 `activity_id` | `qualified_status`；命令 `record_activity(contact-request)`（C-01，待实现） | F-05 + C-01：页面未消费投影、`m-contact` 仍 PATCH | `test-e2e` + `test-unit`（activities） | **是**（认定来源） |
| 25 | `m/allocation` | S：仅主链路（正常生成 + 撤权）；F：无；E：无 | S：`MATCHED` → 方案+候选；F：`UNSUPPORTED_RULE` →「没有匹配的配置规则」独立页，不覆盖旧方案；E：缺字段 → `NEED_CONFIRMATION` 且文案对应 `missing_fields` | `POST /api/ai/generate`（`rule_match`）；命令 `generate_allocation`、`generate_candidates`、`set_authorization` | F-01：`flow.js` 对所有非 `MATCHED` 都开 `rule-confirmation`，`rule-unsupported` 页面不可达；`NEED_CONFIRMATION` 仍不可达 | `test-e2e` + `test-unit`（三类状态映射） | 否 |
| 26 | `m/holdings` | S：有（独立）；F：无；E：无 | S：双分母集中度 + `estimated` 收益 + `calculation_id`；F：400/503 →「服务端计算失败」+错误码；E：`available=false` →「暂无持仓/未授权」，不显示 0 元 | `GET /api/calculations/portfolio` | 无生产缺陷；F/E 断言待补 | `test-e2e` + `test-unit`（复算） | 否 |
| 27 | `m/candidates` | S：仅主链路；F：无；E：无 | S：排序/约束取 `reasons[]`；F：`candidate_explain` 422 → 真实错误；E：无候选 → 引导空态 | 命令 `generate_candidates`；`candidateCalculation`；`candidate_explain` | F-08b：`score` 缺失；F/E 断言待补 | `test-e2e` | 否 |
| 28 | `m/compare` | S：仅主链路；F：无；E：无 | S：表格 + 不可排名说明；F：`save_comparison` 400/409；E：比较集空 → 空态 | 命令 `save_comparison`；`PATCH compareSet` | 无（#24 已消费可比性） | `test-e2e` | 否 |
| 29 | `m/companion` | S：仅主链路；F：无；E：无 | S：复盘数字来自持仓投影并标「估算」；F：`submit_care` 409 →「请先保存有效产品比较」；E：无方案 →「尚未关联配置方案」 | `GET /api/calculations/portfolio`；命令 `submit_care`、`create_reminder` | F-09：目标完成度无服务端字段；`m-event` 仍为固定文本（含虚构「权益暴露 20%」） | `test-e2e` + `test-unit`（409） | **部分**（目标完成度/事件） |
| 30 | `m/result` | S：仅主链路；F：无；E：无 | S：服务端记录或 `aiResult`；F：`action-error`；E：`not-implemented` | `record_activity`；`landingSpec` | 无 | `test-e2e` | 否 |

**矩阵合计核对**：30 行覆盖 18 PC + 12 手机。按「缺真实数据源」列统计：**「是」10 行**（`pc/product-fund`、`pc/product-insurance`、`pc/product-wealth`、`pc/product-private`、`pc/supply`、`pc/events`、`pc/macro`、`pc/industry`、`m/insurance`、`m/private`）、**「部分」2 行**（`pc/library`、`m/companion`）、**「否」18 行**。**这与「30 页都可做受控响应三态」并不矛盾**：缺数据源的页面仍可用受控契约响应验证 UI 与服务端契约，但真实业务数据验收为 **0 / 30**。

### 15.3 生产缺陷 / 修复项（发现即登记，测试不得弱化）

| 编号 | 页面 | 缺陷（代码事实） | 必须的修复 | Owner |
|---|---|---|---|---|
| F-01 | `m/allocation` | `public/actions/flow.js` 的 `m-generate-allocation` 对 `result.status !== 'MATCHED'` 一律 `openLanding('rule-confirmation')`；`public/app.js:1084` 的 `rule-unsupported` 规格没有任何调用方，属死代码。H-06 的「规则不匹配独立失败页」实际不可达 | 按 `result.status` 分支：`UNSUPPORTED_RULE` → `rule-unsupported`，`NEED_CONFIRMATION` → `rule-confirmation`；并补 E2E | `frontend-flow` |
| F-02 | `m/fund` | `runRealAiTask()`（`public/app.js`）自行 `catch` 所有错误并统一 `openLanding('ai-error')`，P-12 的「当前客户无该产品持仓，无法生成诊断」分支不可达（#20 已在 PR 描述中登记） | 把真实 `error.code` 下推给调用方或让 `diagnosis` 分支自行渲染 422 专用失败态；不得改成通用成功 | `frontend-lead` |
| F-03 | `m/insurance` | `m-policy` 动作已在 `diagnosis.js` 注册，但 `public/app.js` 内**没有任何元素带 `data-action="m-policy"`**；保障缺口/覆盖度仍无计算来源 | 提供可见入口并接 `insurance_coverage`；缺口无来源时显式空态（不得回填 72% / ¥4,000,000） | `frontend-lead`（+`data` 数据源） |
| F-04 | `pc/product-deposit`、`m/deposit` | 测算输入固定为 500000 / 3 年；逐期限「该期限暂无挂牌利率」分支未实现；真库页面成功态未做过一次端到端 | 期限/本金可选、逐期限空态；在真库跑一次页面成功态并留证 | `frontend-lead` |
| F-05 | `pc/product-private`、`m/private` | 两页仍整页受限；`qualifiedStatus` / `restrictedProducts` 只存在于只读投影，页面从未消费（`grep qualified` 仅命中 `public/demo-data.js` 的本地默认态） | 消费 `qualified_status` / `restricted_products`；三态（已认定/未认定/无受限产品）；`contactTodo` 改 C-01 | `frontend-lead`（+`data` 认定来源） |
| F-06 | `pc/writing` | 无 `writingDrafts`、无 `save_draft`；草稿只在结果页显示，回页即消失 | 按 C-02 落地 | `contract` + `frontend-lead` + `test-unit` |
| F-07 | `m/assistant` | 多轮上下文只有 `lastAnswer` 单槽；无服务端上下文/澄清状态 | 需新增契约（待裁决 D，未批准），见 §16-D | `contract`（待批准） |
| F-08a | `m/fund` | 列表仍为前端 4 条硬编码，`product_id` 无法从服务端映射 | 列表改 `GET /api/demo-data`；不可诊断产品标「无持仓不可诊断」或禁用 | `frontend-lead` |
| F-08b | `pc/candidates`、`m/candidates` | `candidateCalculation` 无独立可复算 `score`；前端以 `reasons[]` 顺序代替排序值 | 服务端产出 `score` 并由页面消费 | `backend` + `frontend-lead` |
| F-09 | `m/companion` | `m-event` 仍为固定文本「A500 本周波动上升 / 权益暴露 20%」，属虚构事实（A13）；「目标完成度」无服务端字段 | 事件内容改知识片段驱动或改显式空态；不得保留虚构数字 | `frontend-flow`（+`backend`） |
| F-10 | `pc/architecture` | 页面只读 `/api/health` 的 `dependencies`，未消费 `GET /ready` 的 7 项 checks；失败态与「无待处理事项」空态无断言 | 消费 `/ready`；补 F/E 三态 | `frontend-lead` |
| F-11 | `pc/reader` | 阅读器展示页码/标题，但「摘要必须带 `document_id`」的实现需复核 `readerDocumentRef()` 是否在各入口都取到 `doc-*`（#24 只改了引用展示） | 复核并补 `document_id` 缺失时的 400 失败态断言 | `frontend-lead` |
| F-00（已修复） | `pc/product-deposit` | 目录加载完成后未重渲染、区间事实空值未守卫（#26 修复） | 已由 #26 修复；#27 三态用例为回归证据 | `frontend-lead`（已完成） |

> **红线**：上表缺陷**不得**通过删断言、放宽断言、改成功态或 `skip` 规避。任一缺陷未修复时，对应三态用例应保持对目标行为的断言并红，直至修复项合并。**优先修复再补断言**，避免把「当前错误行为」固化成验收基线。

### 15.4 三态用例的编写与派工规则

1. **每页三条独立断言**：成功、失败、空态各至少一条，断言**页面可见文本**（`toContainText` / `toBeVisible`），不断言内部变量；同一测试内循环多个页面时，必须对每个页面分别断言，不得只断言最后一个。
2. **失败态必须由真实错误驱动**：`400 VALIDATION_ERROR`、`409 VERSION_CONFLICT`、`422 INSUFFICIENT_EVIDENCE`、`503 DEPENDENCY_UNAVAILABLE`、`404 NOT_FOUND`；用 `page.route` 注入**服务端真实结构**的错误体（`{ error:{ code,message,details? }, request_id }`），不得在浏览器里伪造 `promptError`。
3. **空态优先用真实无来源**：能通过真实快照缺字段/无数据触发的，不要注入；不能的（如保单、认定状态、目标完成度）用受控契约响应，并在用例注释标明「受控契约，不是真实业务数据」。
4. **三态独立成 spec 组织**：按路由分组（`test.describe('P-xx 路由')`），每态一个 `test` 或一组按页面循环且逐页断言的 `test`；文件名建议 `tests/e2e/three-state-<route>.spec.js` 或并入现有 `three-state.spec.js`，由 `test-e2e` owner 决定。
5. **归属**：页面三态 → `test-e2e`；命令幂等/校验/撤权 → `test-unit`；带 DB 的会话持久化 → `test-db`；文档/契约表 → `docs`；契约实现 → `contract`；数据源 → `data`。**契约原子变更（C-01/C-02）按 §14.6 的精确共同 owner 在单一 PR 内提交；其余页面/用例按各自 owner 分开提交，不得跨 owner**（§8.3.2）。
6. **验证入口**：`npm run test:e2e` 必须是 30 页三态的最终判据；`three-state.spec.js` 现有 5 个用例是起点，不是完成态。

### 15.5 验收边界（必须与真实数据验收区分）

- **受控契约响应**：证明「页面在服务端返回该结构时的三态映射正确」，属**UI 契约验证**，不是真实业务数据验收，也不是真实模型结论。
- **真实无来源空态**：证明「服务端没有该数据时页面不伪造」，属**真实空态验证**，可作为该页空态的验收证据。
- **真实业务数据验收**：需要真实数据源（保单、认定、产品扩展字段、事件/宏观/行业、目标完成度等）且由行方口径判定；本次**0 / 30**，W2/数据波次启动后另行验收。
- 所有页面继续保留「演示桩 fixture / 演示数据，不构成投资建议」标注；不得把受控响应写成真实客户数据或生产结论。

## 16. 仍需裁决事项（供 orchestrator / 用户确认）

> **A / B / C 已由用户裁决，不再列为待裁决**：A 仅 `contact-request` 豁免授权；B `save_draft` 要求 `authorized=true`；C 草稿仅撤权清空。`public/actions/flow.js` 因不在 #28 的共同 owner 内，采用 §14.6.6 的三步兼容序列，**不是**待裁决项。下列 D/E/F/H 未确认前不得实现；C-01/C-02 的集合前后值与撤权语义已在 §14 定稿。

| 编号 | 事项 | 当前状态 | 本文建议 | 影响 |
|---|---|---|---|---|
| D | **H-05 多轮上下文持久化** | **待裁决（未批准，不得实施）** | 需要新增会话字段（如 `conversation`）或命令，属新契约变更；另立契约、单独立项，不与 C-01/C-02 捆绑 | `m/assistant` 的 A14b 验收；若落地影响 36 key |
| E | **候选独立 `score`** | **待裁决（未批准，不得实施）** | 即使后续认为可独立推进，也须先取得明确裁决；不得写成已批准。建议 `backend` 在 `candidateCalculation` 增字段、前端消费；不改会话集合 | H-02/P-16 的「排序可复算」验收 |
| F | **真实数据源 / W2 是否启动** | **本次不启动** | P-02/P-03/P-05/P-07/P-13/P-17 的真实数据验收依赖它；W2/数据波次另排 | §15 中 12 个「缺数据源」页面只能做受控三态/真实空态 |
| H | **`tests/unit/frozen-set-regression.test.js` 的共同 owner 缺口** | **阻塞（待裁决）** | 推荐 A：在 #28 增补该单文件精确 owner（`test-unit` + `contract`）；B：由 test-unit 把断言并入 `session-contract.test.js` 并删旧文件（减少独立回归锁，不推荐）；C：跳过/删除（禁止） | 不解决则 C-01/C-02 原子 PR 的 `ci-unit-api` 必红，无法合并 |

> D/E 仍为待裁决，**不得**在代码、测试或文档他处写成「已批准/可实施」；F/W2 不启动；H 是当前唯一的原子 PR 阻塞项。A/B/C 的落地口径见 §14.1 / §14.2 / §14.4。
