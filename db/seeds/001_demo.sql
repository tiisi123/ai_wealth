INSERT INTO data_versions(version, source_name, status, source_timestamp, activated_at, quality_status)
SELECT 'demo-2026-09-28-v1', 'inhouse-standard-package',
       CASE WHEN EXISTS (SELECT 1 FROM data_versions WHERE status = 'ACTIVE') THEN 'STAGING' ELSE 'ACTIVE' END,
       '2026-09-28T09:00:00+08:00',
       CASE WHEN EXISTS (SELECT 1 FROM data_versions WHERE status = 'ACTIVE') THEN NULL ELSE NOW() END,
       'VERIFIED'
ON CONFLICT (version) DO NOTHING;

INSERT INTO customers(customer_id, display_name, risk_level, region, authorized, data_as_of, data_version)
VALUES ('customer-001', '林女士', 'R3', '上海', TRUE, '2026-09-28', 'demo-2026-09-28-v1')
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO products(product_id, data_version, name, type, risk, role, latest_return, drawdown, annual_rate, fee, coverage, annual_premium, liquidity, sale_status, source_id, source_timestamp)
VALUES
  ('wealth', 'demo-2026-09-28-v1', '稳盈固收180天', '理财', 'R2', '稳健底仓', 0.0362, -0.0042, NULL, 0.002, NULL, NULL, '180 天持有期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('fund', 'demo-2026-09-28-v1', '易方达中证A500联接A', '基金', 'R3', '权益增长', 0.1842, -0.098, NULL, 0.006, NULL, NULL, '工作日可申赎', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('deposit', 'demo-2026-09-28-v1', '安心定期3年', '存款', 'R1', '确定性现金', NULL, NULL, 0.0215, 0, NULL, NULL, '提前支取按活期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('insurance', 'demo-2026-09-28-v1', '安享长期医疗', '保险', '保障', '医疗保障', NULL, NULL, NULL, NULL, 4000000, 3280, '长期保障', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('bondfund', 'demo-2026-09-28-v1', '华安稳健增利 12 个月', '基金', 'R2', '稳健底仓', 0.0408, -0.0112, NULL, 0.0045, NULL, NULL, '12 个月持有期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('wealthplus', 'demo-2026-09-28-v1', '安盈精选固收+', '理财', 'R3', '收益增强', 0.0518, -0.024, NULL, 0.005, NULL, NULL, '12 个月', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('cash', 'demo-2026-09-28-v1', '天天利现金管理', '理财', 'R1', '现金管理', 0.0182, NULL, NULL, 0.0015, NULL, NULL, '工作日快赎', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('fund2', 'demo-2026-09-28-v1', '沪深300ETF联接C', '基金', 'R3', '权益均衡', 0.1526, -0.113, NULL, 0.0055, NULL, NULL, '工作日可申赎', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('bondfund2', 'demo-2026-09-28-v1', '南方纯债A', '基金', 'R2', '稳健底仓', 0.0331, -0.0088, NULL, 0.0035, NULL, NULL, '6 个月持有期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('wealth2', 'demo-2026-09-28-v1', '稳盈现金90天', '理财', 'R1', '现金管理', 0.0246, -0.0015, NULL, 0.0018, NULL, NULL, '90 天持有期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('insurance2', 'demo-2026-09-28-v1', '安心重疾保障计划', '保险', '保障', '重疾保障', NULL, NULL, NULL, NULL, 800000, 4680, '长期保障', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('deposit2', 'demo-2026-09-28-v1', '安心定期1年', '存款', 'R1', '确定性现金', NULL, NULL, 0.0155, 0, NULL, NULL, '提前支取按活期', 'OFF_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00')
ON CONFLICT (product_id, data_version) DO NOTHING;

INSERT INTO holdings(holding_id, customer_id, product_id, data_version, amount, return_rate, source_id, source_timestamp)
VALUES
  ('holding-001', 'customer-001', 'fund', 'demo-2026-09-28-v1', 168420, 0.1842, 'inhouse-standard-package', '2026-09-28T09:00:00+08:00'),
  ('holding-002', 'customer-001', 'wealth', 'demo-2026-09-28-v1', 250000, 0.0362, 'inhouse-standard-package', '2026-09-28T09:00:00+08:00'),
  ('holding-003', 'customer-001', 'deposit', 'demo-2026-09-28-v1', 300000, 0.0215, 'inhouse-standard-package', '2026-09-28T09:00:00+08:00')
ON CONFLICT (holding_id, data_version) DO NOTHING;

INSERT INTO rules(rule_id, rule_version, name, applicable_scenario, required_inputs, conditions, action, enabled)
VALUES
  ('allocation-balanced-r3', 'rules-demo-v1', 'R3 平衡型教育金配置', 'asset_allocation', '["amount","term","risk","purpose","liquidity","authorized"]', '["risk == R3","authorized == true","term in 3–5 年"]', '{"cash":20,"bond":50,"equity":20,"protection":10}', TRUE),
  ('allocation-liquid-r2', 'rules-demo-v1', 'R2 流动性优先配置', 'asset_allocation', '["amount","term","risk","purpose","liquidity","authorized"]', '["risk in R1/R2","authorized == true","liquidity contains 1 年"]', '{"cash":45,"bond":45,"equity":0,"protection":10}', TRUE),
  ('deposit-interest-simple', 'rules-demo-v1', '存款到期利息测算', 'deposit_calculation', '["principal","annual_rate","years"]', '["principal > 0","annual_rate >= 0","years > 0"]', '{"formula":"principal * annual_rate * years"}', TRUE),
  ('allocation-growth-r4', 'rules-demo-v1', 'R4 进取型长期配置', 'asset_allocation', '["amount","term","risk","purpose","liquidity","authorized"]', '["risk == R4","authorized == true"]', '{"cash":10,"bond":30,"equity":55,"protection":5}', TRUE),
  ('allocation-conservative-r1', 'rules-demo-v1', 'R1 保守型现金配置', 'asset_allocation', '["amount","term","risk","purpose","liquidity","authorized"]', '["risk == R1","authorized == true"]', '{"cash":60,"bond":35,"equity":0,"protection":5}', TRUE),
  ('allocation-education-short', 'rules-demo-v1', '短期教育金稳健配置', 'asset_allocation', '["amount","term","risk","purpose","liquidity","authorized"]', '["purpose == 教育金储备","term in 1–3 年","authorized == true"]', '{"cash":30,"bond":55,"equity":10,"protection":5}', TRUE),
  ('deposit-interest-1y', 'rules-demo-v1', '一年期存款利息测算', 'deposit_calculation', '["principal","annual_rate","years"]', '["principal > 0","years == 1"]', '{"formula":"principal * annual_rate * years","term":"1y"}', TRUE),
  ('insurance-suitability-check', 'rules-demo-v1', '保险适配前置校验', 'insurance_eligibility', '["product_id","customer_risk","health_disclosure"]', '["sale_status == ON_SALE","health_disclosure == true"]', '{"status":"NEED_CONFIRMATION"}', TRUE)
ON CONFLICT (rule_id, rule_version) DO UPDATE SET name = EXCLUDED.name, action = EXCLUDED.action, enabled = EXCLUDED.enabled;

INSERT INTO knowledge_versions(version, embedding_model, vector_dim, status, activated_at)
VALUES ('knowledge-demo-v1', 'pending-real-embedding', 1536, 'STAGING', NULL)
ON CONFLICT (version) DO NOTHING;

INSERT INTO knowledge_documents(document_id, knowledge_version, title, source_id, source_timestamp, page_count)
VALUES
  ('doc-a500-quarterly', 'knowledge-demo-v1', 'A500 季报与风险说明', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 10),
  ('doc-fixed-income-monthly', 'knowledge-demo-v1', '固收+策略月报', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 12),
  ('doc-insurance-terms', 'knowledge-demo-v1', '长期医疗产品说明书', 'vendor-docs-2026-09', '2026-09-28T09:00:00+08:00', 18),
  ('doc-deposit-rules', 'knowledge-demo-v1', '存款计息规则', 'bank-rules-2026-09', '2026-09-28T09:00:00+08:00', 5),
  ('doc-events-weekly', 'knowledge-demo-v1', '市场事件周报', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 8),
  ('doc-macro-outlook', 'knowledge-demo-v1', '宏观指标与利率展望', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 14),
  ('doc-industry-research', 'knowledge-demo-v1', '行业研报汇编', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 20),
  ('doc-a500-annual', 'knowledge-demo-v1', '宽基指数年度报告', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 26),
  ('doc-wealth-guide', 'knowledge-demo-v1', '理财产品通识与口径', 'vendor-docs-2026-09', '2026-09-28T09:00:00+08:00', 9),
  ('doc-writing-templates', 'knowledge-demo-v1', '智能写作素材与引用口径', 'inhouse-templates-2026-09', '2026-09-28T09:00:00+08:00', 7),
  ('doc-cash-management', 'knowledge-demo-v1', '现金管理与流动性说明', 'bank-rules-2026-09', '2026-09-28T09:00:00+08:00', 6),
  ('doc-bond-fund-review', 'knowledge-demo-v1', '债券基金季度回顾', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 11)
ON CONFLICT (document_id, knowledge_version) DO NOTHING;

INSERT INTO knowledge_chunks(chunk_id, document_id, knowledge_version, source_id, product_id, page, text, content_hash)
VALUES
  ('chunk-a500-001', 'doc-a500-quarterly', 'knowledge-demo-v1', 'research-pack-2026-09', 'fund', 3, 'A500 近期波动主要来自行业权重调整与市场风险偏好变化，观察时应区分短期波动和长期配置目标。', md5('A500 近期波动主要来自行业权重调整与市场风险偏好变化，观察时应区分短期波动和长期配置目标。')),
  ('chunk-index-annual-001', 'doc-a500-annual', 'knowledge-demo-v1', 'research-pack-2026-09', 'fund', 7, '指数成分调整按既定规则执行，跟踪误差与费率是长期持有的观察项，历史收益不代表未来表现。', md5('指数成分调整按既定规则执行，跟踪误差与费率是长期持有的观察项，历史收益不代表未来表现。')),
  ('chunk-fixed-income-001', 'doc-fixed-income-monthly', 'knowledge-demo-v1', 'research-pack-2026-09', 'wealthplus', 5, '降息预期可能支持债券部分表现，但固收+产品仍受信用利差、权益仓位和回撤控制影响，业绩比较基准不代表预期收益。', md5('降息预期可能支持债券部分表现，但固收+产品仍受信用利差、权益仓位和回撤控制影响，业绩比较基准不代表预期收益。')),
  ('chunk-wealth-001', 'doc-wealth-guide', 'knowledge-demo-v1', 'vendor-docs-2026-09', 'wealth', 2, '稳健底仓类产品以持有期与风险等级匹配为前提，页面展示的费率和收益均为演示快照字段。', md5('稳健底仓类产品以持有期与风险等级匹配为前提，页面展示的费率和收益均为演示快照字段。')),
  ('chunk-wealth-002', 'doc-wealth-guide', 'knowledge-demo-v1', 'vendor-docs-2026-09', 'wealth', 4, '产品可售状态由服务端字段给出，页面不自行推断；缺失字段如实显示未提供，不用演示数值补齐。', md5('产品可售状态由服务端字段给出，页面不自行推断；缺失字段如实显示未提供，不用演示数值补齐。')),
  ('chunk-insurance-001', 'doc-insurance-terms', 'knowledge-demo-v1', 'vendor-docs-2026-09', 'insurance', 8, '投保前需确认既往症除外责任、等待期、续保条件和免赔额，正式承保与理赔以保险公司文件和业务系统为准。', md5('投保前需确认既往症除外责任、等待期、续保条件和免赔额，正式承保与理赔以保险公司文件和业务系统为准。')),
  ('chunk-insurance-002', 'doc-insurance-terms', 'knowledge-demo-v1', 'vendor-docs-2026-09', 'insurance2', 11, '保障责任与免责条款逐条列示，演示数据中的保障额度与保费仅用于界面呈现，不构成投保建议。', md5('保障责任与免责条款逐条列示，演示数据中的保障额度与保费仅用于界面呈现，不构成投保建议。')),
  ('chunk-deposit-001', 'doc-deposit-rules', 'knowledge-demo-v1', 'bank-rules-2026-09', 'deposit', 2, '到期利息按本金乘以年利率和年数计算，提前支取按办理渠道和产品规则适用的利率计算。', md5('到期利息按本金乘以年利率和年数计算，提前支取按办理渠道和产品规则适用的利率计算。')),
  ('chunk-deposit-002', 'doc-deposit-rules', 'knowledge-demo-v1', 'bank-rules-2026-09', 'deposit2', 3, '不同期限对应不同挂牌利率，测算须传入明确期限与本金，服务端未返回该期限利率时显示空态。', md5('不同期限对应不同挂牌利率，测算须传入明确期限与本金，服务端未返回该期限利率时显示空态。')),
  ('chunk-bondfund-001', 'doc-bond-fund-review', 'knowledge-demo-v1', 'research-pack-2026-09', 'bondfund', 4, '纯债组合受利率与信用风险影响，持有期与回撤为演示快照字段，不用于推导真实业绩。', md5('纯债组合受利率与信用风险影响，持有期与回撤为演示快照字段，不用于推导真实业绩。')),
  ('chunk-bondfund-002', 'doc-bond-fund-review', 'knowledge-demo-v1', 'research-pack-2026-09', 'bondfund2', 6, '同类产品比较须统一区间与口径，口径不一致时不做优劣排名，缺失值不编造。', md5('同类产品比较须统一区间与口径，口径不一致时不做优劣排名，缺失值不编造。')),
  ('chunk-cash-001', 'doc-cash-management', 'knowledge-demo-v1', 'bank-rules-2026-09', 'cash', 2, '现金管理类产品关注快赎额度与到账时间，收益率为演示数据，页面保留演示桩标注。', md5('现金管理类产品关注快赎额度与到账时间，收益率为演示数据，页面保留演示桩标注。')),
  ('chunk-cash-002', 'doc-cash-management', 'knowledge-demo-v1', 'bank-rules-2026-09', 'cash', 4, '流动性维度用于匹配客户目标期限，服务端未返回的规模与持仓分布字段不补齐。', md5('流动性维度用于匹配客户目标期限，服务端未返回的规模与持仓分布字段不补齐。')),
  ('chunk-fund2-001', 'doc-a500-annual', 'knowledge-demo-v1', 'research-pack-2026-09', 'fund2', 12, '宽基指数联接产品的风险等级与客户风险测评匹配后才可进入候选，排序不替代适当性结论。', md5('宽基指数联接产品的风险等级与客户风险测评匹配后才可进入候选，排序不替代适当性结论。')),
  ('chunk-wealth2-001', 'doc-wealth-guide', 'knowledge-demo-v1', 'vendor-docs-2026-09', 'wealth2', 6, '短持有期产品的业绩比较基准不代表预期收益，页面不展示未由服务端提供的净值序列。', md5('短持有期产品的业绩比较基准不代表预期收益，页面不展示未由服务端提供的净值序列。')),
  ('chunk-events-001', 'doc-events-weekly', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 2, '市场事件解读：近期行业权重调整与政策信息以已发布材料为准，页面只展示服务端返回的片段、时点与来源。', md5('市场事件解读：近期行业权重调整与政策信息以已发布材料为准，页面只展示服务端返回的片段、时点与来源。')),
  ('chunk-events-002', 'doc-events-weekly', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 5, '市场事件解读：跨市场流动性变化需结合数据时点阅读，服务端未提供波动幅度时本页不补演示数值。', md5('市场事件解读：跨市场流动性变化需结合数据时点阅读，服务端未提供波动幅度时本页不补演示数值。')),
  ('chunk-macro-001', 'doc-macro-outlook', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 3, '宏观指标与利率展望：利率、通胀与就业指标以已发布报告为准，观点与事实分开表述，不构成投资建议。', md5('宏观指标与利率展望：利率、通胀与就业指标以已发布报告为准，观点与事实分开表述，不构成投资建议。')),
  ('chunk-macro-002', 'doc-macro-outlook', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 8, '宏观指标：收益率曲线形态变化用于解释固收类产品环境，页面不展示未经服务端给出的预测序列。', md5('宏观指标：收益率曲线形态变化用于解释固收类产品环境，页面不展示未经服务端给出的预测序列。')),
  ('chunk-industry-001', 'doc-industry-research', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 4, '行业研报：估值与景气度按同一口径比较，不同口径不直接排名；缺失的行业数据保持空态。', md5('行业研报：估值与景气度按同一口径比较，不同口径不直接排名；缺失的行业数据保持空态。')),
  ('chunk-industry-002', 'doc-industry-research', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 9, '行业研报：政策与产业链信息以已发布片段为准，引用可回指文档与页码。', md5('行业研报：政策与产业链信息以已发布片段为准，引用可回指文档与页码。')),
  ('chunk-reader-001', 'doc-a500-annual', 'knowledge-demo-v1', 'research-pack-2026-09', NULL, 15, '报告阅读：摘要只覆盖当前文档，引用需带文档标识与页码，文档未返回时显示显式空态。', md5('报告阅读：摘要只覆盖当前文档，引用需带文档标识与页码，文档未返回时显示显式空态。')),
  ('chunk-writing-001', 'doc-writing-templates', 'knowledge-demo-v1', 'inhouse-templates-2026-09', NULL, 3, '智能写作：草稿由已授权材料生成，正文与引用均来自服务端片段，不伪造来源或结论。', md5('智能写作：草稿由已授权材料生成，正文与引用均来自服务端片段，不伪造来源或结论。')),
  ('chunk-general-001', 'doc-wealth-guide', 'knowledge-demo-v1', 'vendor-docs-2026-09', NULL, 1, '通用研究口径说明：本演示环境使用确定性演示桩，全部内容与数值为 fixture 演示数据，不构成投资建议。', md5('通用研究口径说明：本演示环境使用确定性演示桩，全部内容与数值为 fixture 演示数据，不构成投资建议。')),
  ('chunk-general-002', 'doc-cash-management', 'knowledge-demo-v1', 'bank-rules-2026-09', NULL, 5, '通用风险揭示口径：页面保留演示桩标注，失败态由服务端真实错误驱动，空态不用默认值补齐。', md5('通用风险揭示口径：页面保留演示桩标注，失败态由服务端真实错误驱动，空态不用默认值补齐。'))
ON CONFLICT (chunk_id, knowledge_version) DO NOTHING;
