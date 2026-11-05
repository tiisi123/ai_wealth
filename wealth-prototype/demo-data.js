/* 财富智服 · 演示会话（仅内存，刷新重置，禁止持久化写） */
(function (global) {
  const AS_OF = '2026-09-28';
  const AS_OF_FULL = '2026-09-28 09:30';

  const PRODUCTS = {
    wealth: {
      id: 'wealth',
      name: '稳盈固收180天',
      short: '稳盈固收',
      type: '理财',
      risk: 'R2',
      role: '稳健底仓',
      ret: '3.62%',
      drawdown: '-0.42%',
      liquidity: '180 天持有期',
      fee: '0.20% 管理费',
      match: '92%',
      detail: '理财 · R2 · 业绩比较基准 2.80%–4.20%'
    },
    fund: {
      id: 'fund',
      name: '易方达中证A500联接A',
      short: 'A500',
      type: '基金',
      risk: 'R3',
      role: '权益增长',
      ret: '18.42%',
      drawdown: '-9.80%',
      liquidity: '工作日可申赎',
      fee: '0.60% 管理费',
      match: '87%',
      detail: '基金 · R3 · 宽基指数'
    },
    deposit: {
      id: 'deposit',
      name: '安心定期3年',
      short: '安心定期',
      type: '存款',
      risk: 'R1',
      role: '确定性现金',
      ret: '2.15%',
      drawdown: '—',
      liquidity: '提前支取按活期',
      fee: '无管理费',
      match: '84%',
      detail: '存款 · R1 · 挂牌年利率 2.15%'
    },
    insurance: {
      id: 'insurance',
      name: '安享长期医疗',
      short: '安享医疗',
      type: '保险',
      risk: '保障',
      role: '医疗保障',
      ret: '保障型',
      drawdown: '—',
      liquidity: '长期保障',
      fee: '年缴 ¥3,280',
      match: '78%',
      detail: '保险 · 保障额度 ¥4,000,000'
    },
    bondfund: {
      id: 'bondfund',
      name: '华安稳健增利 12 个月',
      short: '华安稳健',
      type: '基金',
      risk: 'R2',
      role: '稳健底仓',
      ret: '4.08%',
      drawdown: '-1.12%',
      liquidity: '12 个月持有期',
      fee: '0.45% 管理费',
      match: '80%',
      detail: '固收+ · R2 · 持有期 12 个月'
    },
    wealthplus: {
      id: 'wealthplus',
      name: '安盈精选固收+',
      short: '安盈精选',
      type: '理财',
      risk: 'R3',
      role: '收益增强',
      ret: '5.18%',
      drawdown: '-2.40%',
      liquidity: '12 个月',
      fee: '0.50% 管理费',
      match: '83%',
      detail: '理财 · R3 · 业绩比较基准 3.00%–5.50%'
    },
    cash: {
      id: 'cash',
      name: '天天利现金管理',
      short: '天天利',
      type: '理财',
      risk: 'R1',
      role: '现金管理',
      ret: '1.82%',
      drawdown: '—',
      liquidity: '工作日快赎',
      fee: '0.15% 管理费',
      match: '90%',
      detail: '理财 · R1 · 现金管理 · 不保证本金'
    }
  };

  const HOLDINGS = [
    { id: 'fund', name: '易方达中证A500联接A', type: '基金', amount: '¥168,420', ret: '+18.42%' },
    { id: 'wealth', name: '稳盈固收180天', type: '理财', amount: '¥250,000', ret: '+3.62%' },
    { id: 'deposit', name: '安心定期3年', type: '存款', amount: '¥300,000', ret: '+2.15%' }
  ];

  const DEFAULT_GOAL = {
    amount: '¥500,000',
    term: '3–5 年',
    risk: 'R3 平衡型',
    purpose: '教育金储备',
    liquidity: '大部分可长期投资'
  };

  const DEFAULT_PLAN = { cash: 20, bond: 50, equity: 20, protection: 10 };
  const DEFAULT_CANDIDATE_IDS = ['wealth', 'fund', 'deposit'];

  const DEFAULT_ANSWER = {
    text: '从你当前组合看，存款和固收提供了稳定性，权益基金贡献了主要收益。A500 近期波动上升，建议先确认资金使用时间，再决定是否调整。',
    sources: ['数据时点：' + AS_OF, '持仓诊断报告']
  };

  const DEFAULT_RESEARCH = {
    question: '美联储降息对黄金和固收+产品可能有什么影响？',
    text: '先给结论：如果降息节奏符合市场预期，黄金通常受实际利率下行支撑，固收+的债券部分可能受益；但结论取决于通胀、美元和风险偏好变化。以下内容为研究参考，不构成投资建议。',
    sources: ['宏观日报 ' + AS_OF, '贵金属周报 2026-09-26', '固收+策略月报']
  };

  function initial() {
    return {
      asOf: AS_OF,
      asOfFull: AS_OF_FULL,
      customerName: '林女士',
      authorized: true,
      qualified: false,
      lastQuestion: '',
      lastAnswer: null,
      diagnosis: null,
      goal: Object.assign({}, DEFAULT_GOAL),
      plan: null,
      candidates: [],
      compareSet: [],
      compareSaved: false,
      careSubmitted: false,
      holdingsExpanded: false,
      researchAnswer: null,
      researchUsedInCandidates: false,
      selectPoolSynced: false,
      acceptanceAdvanced: false,
      role: '投顾 / 财富管理',
      contactTodo: false,
      remindCreated: false,
      reviewReady: false,
      landing: null,
      promptError: '',
      authNotice: '',
      viewFilter: {},
      uiState: {}
    };
  }

  let state = initial();

  const api = {
    PRODUCTS,
    HOLDINGS,
    DEFAULT_GOAL,
    DEFAULT_PLAN,
    DEFAULT_CANDIDATE_IDS,
    DEFAULT_ANSWER,
    DEFAULT_RESEARCH,
    AS_OF,
    AS_OF_FULL,
    reset() {
      state = initial();
      return state;
    },
    get() {
      return state;
    },
    patch(p) {
      Object.assign(state, p);
      return state;
    },
    product(id) {
      return PRODUCTS[id] || null;
    },
    ensureCandidates() {
      if (!state.candidates.length) {
        state.candidates = DEFAULT_CANDIDATE_IDS.slice();
      }
      return state.candidates;
    },
    addCompare(id) {
      if (!id || !PRODUCTS[id]) return state.compareSet;
      if (!state.compareSet.includes(id)) {
        if (state.compareSet.length >= 3) state.compareSet.shift();
        state.compareSet.push(id);
      }
      return state.compareSet;
    },
    goalLabel() {
      const g = state.goal || DEFAULT_GOAL;
      return `${g.risk} · ${g.term} · ${g.purpose} · ${g.amount}`;
    }
  };

  global.DemoSession = api;
})(window);
