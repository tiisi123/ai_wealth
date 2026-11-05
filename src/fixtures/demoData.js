export const DATA_AS_OF = '2026-09-28';
export const DATA_AS_OF_FULL = '2026-09-28 09:30';
export const DATA_VERSION = 'demo-2026-09-28-v1';
export const KNOWLEDGE_VERSION = 'knowledge-demo-v1';
export const RULE_VERSION = 'rules-demo-v1';

export const customer = {
  id: 'customer-001',
  name: '林女士',
  risk_level: 'R3',
  region: '上海',
  authorized: true,
  data_as_of: DATA_AS_OF
};

export const products = [
  {
    id: 'wealth',
    name: '稳盈固收180天',
    type: '理财',
    risk: 'R2',
    role: '稳健底仓',
    latest_return: 0.0362,
    drawdown: -0.0042,
    liquidity: '180 天持有期',
    fee: 0.002,
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'fund',
    name: '易方达中证A500联接A',
    type: '基金',
    risk: 'R3',
    role: '权益增长',
    latest_return: 0.1842,
    drawdown: -0.098,
    liquidity: '工作日可申赎',
    fee: 0.006,
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'deposit',
    name: '安心定期3年',
    type: '存款',
    risk: 'R1',
    role: '确定性现金',
    annual_rate: 0.0215,
    liquidity: '提前支取按活期',
    fee: 0,
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'insurance',
    name: '安享长期医疗',
    type: '保险',
    risk: '保障',
    role: '医疗保障',
    coverage: 4000000,
    annual_premium: 3280,
    liquidity: '长期保障',
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'bondfund',
    name: '华安稳健增利 12 个月',
    type: '基金',
    risk: 'R2',
    role: '稳健底仓',
    latest_return: 0.0408,
    drawdown: -0.0112,
    liquidity: '12 个月持有期',
    fee: 0.0045,
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'wealthplus',
    name: '安盈精选固收+',
    type: '理财',
    risk: 'R3',
    role: '收益增强',
    latest_return: 0.0518,
    drawdown: -0.024,
    liquidity: '12 个月',
    fee: 0.005,
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'cash',
    name: '天天利现金管理',
    type: '理财',
    risk: 'R1',
    role: '现金管理',
    latest_return: 0.0182,
    drawdown: null,
    liquidity: '工作日快赎',
    fee: 0.0015,
    sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  }
];

export const holdings = [
  { id: 'holding-001', customer_id: customer.id, product_id: 'fund', amount: 168420, return_rate: 0.1842, source_id: 'inhouse-standard-package', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00` },
  { id: 'holding-002', customer_id: customer.id, product_id: 'wealth', amount: 250000, return_rate: 0.0362, source_id: 'inhouse-standard-package', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00` },
  { id: 'holding-003', customer_id: customer.id, product_id: 'deposit', amount: 300000, return_rate: 0.0215, source_id: 'inhouse-standard-package', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00` }
];

export const knowledgeChunks = [
  {
    chunk_id: 'chunk-a500-001',
    document_id: 'doc-a500-quarterly',
    title: 'A500 季报与风险说明',
    source_id: 'research-pack-2026-09',
    product_id: 'fund',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`,
    page: 3,
    text: 'A500 近期波动主要来自行业权重调整与市场风险偏好变化，观察时应区分短期波动和长期配置目标。',
    score: 0.91
  },
  {
    chunk_id: 'chunk-fixed-income-001',
    document_id: 'doc-fixed-income-monthly',
    title: '固收+策略月报',
    source_id: 'research-pack-2026-09',
    product_id: 'wealthplus',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`,
    page: 5,
    text: '降息预期可能支持债券部分表现，但固收+产品仍受信用利差、权益仓位和回撤控制影响，业绩比较基准不代表预期收益。',
    score: 0.88
  },
  {
    chunk_id: 'chunk-insurance-001',
    document_id: 'doc-insurance-terms',
    title: '长期医疗产品说明书',
    source_id: 'vendor-docs-2026-09',
    product_id: 'insurance',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`,
    page: 8,
    text: '投保前需确认既往症除外责任、等待期、续保条件和免赔额，正式承保与理赔以保险公司文件和业务系统为准。',
    score: 0.86
  },
  {
    chunk_id: 'chunk-deposit-001',
    document_id: 'doc-deposit-rules',
    title: '存款计息规则',
    source_id: 'bank-rules-2026-09',
    product_id: 'deposit',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`,
    page: 2,
    text: '到期利息按本金乘以年利率和年数计算，提前支取按办理渠道和产品规则适用的利率计算。',
    score: 0.84
  }
];

// Deterministic deposit-interest fixture for the deposit-interest-simple rule
// (principal * annual_rate * years). Principal is holding-003 and the rate is
// the deposit product's annual_rate, so the page calculation can be recomputed
// from seeded data alone.
export const depositInterestInputs = {
  product_id: 'deposit',
  holding_id: 'holding-003',
  principal: 300000,
  annual_rate: 0.0215,
  years: 3
};

export function defaultSessionState() {
  return {
    customerName: customer.name,
    customerId: customer.id,
    authorized: customer.authorized,
    qualified: false,
    lastQuestion: '',
    lastAnswer: null,
    diagnosis: null,
    goal: { amount: '¥500,000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资' },
    plan: null,
    candidates: [],
    compareSet: [],
    compareSaved: false,
    careSubmitted: false,
    remindCreated: false,
    reviewReady: false,
    holdingsExpanded: false,
    contactTodo: false,
    selectPoolSynced: false,
    acceptanceAdvanced: false,
    researchAnswer: null,
    researchUsedInCandidates: false,
    ruleMatch: null,
    aiStatus: null,
    promptError: '',
    authNotice: '',
    landing: null,
    role: '投顾 / 财富管理',
    aiRequests: [],
    activities: [],
    dataVersion: DATA_VERSION,
    knowledgeVersion: KNOWLEDGE_VERSION,
    ruleVersion: RULE_VERSION,
    asOf: DATA_AS_OF,
    asOfFull: DATA_AS_OF_FULL,
    viewFilter: {},
    uiState: {}
  };
}
