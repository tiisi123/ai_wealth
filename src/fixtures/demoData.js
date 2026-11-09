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
    id: 'wealth', name: '稳盈固收180天', type: '理财', risk: 'R2', role: '稳健底仓',
    latest_return: 0.0362, drawdown: -0.0042, annual_rate: null, fee: 0.002,
    coverage: null, annual_premium: null, liquidity: '180 天持有期', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'fund', name: '易方达中证A500联接A', type: '基金', risk: 'R3', role: '权益增长',
    latest_return: 0.1842, drawdown: -0.098, annual_rate: null, fee: 0.006,
    coverage: null, annual_premium: null, liquidity: '工作日可申赎', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'deposit', name: '安心定期3年', type: '存款', risk: 'R1', role: '确定性现金',
    latest_return: null, drawdown: null, annual_rate: 0.0215, fee: 0,
    coverage: null, annual_premium: null, liquidity: '提前支取按活期', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'insurance', name: '安享长期医疗', type: '保险', risk: '保障', role: '医疗保障',
    latest_return: null, drawdown: null, annual_rate: null, fee: null,
    coverage: 4000000, annual_premium: 3280, liquidity: '长期保障', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'bondfund', name: '华安稳健增利 12 个月', type: '基金', risk: 'R2', role: '稳健底仓',
    latest_return: 0.0408, drawdown: -0.0112, annual_rate: null, fee: 0.0045,
    coverage: null, annual_premium: null, liquidity: '12 个月持有期', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'wealthplus', name: '安盈精选固收+', type: '理财', risk: 'R3', role: '收益增强',
    latest_return: 0.0518, drawdown: -0.024, annual_rate: null, fee: 0.005,
    coverage: null, annual_premium: null, liquidity: '12 个月', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'cash', name: '天天利现金管理', type: '理财', risk: 'R1', role: '现金管理',
    latest_return: 0.0182, drawdown: null, annual_rate: null, fee: 0.0015,
    coverage: null, annual_premium: null, liquidity: '工作日快赎', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'fund2', name: '沪深300ETF联接C', type: '基金', risk: 'R3', role: '权益均衡',
    latest_return: 0.1526, drawdown: -0.113, annual_rate: null, fee: 0.0055,
    coverage: null, annual_premium: null, liquidity: '工作日可申赎', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'bondfund2', name: '南方纯债A', type: '基金', risk: 'R2', role: '稳健底仓',
    latest_return: 0.0331, drawdown: -0.0088, annual_rate: null, fee: 0.0035,
    coverage: null, annual_premium: null, liquidity: '6 个月持有期', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'wealth2', name: '稳盈现金90天', type: '理财', risk: 'R1', role: '现金管理',
    latest_return: 0.0246, drawdown: -0.0015, annual_rate: null, fee: 0.0018,
    coverage: null, annual_premium: null, liquidity: '90 天持有期', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'insurance2', name: '安心重疾保障计划', type: '保险', risk: '保障', role: '重疾保障',
    latest_return: null, drawdown: null, annual_rate: null, fee: null,
    coverage: 800000, annual_premium: 4680, liquidity: '长期保障', sale_status: 'ON_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  },
  {
    id: 'deposit2', name: '安心定期1年', type: '存款', risk: 'R1', role: '确定性现金',
    latest_return: null, drawdown: null, annual_rate: 0.0155, fee: 0,
    coverage: null, annual_premium: null, liquidity: '提前支取按活期', sale_status: 'OFF_SALE',
    source_id: 'vendor-product-2026-09-28', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`
  }
];

export const holdings = [
  { id: 'holding-001', customer_id: customer.id, product_id: 'fund', amount: 168420, return_rate: 0.1842, source_id: 'inhouse-standard-package', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00` },
  { id: 'holding-002', customer_id: customer.id, product_id: 'wealth', amount: 250000, return_rate: 0.0362, source_id: 'inhouse-standard-package', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00` },
  { id: 'holding-003', customer_id: customer.id, product_id: 'deposit', amount: 300000, return_rate: 0.0215, source_id: 'inhouse-standard-package', source_timestamp: `${DATA_AS_OF}T09:00:00+08:00` }
];

export const knowledgeChunks = [
  {
    chunk_id: 'chunk-a500-001', document_id: 'doc-a500-quarterly', title: 'A500 季报与风险说明',
    source_id: 'research-pack-2026-09', product_id: 'fund',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 3,
    text: 'A500 近期波动主要来自行业权重调整与市场风险偏好变化，观察时应区分短期波动和长期配置目标。', score: 0.91
  },
  {
    chunk_id: 'chunk-index-annual-001', document_id: 'doc-a500-annual', title: '宽基指数年度报告',
    source_id: 'research-pack-2026-09', product_id: 'fund',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 7,
    text: '指数成分调整按既定规则执行，跟踪误差与费率是长期持有的观察项，历史收益不代表未来表现。', score: 0.9
  },
  {
    chunk_id: 'chunk-fixed-income-001', document_id: 'doc-fixed-income-monthly', title: '固收+策略月报',
    source_id: 'research-pack-2026-09', product_id: 'wealthplus',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 5,
    text: '降息预期可能支持债券部分表现，但固收+产品仍受信用利差、权益仓位和回撤控制影响，业绩比较基准不代表预期收益。', score: 0.88
  },
  {
    chunk_id: 'chunk-wealth-001', document_id: 'doc-wealth-guide', title: '理财产品通识与口径',
    source_id: 'vendor-docs-2026-09', product_id: 'wealth',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 2,
    text: '稳健底仓类产品以持有期与风险等级匹配为前提，页面展示的费率和收益均为演示快照字段。', score: 0.87
  },
  {
    chunk_id: 'chunk-wealth-002', document_id: 'doc-wealth-guide', title: '理财产品通识与口径',
    source_id: 'vendor-docs-2026-09', product_id: 'wealth',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 4,
    text: '产品可售状态由服务端字段给出，页面不自行推断；缺失字段如实显示未提供，不用演示数值补齐。', score: 0.86
  },
  {
    chunk_id: 'chunk-insurance-001', document_id: 'doc-insurance-terms', title: '长期医疗产品说明书',
    source_id: 'vendor-docs-2026-09', product_id: 'insurance',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 8,
    text: '投保前需确认既往症除外责任、等待期、续保条件和免赔额，正式承保与理赔以保险公司文件和业务系统为准。', score: 0.86
  },
  {
    chunk_id: 'chunk-insurance-002', document_id: 'doc-insurance-terms', title: '长期医疗产品说明书',
    source_id: 'vendor-docs-2026-09', product_id: 'insurance2',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 11,
    text: '保障责任与免责条款逐条列示，演示数据中的保障额度与保费仅用于界面呈现，不构成投保建议。', score: 0.85
  },
  {
    chunk_id: 'chunk-deposit-001', document_id: 'doc-deposit-rules', title: '存款计息规则',
    source_id: 'bank-rules-2026-09', product_id: 'deposit',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 2,
    text: '到期利息按本金乘以年利率和年数计算，提前支取按办理渠道和产品规则适用的利率计算。', score: 0.84
  },
  {
    chunk_id: 'chunk-deposit-002', document_id: 'doc-deposit-rules', title: '存款计息规则',
    source_id: 'bank-rules-2026-09', product_id: 'deposit2',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 3,
    text: '不同期限对应不同挂牌利率，测算须传入明确期限与本金，服务端未返回该期限利率时显示空态。', score: 0.83
  },
  {
    chunk_id: 'chunk-bondfund-001', document_id: 'doc-bond-fund-review', title: '债券基金季度回顾',
    source_id: 'research-pack-2026-09', product_id: 'bondfund',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 4,
    text: '纯债组合受利率与信用风险影响，持有期与回撤为演示快照字段，不用于推导真实业绩。', score: 0.85
  },
  {
    chunk_id: 'chunk-bondfund-002', document_id: 'doc-bond-fund-review', title: '债券基金季度回顾',
    source_id: 'research-pack-2026-09', product_id: 'bondfund2',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 6,
    text: '同类产品比较须统一区间与口径，口径不一致时不做优劣排名，缺失值不编造。', score: 0.84
  },
  {
    chunk_id: 'chunk-cash-001', document_id: 'doc-cash-management', title: '现金管理与流动性说明',
    source_id: 'bank-rules-2026-09', product_id: 'cash',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 2,
    text: '现金管理类产品关注快赎额度与到账时间，收益率为演示数据，页面保留演示桩标注。', score: 0.83
  },
  {
    chunk_id: 'chunk-cash-002', document_id: 'doc-cash-management', title: '现金管理与流动性说明',
    source_id: 'bank-rules-2026-09', product_id: 'cash',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 4,
    text: '流动性维度用于匹配客户目标期限，服务端未返回的规模与持仓分布字段不补齐。', score: 0.82
  },
  {
    chunk_id: 'chunk-fund2-001', document_id: 'doc-a500-annual', title: '宽基指数年度报告',
    source_id: 'research-pack-2026-09', product_id: 'fund2',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 12,
    text: '宽基指数联接产品的风险等级与客户风险测评匹配后才可进入候选，排序不替代适当性结论。', score: 0.85
  },
  {
    chunk_id: 'chunk-wealth2-001', document_id: 'doc-wealth-guide', title: '理财产品通识与口径',
    source_id: 'vendor-docs-2026-09', product_id: 'wealth2',
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 6,
    text: '短持有期产品的业绩比较基准不代表预期收益，页面不展示未由服务端提供的净值序列。', score: 0.82
  },
  {
    chunk_id: 'chunk-events-001', document_id: 'doc-events-weekly', title: '市场事件周报',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 2,
    text: '市场事件解读：近期行业权重调整与政策信息以已发布材料为准，页面只展示服务端返回的片段、时点与来源。', score: 0.89
  },
  {
    chunk_id: 'chunk-events-002', document_id: 'doc-events-weekly', title: '市场事件周报',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 5,
    text: '市场事件解读：跨市场流动性变化需结合数据时点阅读，服务端未提供波动幅度时本页不补演示数值。', score: 0.88
  },
  {
    chunk_id: 'chunk-macro-001', document_id: 'doc-macro-outlook', title: '宏观指标与利率展望',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 3,
    text: '宏观指标与利率展望：利率、通胀与就业指标以已发布报告为准，观点与事实分开表述，不构成投资建议。', score: 0.89
  },
  {
    chunk_id: 'chunk-macro-002', document_id: 'doc-macro-outlook', title: '宏观指标与利率展望',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 8,
    text: '宏观指标：收益率曲线形态变化用于解释固收类产品环境，页面不展示未经服务端给出的预测序列。', score: 0.87
  },
  {
    chunk_id: 'chunk-industry-001', document_id: 'doc-industry-research', title: '行业研报汇编',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 4,
    text: '行业研报：估值与景气度按同一口径比较，不同口径不直接排名；缺失的行业数据保持空态。', score: 0.88
  },
  {
    chunk_id: 'chunk-industry-002', document_id: 'doc-industry-research', title: '行业研报汇编',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 9,
    text: '行业研报：政策与产业链信息以已发布片段为准，引用可回指文档与页码。', score: 0.87
  },
  {
    chunk_id: 'chunk-reader-001', document_id: 'doc-a500-annual', title: '宽基指数年度报告',
    source_id: 'research-pack-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 15,
    text: '报告阅读：摘要只覆盖当前文档，引用需带文档标识与页码，文档未返回时显示显式空态。', score: 0.86
  },
  {
    chunk_id: 'chunk-writing-001', document_id: 'doc-writing-templates', title: '智能写作素材与引用口径',
    source_id: 'inhouse-templates-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 3,
    text: '智能写作：草稿由已授权材料生成，正文与引用均来自服务端片段，不伪造来源或结论。', score: 0.86
  },
  {
    chunk_id: 'chunk-general-001', document_id: 'doc-wealth-guide', title: '理财产品通识与口径',
    source_id: 'vendor-docs-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 1,
    text: '通用研究口径说明：本演示环境使用确定性演示桩，全部内容与数值为 fixture 演示数据，不构成投资建议。', score: 0.9
  },
  {
    chunk_id: 'chunk-general-002', document_id: 'doc-cash-management', title: '现金管理与流动性说明',
    source_id: 'bank-rules-2026-09', product_id: null,
    source_timestamp: `${DATA_AS_OF}T09:00:00+08:00`, page: 5,
    text: '通用风险揭示口径：页面保留演示桩标注，失败态由服务端真实错误驱动，空态不用默认值补齐。', score: 0.88
  }
];

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
