import {
  CONCENTRATION_BASIS,
  HOLDING_RETURN_BASIS,
  HOLDING_RETURN_LEVEL,
  PORTFOLIO_CALCULATION_VERSION,
  computePortfolio
} from '../../ai-orchestration/domain/portfolioCalculation.js';
import { toBoundedNumber, toOptionalNumber } from '../../../platform/numeric/numericValue.js';

// P-15：持仓收益 / 收益贡献 / 集中度的只读计算口径（无副作用、不写会话）。
//
// 分母口径（必须与页面文案一致，不可混用）：
// - all_assets     = 全部持仓市值；max_concentration（跨产品最大权重，当前 41.76%）
// - equity_assets  = 权益类持仓市值（type='基金' 或 role 含“权益”）；
//                    equity.max_concentration 才是“单只宽基基金占权益资产 68%”这类口径
// 保险保费（products.annual_premium）不在 holdings 内，不进入任何金额合计。
//
// 授权：与 GET /api/demo-data 同一规则——未授权时只返回总数口径字段，holdings 明细为空、
// equity/return 标记不可用，不回显任何客户明细。
export const DENOMINATOR_BASIS = CONCENTRATION_BASIS;

const CALCULATION_CONVENTIONS = Object.freeze({
  currency: 'CNY',
  amount_unit: '元',
  ratio_unit: '小数（0.4176 = 41.76%）',
  rounding: { amount: '2 位小数', ratio: '6 位小数' },
  concentration_basis: {
    all_assets: '分母 = 全部持仓市值（保险保费不在 holdings 内，不参与合计）',
    equity_assets: "分母 = 权益类持仓市值（产品 type='基金' 或 role 含“权益”）；无权益持仓时不可用"
  },
  holding_return: {
    basis: HOLDING_RETURN_BASIS,
    level: HOLDING_RETURN_LEVEL,
    description: '收益金额 = 现值 × return_rate / (1 + return_rate)，按成本还原估算；不含现金分红与交易流水'
  }
});

function unavailableCalculation({ reason, dataAsOf }) {
  return {
    calculation_id: null,
    calculation_version: PORTFOLIO_CALCULATION_VERSION,
    data_as_of: dataAsOf || null,
    currency: 'CNY',
    total_amount: null,
    weights: [],
    max_concentration: null,
    max_concentration_basis: DENOMINATOR_BASIS.ALL_ASSETS,
    positions: [],
    equity: { available: false, unavailable_reason: reason, amount: null, share_of_total: null, count: 0, concentrations: [], max_concentration: null, max_concentration_basis: null },
    holding_return: { available: false, unavailable_reason: reason, basis: HOLDING_RETURN_BASIS, level: HOLDING_RETURN_LEVEL, amount: null, rate: null }
  };
}

// 金额上限：与存款本金上限同一数量级（1 万亿元），只用于挡掉明显污染的脏数据。
export const PORTFOLIO_MAX_AMOUNT = 1e12;

/**
 * 数据源数值归一（database 模式下 pg 的 NUMERIC 列以字符串返回，fixture 下是 number）。
 * 在进入确定性计算前把 holdings.amount / holdings.return_rate 转成 number：
 * - amount 必填、有限、>= 0 且 <= PORTFOLIO_MAX_AMOUNT；null/''/非数字 → 400 VALIDATION_ERROR，
 *   不再让下游把字符串当成“无效持仓金额”并抛出 422。
 * - return_rate 允许 NULL（=缺少收益基准）；但存在却不是数字时同样 400，绝不当作缺失掩盖脏数据。
 * 只做类型归一：数值本身、持仓顺序、calculation_id 的输入结构都不变，fixture 结果保持逐字节一致。
 */
function normalizeHoldingFacts(holdings) {
  return holdings.map((holding) => {
    const id = holding?.id || holding?.holding_id;
    const field = `holdings.amount[${id}]`;
    return {
      ...holding,
      amount: toBoundedNumber(holding?.amount, { field, minimum: 0, maximum: PORTFOLIO_MAX_AMOUNT }),
      return_rate: toOptionalNumber(holding?.return_rate, { field: `holdings.return_rate[${id}]` })
    };
  });
}

export class PortfolioService {
  constructor({ dataService }) {
    this.dataService = dataService;
  }

  /**
   * 签名：await portfolio.calculate({ customerId?, authorized = false })
   * 返回：{ available, unavailable_reason, data_version, data_as_of, calculation{...}, basis, conventions }
   * - available=true 时 calculation.calculation_id 与证据包 portfolio 计算同源（同一持仓 → 同一 ID）
   * - 空持仓：available=false, unavailable_reason='no_holdings'（页面应显示“暂无持仓”，不显示 0 元）
   */
  async calculate({ customerId, authorized = false } = {}) {
    const snapshot = await this.dataService.getCustomerContext({ customerId, authorized });
    const base = { data_version: snapshot.data_version || null, data_as_of: snapshot.data_as_of || null };
    if (!authorized || snapshot.customer?.authorized !== true) {
      return {
        available: false,
        unavailable_reason: 'unauthorized',
        ...base,
        calculation: unavailableCalculation({ reason: 'unauthorized', dataAsOf: snapshot.data_as_of }),
        basis: DENOMINATOR_BASIS,
        conventions: CALCULATION_CONVENTIONS
      };
    }
    if (!Array.isArray(snapshot.holdings) || !snapshot.holdings.length) {
      return {
        available: false,
        unavailable_reason: 'no_holdings',
        ...base,
        calculation: unavailableCalculation({ reason: 'no_holdings', dataAsOf: snapshot.data_as_of }),
        basis: DENOMINATOR_BASIS,
        conventions: CALCULATION_CONVENTIONS
      };
    }
    const calculation = computePortfolio({ holdings: normalizeHoldingFacts(snapshot.holdings), products: snapshot.products, dataAsOf: snapshot.data_as_of });
    return {
      available: true,
      unavailable_reason: null,
      ...base,
      calculation,
      basis: DENOMINATOR_BASIS,
      conventions: CALCULATION_CONVENTIONS
    };
  }
}
