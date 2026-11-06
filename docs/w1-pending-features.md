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
| 基线 | `origin/main` = `cf07b1b`（波次 2 合并后；本清单首版写于基线 `53eb19c`，波次 1 后校正为 `d0b7620`，波次 3 起校正为 `cf07b1b`，均见 §0.3 / §0.4）。所列「当前演示态」均为该基线上 `public/app.js`、`public/actions/*.js` 与 `src/` 的**代码事实**，不是人工观感描述 |

### 0.3 基线校正与波次 1 收工登记（2026-11-05 复核）

波次 1 已合并 4 个加固项，基线由 `53eb19c` 推进到 **`d0b7620`**（波次 2 合并后已进一步推进到 `cf07b1b`，见 §0.4）。本清单凡引用基线处一律记为当前基线，并把下列已修项在对应条目上标注「**已收工 · PR#**」，**原条目不删除**（保留追溯）。

| PR | 类型 | 收工项（对应本清单条目） |
|---|---|---|
| #6 | contract（`contract`） | `session-sync` 归一化服务端 `asOf`（页面不再把存储编码当时点）；`set_authorization` 布尔校验；`demo-data` 预同步投影补齐只读身份/版本字段。**合同冻结集合未变**（36 key / 19 PATCH / 7 命令 / 11 `downstreamReset` / 14 activity kind） |
| #7 | data（`data`） | seed 与迁移可重复执行、fixture parity（对应 **P-15 权威状态前提**、**P-04「利率唯一真值来源」的数据侧前提**） |
| #8 | docs（`docs`） | 本清单首版入库（即本文，写于波次 1 之前的旧基线） |
| #9 | backend（`backend`） | A06 候选资格解析「12 个月」等持有期、定期存款按名义期限、一年内流动性需求排除满 12 个月持有；A07 确定性比较口径与 `comparable/incomparable_reason/missing_product_ids`；A23 `rule_id`+`rule_version` 精确匹配、拒绝模型动作与排名；A17/A19 规则与计算证据入包；A18 规则执行前复核会话版本。**H-06 事实性误判即由本 PR 暴露**（见 §4 H-06） |

基线校正要点：波次 1 之前的旧基线（`53eb19c`）上的「当前演示态」凡与当前基线 `cf07b1b` 不同，以本节与各条目「**基线校正**」行为准；未标注者表示两版一致。

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
| 3 | `pc/product-fund` | PC 产品洞察 | P-02 | `catalog.fund` 硬编码 3 只基金，非 `/api/demo-data` | 产品事实无服务端来源 | A02、A08、A19 |
| 4 | `pc/product-insurance` | PC 产品洞察 | P-03 | `catalog.insurance` 硬编码 | 同上；「我的保单」「理赔」「通识」三板块静态 | A02 |
| 5 | `pc/product-wealth` | PC 产品洞察 | P-03 | `catalog.wealth` 硬编码 | 同上 | A02 |
| 6 | `pc/product-deposit` | PC 产品洞察 | P-04 | `catalog.deposit` 硬编码；测算用前端常量。**已推进 · 波次 3**：服务端 `calculateDeposit()` 已存在，HTTP 只读端点由 contract PR 暴露 | 利率/本金未经服务端计算；`pc/product-deposit` 仍为前端常量，待改接只读端点 | A08 |
| 7 | `pc/product-private` | PC 产品洞察 | P-05 | 整页为 `pageProductPrivateRestricted()` 受限提示。**已推进 · 波次 3**：认定状态与受限产品定为只读派生投影（不进会话状态） | 无认定状态、无产品数据；页面尚未消费派生投影 | A10、A13 |
| 8 | `pc/candidates` | PC 产品洞察 | H-02 | 候选来自 `session.candidates`；**变更**：`d0b7620` 起候选资格/理由/排序由 `candidateCalculation` 给出（`reason`、`constraints`、`holding_months`），`match` 已恒为 `—`（`session-sync.js` 覆盖产品字段） | 无候选时缺**专用引导**空态（现仅表体缺省行）；`score` 仍缺服务端字段，排序值不可复算 | A06、A48 |
| 9 | `pc/compare` | PC 产品洞察 | H-03 | 比较集来自 `session.compareSet`；**变更**：`comparisonBasis`/`compareBasis()` 已产出确定性口径（`type`+`risk`+`benchmark`）与 `comparable`/`incomparable_reason` | 前端未消费该口径：`m/compare` 固定结论文案仍在、口径切换只改行标签（见 H-03） | A07 |
| 10 | `pc/supply` | PC 财富投研 | P-06 | 行数组与 `metric()` 硬编码 | 无 `/api/demo-data` 来源 | A02、A13 |
| 11 | `pc/research` | PC 财富投研 | H-04 | `research_qa` 真实，回答/错误卡片已接 | 重复提问无状态提示 | A09、A18、A57 |
| 12 | `pc/events` | PC 财富投研 | P-07 | `researchPage('events')` 静态列表 | 无服务端来源与三态 | A02、A11 |
| 13 | `pc/macro` | PC 财富投研 | P-07 | 同上 | 同上 | A02、A11 |
| 14 | `pc/industry` | PC 财富投研 | P-07 | 同上 | 同上 | A02、A11 |
| 15 | `pc/library` | PC 财富投研 | P-08 | 产品智库里 5 行硬编码 | 未接 `/api/demo-data`、`/api/knowledge` | A02、A20 |
| 16 | `pc/reader` | PC 财富投研 | P-09 | 5 章内容硬编码；`summary` 常因缺 `document_id` 拒绝 | 正文与 `doc-*` 无绑定 | A20、A53 |
| 17 | `pc/writing` | PC 财富投研 | P-10 | 3 类写作品类与 QC 徽章硬编码 | 草稿状态不持久 | A11、A54 |
| 18 | `pc/result` | PC 公共结果 | P-11 | `landingSpec` 53 条映射；含假数据项 | 注销了假成功，但版本/权限为空 | A11、A13 |
| 19 | `m/assistant` | 手机主流程 | H-05 | `assistant_qa` 真实 | 「2 条持仓提醒」硬编码；无多轮 | A14、A14b、A03 |
| 20 | `m/fund` | 手机主流程 | P-12 | 4 条基金硬编码；仅 A500 可诊基 | 硬编码产品无法映射 `product_id` | A08、A19、A10 |
| 21 | `m/insurance` | 手机主流程 | P-13 | 整页硬编码；`m-coverage`/`m-policy` 只开固定弹窗。**已推进 · 波次 3**：保单/缺口定为只读派生投影，无来源时显式空态、不伪造 | 无保单数据源；派生投影覆盖面有限（只含产品事实可确定字段） | A08、A10 |
| 22 | `m/wealth` | 手机主流程 | P-14 | `wealthCard()` 来自 `productOf`（真实产品） | `wealth`/`cash` 无知识片段 | A08、A10 |
| 23 | `m/deposit` | 手机主流程 | P-04 | 到期本息由前端 `updateDeposit()` 计算 | 计算未由服务端权威 | A08 |
| 24 | `m/private` | 手机主流程 | P-05 | 受限页 + `m-contact`（`contactTodo`） | 无认定状态与未认定/已认定分叉 | A10、A13 |
| 25 | `m/allocation` | 手机主流程 | H-06 | `rule_match` → `generate_allocation` → `generate_candidates` 已真实闭环（`cf07b1b` 实测默认目标产出 `allocation-balanced-r3`） | 两类失败态（`UNSUPPORTED_RULE`、`NEED_CONFIRMATION`）**共用** `rule-confirmation` 结果页；`NEED_CONFIRMATION` 在表单恒有默认值时不可达 | A04、A05、A24 |
| 26 | `m/holdings` | 手机主流程 | P-15 | 合计来自服务端；持有收益与集中度硬编码。**已推进 · 波次 3**：服务端 `PortfolioService.calculate()` 只读门面已就绪（双分母、`estimated` 收益），HTTP 端点由 contract PR 暴露 | 收益/贡献改接服务端只读投影（`cf07b1b` 已将 `portfolio_calculation` 嵌入持仓结构化事实，**页面尚未消费**） | A08、A10 |
| 27 | `m/candidates` | 手机主流程 | P-16 | 候选来自服务端；「适配你的资金期限」硬编码；**变更**：`cf07b1b` 起 `candidateCalculation.reasons[]` 已带 `constraints` 与 `holding_months`（`d0b7620` 引入，波次 2 前已生效），文案与排序同源已具备前提 | 页面固定文案未改用 `reasons[].constraints` | A06、A48 |
| 28 | `m/compare` | 手机主流程 | H-03 | 同上；「历史收益更高…」为固定文案 | 固定结论文本 | A07、A45 |
| 29 | `m/companion` | 手机主流程 | P-17 | `+0.86%`、`68%`、`R3` 硬编码 | 复盘数字无来源 | A08、A11、A50 |
| 30 | `m/result` | 手机公共结果 | P-11 | 复用 `landingBody()` | 同 P-11 | A11 |

合计：**P 类 17 页**（P-01…P-17），**H 类 13 页**（H-01…H-06，其中 H-03 同时覆盖 `pc/compare`、`m/compare`）。`pc/result` 与 `m/result` 共用 P-11。

### 1.1 校正后的缺口基数（基线 `cf07b1b`，2026-11-05 波次 2 后重算）

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

**波次 3 计数口径（不得虚报）**：波次 3 只落地「服务端已有计算的只读暴露 + 文档口径」，**不改变任何页面的运行行为**，因此上表前四行的条目/缺口总数与波次 2 后一致（23 条目 / 45 单项缺口待办，`0 / 30` 页达标）。新增的三个细分行只是把 45 项按「阻塞性质」拆开，便于排期，**不得**把「已被只读端点覆盖」读成「已收工」：页面改接服务端读数并交齐三态用例之前，该项仍计待办。已在等待页面接线的四项为 P-04（存款只读端点）、P-15（持仓只读投影）、P-05（认定状态只读派生）、P-13（保单只读派生）。#12 删除前端自算存款本息、#13 移除落地页假数据项属**删假值**，未用服务端真实数据替换，故不冲减任何缺口。

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
| ②「30 页逐页达标」 | **0 / 30 页达标**（23 / 23 条目待办，45 / 48 单项缺口待办；其中 7 项的口径已由只读端点/派生投影覆盖，仅差页面接线） | 需每个条目在 §2 模板下交齐成功/失败/空三态与真实服务端来源 | 不表示主链路未通；①与②互不替代；「口径已覆盖」不表示「页面已达标」 |

**口径 ① 的证据**：`tests/e2e` 共 9 个用例 × 2 个 Playwright 工程（`pc` / `mobile`）= **15 次运行**；`ensureAuthorization()` 真实点击 `m-generate-allocation` 并等待结果页「配置方案与候选已生成」，`mobile-flow` 断言 `plan` 非空且 `candidates.length >= 2`。该证据只证明**链路与状态写入真实**，不证明页面内容质量（§0.1）。截至本波次提交，当前基线 `cf07b1b` 上的 GitHub Actions 运行结论以 PR #13 的 6 个 job + `ci-merge-gate`（以及波次 3 各 PR 自身的门禁）为准，本地 15/15 结论不得替代该门禁。

**排期约束**：不得再按旧基数（曾写作「P 17 条 + H 6 组待办、H-06 全链路不可达」）排期；H-06 已从「阻塞项」降级为「两类失败态文档化」的小项。

说明：`pc/architecture` 在 `CONTEXT.md` 中属于 PC 工作台闭环，冻结的闭环清单（手机：助手→持仓→诊断→配置→候选→比较→陪伴；PC：工作台/研究→产品解释→候选→比较→保存）未单列它，因此按接口状态页补，按 A13/A30 验收，不额外新增指标。

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
- **关联**：A02、A13、A19；R9（A/D 类）、R43。

### P-04 `pc/product-deposit`、`m/deposit`

- **当前演示态**：`pc/product-deposit` 的「测算工具」在前端用常量 `principal=500000` 与 `parseFloat(current.rate)` 计算（实际上永远用 0.021，与该产品无关）；`m/deposit` 的到期本息由 `updateDeposit()` 在浏览器计算。「比较提前支取」（`m-deposit-compare`）同样在浏览器算。
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
- **验收用例**：`tests/unit`（利率/期限矩阵可复算 + 百分数单位回归）、`tests/e2e`（三档期限与两个页面的数值一致）。
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
- **关联**：A02、A10；R9、R43。

### P-15 `m/holdings`

- **当前演示态**：总资产来自服务端（168,420+250,000+300,000 = **¥718,420**，占比 23.44%/34.80%/41.76%）；但「持有收益 +¥42,860.18 / +5.40%」与「单只宽基基金占权益资产 68%」**均为硬编码**，无法由当前持仓复算（3 笔持仓的 `return_rate` 也无法得出 5.40%）。`extra` 一行「安享长期医疗 年缴 ¥3,280」是保险保费，与持仓金额混算。
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

### P-16 `m/candidates`

- **当前演示态**：候选 ID 来自 `session.candidates`（真实 `generate_candidates`）；但「适配你的资金期限」为固定文案，理由未区分具体约束；`p.match` 来自产品字段而非服务端排序结果。
- **目标完成条件**：理由与排序同源于 `candidateCalculation`（A06「理由与当前输入一致」）。
- **成功**：每条候选的排序值/理由取自 `candidateCalculation`。
- **失败**：`candidate_explain` 失败（`422`，候选缺失或计算不一致）→ 真实错误。
- **空**：候选为空是**可达**的（`m/allocation` 无方案时直接进入 `m/candidates`），必须显示引导空态；但「已生成方案却没有符合条件的产品」在 fixture 下不会出现（默认目标下 7 个产品全部合格），**该项空态不得用真实场景宣称已验证**，只能作为防御性显示。
- **权威状态**：`candidates`、`candidateCalculation`（仅由 `generate_candidates` 写入）。
- **命令/接口**：`generate_candidates`、`POST /api/ai/generate`（`candidate_explain`）。
- **验收用例**：`tests/integration`（`candidateCalculation` 与候选一致）、`tests/e2e`（空态）。
- **关联**：A06、A19；R48。

### P-17 `m/companion`

- **当前演示态**：`+0.86%`、目标完成度 `68%`、「组合风险仍在 R3」硬编码；`m-remind`（`create_reminder`）与 `m-submit-care`（`submit_care`）已是真实命令；`m-event` 是固定文本弹窗。
- **目标完成条件**：复盘数字来自服务端；服务建议**结束于待客户经理确认**（A10/A50）；`m-event` 内容来自知识片段。
- **成功**：复盘收益/目标完成度可复算；提交后状态为 `WAITING_FOR_MANAGER`。
- **失败**：`submit_care` 在未保存比较时 → `409`「请先保存有效产品比较」。
- **空**：无关联方案 → 「尚未关联配置方案」。
- **权威状态**：`careSubmitted`、`remindCreated`、`plan`、`compareSaved`。
- **命令/接口**：`create_reminder`、`submit_care`。
- **验收用例**：`tests/e2e`（提交前/后的状态 + `409` 路径）。
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
| A04 授权拦截 | 未授权时 `auth-needed`；`assertAuthorized()` 拒绝方案/候选/比较/陪伴命令；**取消授权**命令已存在但页面无入口 | 页面上可见「撤销授权」并验证下游 `downstreamReset()` | `tests/integration` |
| A09 问答边界 | `research_qa` 无片段 → `422`（已有 E2E）；`assistant_qa` 结构化事实不足才 `422` | `pc/events`/`macro`/`industry` 与 `m/assistant` 分别验证 | `tests/e2e` |
| A10 分支闭环 | 保险、私行、持仓收益仍为静态 | P-05、P-13、P-15 收工后闭环 | `tests/e2e` |
| A13 真实表达 | 存在硬编码 KPI 与「99.98%」「94.6%」 | 由 P-01 清除 | `tests/e2e` |
| A18 请求一致性 | `runRealAiTask()` 用 `activeAiRequestToken` 丢弃旧响应；**PR#9** 在规则执行前复核会话版本 | 现有机制需一条显式用例 | `tests/e2e` |
| A20 知识引用可回指 | 页面仅显示 `chunk_id`，**未显示标题与页码** | 引用展示 `title` + `page`（`/api/knowledge` 自 PR#6 起文档条目显式带 `title`，`chunk_id` 可回指） | `tests/e2e` |
| A34 服务开放 | `/api/demo-data` **不带 `session_id` 时在 `DATA_MODE=database` 直接 400** | 外部调用者需先建会话再传 `session_id`；验收用例必须体现该前置 | `tests/unit`（不含 DB 的接口契约用例） |
| A35 真实时延 | `ai_requests` 记录 `latency_ms`、`model`（已存在）；页面展示时延 | 保持 | `tests/integration` |

> 说明：A14「八类 AI 任务均产生可验证的真实模型调用」在 W1 的 `AI_MODE=fixture` 下只能证明「八类任务均产生可验证的（fixture）调用与真实证据链」，模型名恒为 `fixture-generate-1`；真实模型调用按 E 类/后续波次判定，**本清单不宣称 A14 已满足**。

## 8. 待批准规格（状态契约变更登记 · 供波次 3 集中处理）

> **本节是唯一入口**：下列 8 项任一落地都属于契约变更。**任一项落地需状态契约 owner 批准，并同步 `docs/api-contract.md`「共享会话状态契约（W1 冻结）」与 `tests/unit/session-contract.test.js` 的 36 key / 19 PATCH 字段 / 7 命令 / 11 `downstreamReset` 集合断言**。未获批准前，Worker 不得先行改动冻结集合，也不得在前端构造对应状态。
>
> - **冻结集合 owner**：`contract`（`scripts/ci/check-ownership.mjs`：`public/demo-data.js`、`public/session-sync.js`、`src/components/sessions/`、`src/fixtures/`、`src/interfaces/http/`、`src/config/`）。
> - **业务规则/计算 owner**：`backend`（`src/components/business-rules/`、`src/components/ai-orchestration/`）。
> - **数据源 owner**：`data`（`db/`、`scripts/seed/`）。跨 owner 的项必须由 `contract` 牵头会签，不得由单一 owner 自行合并。
> - 状态行含义：**不改冻结集合** ＝ 不触碰 36/19/7/11；**改 PATCH 白名单** ＝ 同时改 19 项断言；**新增命令** ＝ 同时改 7 项断言与 `ACTIVITY_KINDS`（如适用）；**新增状态 key** ＝ 同时改 36 项断言。

### 8.1 八项变更清单

| # | 变更（待批准规格） | 涉及页面 | 变更类型 | 是否改动冻结集合（36 key / 19 PATCH / 7 命令 / 11 `downstreamReset`） | 需同步的文档与测试断言 | 前置依赖 | 现状（`cf07b1b`） |
|---|---|---|---|---|---|---|---|
| 1 | **规则匹配产出有效 `rule_id`**：默认目标 → `allocation-balanced-r3`，R1/R2 → `allocation-liquid-r2`（**已成立**，无需再审批） | H-06 → `m/candidates`、`m/compare`、`m/companion` | 无需变更（既有 fixture 行为，非契约） | **不改冻结集合** | 无需改 `session-contract.test.js`；`tests/unit/fixture-model-client.test.js`、`tests/integration/w1-flow.test.js` 已断言 `allocation-balanced-r3` | 无 | **已达**：`pickAllocationRule()` 自 `2d9ad15` 起生效。原「`rule_id: null` → `UNSUPPORTED_RULE`」登记作废。仅剩 **H-06 缺口 ②③**（`UNSUPPORTED_RULE` 独立结果页、`NEED_CONFIRMATION` 可达性）需**前端结果页**改动，仍属契约外的 UI 变更，可随 `frontend-flow`/`frontend-lead` 提交 |
| 2 | **合格投资者认定状态**：新增只读字段（如 `qualifiedStatus`），由服务端快照派生，浏览器不可写 | P-05（`pc/product-private`、`m/private`） | 新增只读状态 key | **新增状态 key**：36 → 37（读模型）；若同时从 `defaultSessionState()` 落值，需在只读项（现 9 项）中登记 | `docs/api-contract.md` 契约表 + `session-contract.test.js` 的 36 项断言与只读分组断言；`CONTEXT.md` P0 #3 状态表 | 数据侧需先有认定来源（`db/`）；若复用 `customer.authorized`，须说明与授权的语义差别（A13） | 无写入方，`qualified` 已归只读。**已推进 · 波次 3**：口径改按只读派生投影（不进 `defaultSessionState()`，不新增状态 key），页面接线后落地，见下方「波次 3 决策记录」一 |
| 3 | **`contactTodo` 迁移**：由 `PATCH` 可选字段改为 `record_activity`（`kind` 新增一类）或独立命令 `record_contact_request` | P-05（`m/private` 的 `m-contact`） | 命令迁移 | **改 PATCH 白名单**（19 → 18）并**新增命令**（7 → 8）或**新增 activity kind**（14 → 15） | `docs/api-contract.md` 契约表；`session-contract.test.js` 的 19/7 断言；若走 activity kind 还需 `tests/unit/activities.test.js` 白名单断言；`public/app.js` 的 `landingSpec` 映射 | 需先确认 `m-contact` 是否应保留「仅行内待办」语义（A11 要求服务端可见记录） | 现为 `SESSION_PATCH_FIELDS`，仅 PATCH。**已推进 · 波次 3**：仍滞后，只读投影无法替代写入面，须 owner 批准，见「波次 3 决策记录」二 |
| 4 | **存款本息确定性计算**：接入已有 `deposit-interest-simple`，统一百分数/小数单位（`2.15%` → `0.0215`），入口在**只读计算接口**与**会话命令**中二选一 | P-04（`pc/product-deposit`、`m/deposit`、`m-deposit-compare`） | 新增入口（计算已存在） | 二选一：**只读接口**（`src/interfaces/http/`，不改冻结集合，但属 API 契约新增）／**新增命令**（7 → 8，改冻结集合） | 只读接口：`docs/api-contract.md` 新增端点节；命令：契约表 + 7 项断言。两种都需 `tests/unit` 单位回归（`2.15` vs `0.0215`） | `backend` 需先给 `executeDeterministic()` 补调用方与单位守卫；`data` 保证 `products.annual_rate`（`deposit`=2.15%）唯一真值 | 浏览器计算；`executeDeterministic()` **全仓无调用方**；百分数误传会放大 100 倍。**已推进 · 波次 3**：PR#11 已落 `calculateDeposit()` 只读入口与单位守卫，改走只读接口形态；端点路径以 contract PR 描述为准，见「波次 3 决策记录」一 |
| 5 | **持仓收益/贡献/集中度计算**：复用 `portfolioCalculation`，页面字段经服务端产出 | P-15（`m/holdings`） | 新增只读计算入口 **或** 复用已有证据包装配 | **不改冻结集合**（若走 `portfolio_calculation` 证据路径）／**新增状态 key**（若要求直接落会话字段） | 走证据路径：`tests/integration` 断言 `calculation_id` 与 `max_concentration`；落会话字段：契约表 + 36 项断言 | **PR#9 已提供前提**：`finalizeEvidence()` 将 `portfolio_calculation` 嵌入 `structured_facts.holdings[]`；剩余为页面侧消费与分母口径（全资产 41.76% vs 权益内 68%） | 页面硬编码；分母口径与文案未统一。**已推进 · 波次 3**：PR#11 已落 `PortfolioService.calculate()` 只读投影（双分母 + `estimated`），改走只读投影形态，见「波次 3 决策记录」一 |
| 6 | **保单与保障缺口数据来源**：新增保单表/接口（覆盖度、缺口、待办，按保单 ID 区分） | P-13（`m/insurance`）、P-03 保险板块 | 新增数据源 | **不改冻结集合**（只读数据接口）；若需写入会话则另行登记 | `docs/api-contract.md` 新增只读数据节；`tests/integration`（不含 DB 时用契约桩）与 `tests/e2e`（两张保单内容不同 + 空态） | `data` 新表 + seed；`contract` 定路由；**不得前端伪造**（A13、R32） | 无任何保单来源；`m-coverage`/`m-policy` 只开同一固定弹窗。**已推进 · 波次 3**：口径改按只读派生投影（仅产品事实可确定字段，无来源即空态），页面接线后落地，见「波次 3 决策记录」一 |
| 7 | **写作草稿持久化**：草稿写入服务端并刷新可回看 | P-10（`pc/writing`） | 新增状态 | **新增状态 key**（36 → 37，如 `writingDrafts`）或**新增命令**（7 → 8，如 `save_draft`） | 契约表 + 36/7 断言；`tests/e2e`（生成→刷新→回看） | 需确定草稿是否属 `activities` 之外的持久对象（A11 要求服务端存在）；AI 结果投影现状在前端 `PATCH` 写回 | 仅结果页可见，回页即消失。**已推进 · 波次 3**：仍滞后，需新增状态 key 或命令，须 owner 批准，见「波次 3 决策记录」二 |
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
2. **一次性同步**：批准后同一次 PR 内同时改 `docs/api-contract.md` 与 `tests/unit/session-contract.test.js`，不得只改其中一侧；集合断言失败即视为未获批准；
3. **只读优先**：能用只读接口/证据包表达的（第 4 项接口形态、第 5、6 项）优先，避免扩大写入面；
4. **不得搭便车**：任何条目不得顺手改动与自身无关的冻结项或新增运行页面（§6 红线 1）；
5. **波次 3 补充**：「波次 3 决策记录」一列出的 P-04 / P-15 / P-05 / P-13 四项走只读端点或派生投影，**不属于**本条第 1 款的批准范围（冻结集合不变），因此无需 owner 批准即可实现与验收；但若实现过程中发现必须改任一笔冻结集合，须立刻停止，回到 §8.1 重新登记并回到第 1、2 款流程；

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
- **契约变更只在 §8 登记**：新增/调整状态一律进 §8.1，并遵守 §8.2 的「先批准后实现、一次性同步」；未获 `contract` owner 批准不得改动冻结集合。
