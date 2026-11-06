import { ValidationError } from '../../platform/http/errors.js';

// W1 波次 3 · contract 只读派生投影。
//
// 定位：本文件只做「已有事实 → 只读视图」的派生，不持久化任何新状态、不新增会话状态 key、
// 不新增命令、不改 PATCH 白名单。所有输出只放在只读响应的独立命名空间
// （readonly_projections），既不写回会话 state，也不与既有状态 key 同名，因此
// docs/api-contract.md「共享会话状态契约（W1 冻结）」的 36/19/7/11 集合保持不变。
//
// 红线：
// - 不伪造金额：没有服务端事实的字段一律显式置 null 并给出 unavailable_reason 或空态标记；
// - 授权前置与 GET /api/demo-data 完全一致（同一 sessionService.get + state.authorized 判定），
//   未授权时只返回可公开的布尔标识与空列表，不回显任何客户明细；
// - 无法用的口径返回 null，不返回 0。

// ---------------------------------------------------------------------------
// 授权前置（与 controllers.demoData 同一规则，集中在一处以避免两处漂移）
// ---------------------------------------------------------------------------
export async function resolveReadonlyPrincipal({ config, sessionService, query, defaultCustomerId = 'customer-001' }) {
  if (query?.session_id) {
    const session = await sessionService.get(ensureSessionId(query.session_id));
    return { customerId: session.customer_id, authorized: session.state.authorized === true, session };
  }
  if (config.DATA_MODE === 'database') {
    throw new ValidationError('生产数据查询必须携带有效 session_id');
  }
  // fixture 模式：与 GET /api/demo-data 一致，无 session 时按默认客户并以 authorized=true 取快照；
  // 服务层仍会用 snapshot.customer.authorized 二次校验。
  return { customerId: defaultCustomerId, authorized: config.DATA_MODE === 'fixture', session: null };
}

// 与 controllers.ensureUuid 同口径的 session_id 校验；保持本地实现以免循环依赖。
function ensureSessionId(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))) {
    throw new ValidationError('session_id 必须是 UUID');
  }
  return value;
}

// ---------------------------------------------------------------------------
// 合格投资者认定（§8.1 #2）只读投影
// ---------------------------------------------------------------------------
// 语义区分（A13）：
// - authorized：客户数据授权，决定能否读取客户持仓/计划等明细（详见 docs/api-contract.md）；
// - qualified：合格投资者认定，决定能否展示受限产品材料（PE6 等）。
// 两者不是同一件事：授权不等于认定，未授权也不代表未认定。
// 当前数据快照没有任何认定来源（products/holdings/customers 均无认定字段），
// 因此这里只派生「能否据此判定」，绝不把 authorized 当作认定结论。
export const QUALIFIED_SOURCE_FIELD = 'customer.qualified';
export const QUALIFIED_PROJECTION_KEY = 'readonly_projections.qualified_status';

export function projectQualifiedStatus({ customer, authorized }) {
  const hasSource = customer && Object.hasOwn(customer, 'qualified') && typeof customer.qualified === 'boolean';
  return {
    key: QUALIFIED_PROJECTION_KEY,
    status: hasSource ? (customer.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED') : 'UNKNOWN',
    qualified: hasSource ? customer.qualified : null,
    basis: hasSource ? QUALIFIED_SOURCE_FIELD : null,
    source_available: hasSource,
    unavailable_reason: hasSource ? null : 'no_qualified_source',
    // 浏览器永远不可写：本字段只出现在只读响应中，不在 SESSION_PATCH_FIELDS / 状态 key 内。
    writable: false,
    data_authorized: authorized === true,
    // 受限材料展示门禁：只有拿到明确的「已认定」事实才放行，其余一律拒绝且不返回部分内容。
    restricted_materials_allowed: hasSource && customer.qualified === true,
    note: '认定状态需数据侧提供 customer.qualified 等权威来源；当前快照无该字段，故为 UNKNOWN，不得用 authorized 代替'
  };
}

// ---------------------------------------------------------------------------
// 保单 / 保障缺口（§8.1 #6）只读投影
// ---------------------------------------------------------------------------
// 数据现状：products 中 type='保险' 的记录只有产品事实（coverage、annual_premium），
// 没有保单级字段（policy_id、生效日、覆盖度、缺口），因此：
// - 有保险产品 → 派生产品级 fact 列表（policy_id 为 null，明确标注不是保单）；
// - 无保险产品 → 显式空态；
// - 保障缺口没有计算口径 → coverage_gap 恒为 unavailable，绝不编造金额。
export const INSURANCE_PRODUCT_TYPE = '保险';

function normalizeLimit(value) {
  if (value === undefined) return 50;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) throw new ValidationError('limit 必须为大于 0 的整数');
  return Math.min(Math.floor(parsed), 100);
}

export function projectInsuranceCoverage({ products, authorized, limit }) {
  const maxItems = normalizeLimit(limit);
  const insuranceProducts = (products || []).filter((product) => product?.type === INSURANCE_PRODUCT_TYPE);
  if (authorized !== true) {
    return {
      available: false,
      unavailable_reason: 'unauthorized',
      message: '未授权或暂无可展示保单',
      policies: [],
      facts: [],
      item_count: null,
      source: 'products(type=保险)',
      coverage_gap: gapUnavailable('unauthorized')
    };
  }
  if (!insuranceProducts.length) {
    return {
      available: false,
      unavailable_reason: 'no_insurance_products',
      message: '未授权或暂无可展示保单',
      policies: [],
      facts: [],
      item_count: 0,
      source: 'products(type=保险)',
      coverage_gap: gapUnavailable('no_insurance_products')
    };
  }
  const facts = insuranceProducts.slice(0, maxItems).map((product) => ({
    // 产品事实 ≠ 保单：没有保单号/生效日，policy_id 必须为 null。
    policy_id: null,
    product_id: product.id,
    product_name: product.name || null,
    // 以下两项来自 products 的产品事实；缺失即 null，不由前端或服务端补值。
    coverage: Number.isFinite(product.coverage) ? product.coverage : null,
    annual_premium: Number.isFinite(product.annual_premium) ? product.annual_premium : null,
    sale_status: product.sale_status || null,
    source_id: product.source_id || null,
    source_timestamp: product.source_timestamp || null,
    fact_kind: 'product_fact',
    note: '这是保险产品事实，不是保单记录；保单号、生效日与保障缺口需数据侧新增来源'
  }));
  return {
    available: true,
    unavailable_reason: null,
    message: null,
    policies: [],
    facts,
    item_count: facts.length,
    source: 'products(type=保险)',
    coverage_gap: gapUnavailable('no_gap_source')
  };
}

function gapUnavailable(reason) {
  return { available: false, unavailable_reason: reason, gap_amount: null, status: null, message: '暂无保障缺口计算口径' };
}

// ---------------------------------------------------------------------------
// 会话级只读投影汇总（GET /api/demo-data · GET /api/knowledge 共用）
// ---------------------------------------------------------------------------
export function buildReadonlyProjections({ snapshot, authorized, insuranceLimit }) {
  return {
    qualified_status: projectQualifiedStatus({ customer: snapshot.customer, authorized }),
    insurance_coverage: projectInsuranceCoverage({ products: snapshot.products, authorized, limit: insuranceLimit })
  };
}
