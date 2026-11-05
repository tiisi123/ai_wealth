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
  ('fund', 'demo-2026-09-28-v1', '易方达中证A500联接A', '基金', 'R3', '权益增长', 0.1842, -0.0980, NULL, 0.006, NULL, NULL, '工作日可申赎', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('deposit', 'demo-2026-09-28-v1', '安心定期3年', '存款', 'R1', '确定性现金', NULL, NULL, 0.0215, 0, NULL, NULL, '提前支取按活期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('insurance', 'demo-2026-09-28-v1', '安享长期医疗', '保险', '保障', '医疗保障', NULL, NULL, NULL, NULL, 4000000, 3280, '长期保障', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('bondfund', 'demo-2026-09-28-v1', '华安稳健增利 12 个月', '基金', 'R2', '稳健底仓', 0.0408, -0.0112, NULL, 0.0045, NULL, NULL, '12 个月持有期', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('wealthplus', 'demo-2026-09-28-v1', '安盈精选固收+', '理财', 'R3', '收益增强', 0.0518, -0.0240, NULL, 0.005, NULL, NULL, '12 个月', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00'),
  ('cash', 'demo-2026-09-28-v1', '天天利现金管理', '理财', 'R1', '现金管理', 0.0182, NULL, NULL, 0.0015, NULL, NULL, '工作日快赎', 'ON_SALE', 'vendor-product-2026-09-28', '2026-09-28T09:00:00+08:00')
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
  ('deposit-interest-simple', 'rules-demo-v1', '存款到期利息测算', 'deposit_calculation', '["principal","annual_rate","years"]', '["principal > 0","annual_rate >= 0","years > 0"]', '{"formula":"principal * annual_rate * years"}', TRUE)
ON CONFLICT (rule_id, rule_version) DO UPDATE SET name = EXCLUDED.name, action = EXCLUDED.action, enabled = EXCLUDED.enabled;

INSERT INTO knowledge_versions(version, embedding_model, vector_dim, status, activated_at)
VALUES ('knowledge-demo-v1', 'pending-real-embedding', 1536, 'STAGING', NULL)
ON CONFLICT (version) DO NOTHING;

INSERT INTO knowledge_documents(document_id, knowledge_version, title, source_id, source_timestamp, page_count)
VALUES
  ('doc-a500-quarterly', 'knowledge-demo-v1', 'A500 季报与风险说明', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 10),
  ('doc-fixed-income-monthly', 'knowledge-demo-v1', '固收+策略月报', 'research-pack-2026-09', '2026-09-28T09:00:00+08:00', 12),
  ('doc-insurance-terms', 'knowledge-demo-v1', '长期医疗产品说明书', 'vendor-docs-2026-09', '2026-09-28T09:00:00+08:00', 18),
  ('doc-deposit-rules', 'knowledge-demo-v1', '存款计息规则', 'bank-rules-2026-09', '2026-09-28T09:00:00+08:00', 5)
ON CONFLICT (document_id, knowledge_version) DO NOTHING;

INSERT INTO knowledge_chunks(chunk_id, document_id, knowledge_version, source_id, product_id, page, text, content_hash)
VALUES
  ('chunk-a500-001', 'doc-a500-quarterly', 'knowledge-demo-v1', 'research-pack-2026-09', 'fund', 3, 'A500 近期波动主要来自行业权重调整与市场风险偏好变化，观察时应区分短期波动和长期配置目标。', md5('A500 近期波动主要来自行业权重调整与市场风险偏好变化，观察时应区分短期波动和长期配置目标。')),
  ('chunk-fixed-income-001', 'doc-fixed-income-monthly', 'knowledge-demo-v1', 'research-pack-2026-09', 'wealthplus', 5, '降息预期可能支持债券部分表现，但固收+产品仍受信用利差、权益仓位和回撤控制影响，业绩比较基准不代表预期收益。', md5('降息预期可能支持债券部分表现，但固收+产品仍受信用利差、权益仓位和回撤控制影响，业绩比较基准不代表预期收益。')),
  ('chunk-insurance-001', 'doc-insurance-terms', 'knowledge-demo-v1', 'vendor-docs-2026-09', 'insurance', 8, '投保前需确认既往症除外责任、等待期、续保条件和免赔额，正式承保与理赔以保险公司文件和业务系统为准。', md5('投保前需确认既往症除外责任、等待期、续保条件和免赔额，正式承保与理赔以保险公司文件和业务系统为准。')),
  ('chunk-deposit-001', 'doc-deposit-rules', 'knowledge-demo-v1', 'bank-rules-2026-09', 'deposit', 2, '到期利息按本金乘以年利率和年数计算，提前支取按办理渠道和产品规则适用的利率计算。', md5('到期利息按本金乘以年利率和年数计算，提前支取按办理渠道和产品规则适用的利率计算。'))
ON CONFLICT (chunk_id, knowledge_version) DO NOTHING;
