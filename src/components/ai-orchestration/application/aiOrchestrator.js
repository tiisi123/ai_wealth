import { createHash } from 'node:crypto';
import { ConflictError, DependencyUnavailableError, InsufficientEvidenceError, ValidationError } from '../../../platform/http/errors.js';
import { assertTaskType, sanitizeTaskInput, systemPromptFor } from '../domain/tasks.js';

const KNOWLEDGE_REQUIRED = new Set(['research_qa', 'report_summary', 'writing_draft']);
const KNOWLEDGE_OPTIONAL = new Set(['assistant_qa', 'diagnosis_explain', 'candidate_explain', 'product_explain']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeIds(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new ValidationError(`${field} 必须是非空字符串数组`);
  }
  return [...new Set(value)];
}

function redactCustomer(customer) {
  return {
    id: customer.id,
    data_id: `customer:${customer.id}`,
    risk_level: customer.risk_level,
    data_as_of: customer.data_as_of
  };
}

function holdingEvidence(holding, dataAsOf) {
  const id = holding.id || holding.holding_id;
  return {
    id,
    data_id: `holding:${id}`,
    product_id: holding.product_id,
    amount: holding.amount,
    return_rate: holding.return_rate,
    source_id: holding.source_id,
    source_timestamp: holding.source_timestamp,
    data_as_of: dataAsOf
  };
}

function productEvidence(product, dataAsOf) {
  return {
    ...product,
    data_id: `product:${product.id}`,
    source_id: product.source_id,
    source_timestamp: product.source_timestamp,
    data_as_of: dataAsOf
  };
}

// 每条结构化事实携带其对应的确定性计算结果，模型引用计算 ID 时能回到同一份证据包的数值；
// 计算仍以顶层 calculations 为准，此处只是同一对象的同源副本。生成的证据包已经带有
// 这些字段时不会被改动。
function attachCalculations(structuredFacts, calculations) {
  const byCalculationId = new Map(calculations.filter((calculation) => calculation?.calculation_id).map((calculation) => [calculation.calculation_id, calculation]));
  const portfolio = calculations.find((calculation) => Array.isArray(calculation.weights));
  const candidateCalc = calculations.find((calculation) => Array.isArray(calculation.candidate_ids));
  return {
    ...structuredFacts,
    holdings: (structuredFacts.holdings || []).map((holding) => ({
      ...holding,
      ...(portfolio ? { portfolio_calculation: byCalculationId.get(portfolio.calculation_id) } : {})
    })),
    products: (structuredFacts.products || []).map((product) => ({
      ...product,
      ...(candidateCalc && candidateCalc.candidate_ids.includes(product.id) ? { candidate_calculation: byCalculationId.get(candidateCalc.calculation_id) } : {})
    }))
  };
}

function toEvidence({ snapshot, chunks, calculations = [], rules = [] }) {
  let structuredFacts = {
    holdings: snapshot.holdings.map((holding) => holdingEvidence(holding, snapshot.data_as_of)),
    products: snapshot.products.map((product) => productEvidence(product, snapshot.data_as_of))
  };
  if (snapshot.customer) structuredFacts.customer = redactCustomer(snapshot.customer);
  structuredFacts = attachCalculations(structuredFacts, calculations);
  return {
    structured_facts: structuredFacts,
    ...(snapshot.customer ? { customer_context: { customer_id: snapshot.customer.id, risk_level: snapshot.customer.risk_level } } : {}),
    calculations: evidenceCalculations({ calculations, structured_facts: structuredFacts }),
    knowledge_chunks: chunks,
    rule_candidates: rules.map(({ rule_id, rule_version, name, applicable_scenario, required_inputs, conditions, enabled }) => ({ rule_id, rule_version, name, applicable_scenario, required_inputs, conditions, enabled }))
  };
}

// 允许的引用集合由同一函数给出：顶层 calculations 与结构化事实中嵌入的同一计算结果，
// 这样 responseEvidence 也能把模型引用过的计算 ID 归一化进 calculation_ids，而不改变引用条数。
// 程序执行成功的规则计算并入证据包，使 rule:引用与该计算 ID 都能回指本次证据。
export function finalizeEvidence(evidence, ruleResult = null) {
  const calculations = [...(evidence.calculations || [])];
  if (ruleResult?.status === 'MATCHED' && ruleResult.calculation_id && !calculations.some((item) => item.calculation_id === ruleResult.calculation_id)) {
    calculations.push({ calculation_id: ruleResult.calculation_id, rule_id: ruleResult.rule_id, rule_version: ruleResult.rule_version, result: ruleResult.result });
  }
  const finalized = {
    ...evidence,
    structured_facts: attachCalculations(evidence.structured_facts || {}, calculations),
    calculations
  };
  finalized.calculations = evidenceCalculations(finalized);
  return finalized;
}

function portfolioCalculation(holdings) {
  const inputs = holdings
    .map((holding) => ({
      holding_id: holding.id || holding.holding_id,
      product_id: holding.product_id,
      amount: Number(holding.amount)
    }))
    .sort((a, b) => String(a.holding_id).localeCompare(String(b.holding_id)));
  if (!inputs.length || inputs.some((holding) => !holding.holding_id || !Number.isFinite(holding.amount) || holding.amount < 0)) {
    throw new InsufficientEvidenceError('本地持仓计算缺少有效持仓金额', { task_type: 'diagnosis_explain' });
  }
  const total = inputs.reduce((sum, holding) => sum + holding.amount, 0);
  if (!(total > 0)) throw new InsufficientEvidenceError('投资持仓合计必须大于零', { task_type: 'diagnosis_explain' });
  const weights = inputs.map((holding) => ({
    holding_id: holding.holding_id,
    product_id: holding.product_id,
    data_id: `holding:${holding.holding_id}`,
    weight: holding.amount / total
  }));
  return {
    calculation_id: `portfolio-${createHash('sha256').update(JSON.stringify(inputs)).digest('hex').slice(0, 20)}`,
    data_ids: inputs.map((holding) => `holding:${holding.holding_id}`),
    total_amount: total,
    weights,
    max_concentration: Math.max(...weights.map((holding) => holding.weight))
  };
}

function scopeTaskFacts({ taskType, snapshot, session, productIds }) {
  const base = { ...snapshot, customer: null, holdings: [], products: [] };
  const calculations = [];

  if (taskType === 'assistant_qa') {
    return { snapshot: { ...base, customer: snapshot.customer, holdings: snapshot.holdings, products: snapshot.products }, calculations };
  }
  if (['research_qa', 'report_summary', 'writing_draft'].includes(taskType)) {
    return { snapshot: { ...base, products: snapshot.products.filter((product) => productIds.includes(product.id)) }, calculations };
  }
  if (taskType === 'product_explain') {
    if (!productIds.length) throw new ValidationError('product_explain 必须明确指定 product_ids');
    const products = snapshot.products.filter((product) => productIds.includes(product.id));
    if (products.length !== productIds.length) throw new InsufficientEvidenceError('指定产品在当前数据版本中不存在', { product_ids: productIds });
    return { snapshot: { ...base, products }, calculations };
  }
  if (taskType === 'diagnosis_explain') {
    if (productIds.length !== 1) throw new ValidationError('diagnosis_explain 必须指定一个 product_id');
    const product = snapshot.products.find((item) => item.id === productIds[0]);
    const holdings = snapshot.holdings.filter((holding) => holding.product_id === productIds[0]);
    if (!product || !holdings.length) throw new InsufficientEvidenceError('诊断必须同时具有指定产品及其持仓', { product_ids: productIds });
    calculations.push(portfolioCalculation(snapshot.holdings));
    return { snapshot: { ...base, products: [product], holdings }, calculations };
  }
  if (taskType === 'candidate_explain') {
    const state = session.state || {};
    const candidates = Array.isArray(state.candidates) ? state.candidates : [];
    const candidateCalculation = state.candidateCalculation;
    if (!candidates.length || !isObject(candidateCalculation) || !candidateCalculation.calculation_id || !Array.isArray(candidateCalculation.candidate_ids)) {
      throw new InsufficientEvidenceError('候选解释需要当前候选及完整 candidateCalculation');
    }
    const current = new Set(candidates);
    const calculated = new Set(candidateCalculation.candidate_ids);
    if (current.size !== calculated.size || candidates.some((id) => !calculated.has(id))) {
      throw new InsufficientEvidenceError('candidateCalculation 与当前候选不一致');
    }
    if (productIds.some((id) => !current.has(id))) throw new ValidationError('candidate_explain 的 product_ids 必须属于当前候选', { product_ids: productIds });
    const selectedIds = productIds.length ? productIds : candidates;
    const products = snapshot.products.filter((product) => selectedIds.includes(product.id));
    if (products.length !== selectedIds.length) throw new InsufficientEvidenceError('当前候选缺少对应产品事实', { product_ids: selectedIds });
    calculations.push(candidateCalculation);
    return { snapshot: { ...base, products }, calculations };
  }
  return { snapshot: base, calculations };
}

function embeddedCalculations(evidence) {
  const embedded = [];
  const add = (calculation) => {
    if (calculation && typeof calculation === 'object' && calculation.calculation_id && !embedded.some((item) => item.calculation_id === calculation.calculation_id)) {
      embedded.push(calculation);
    }
  };
  (evidence.structured_facts.products || []).forEach((product) => add(product.candidate_calculation));
  (evidence.structured_facts.holdings || []).forEach((holding) => add(holding.portfolio_calculation));
  return embedded;
}

// 引用的计算 ID 必须出现在顶层 calculations 中，响应才能回指到本次证据包的数值。
function evidenceCalculations(evidence) {
  const all = [...(evidence.calculations || []), ...embeddedCalculations(evidence)];
  return all.filter((calculation, index) => calculation?.calculation_id && all.findIndex((item) => item?.calculation_id === calculation.calculation_id) === index);
}

function isCitationAllowed(id, sets) {
  // 模型可能按“rule:固定”措辞自行加前缀；规则引用按前缀解析后再匹配目录。
  const ruleId = typeof id === 'string' && id.startsWith('rule:') ? id.slice('rule:'.length) : null;
  return sets.data.has(id) || sets.calculations.has(id) || sets.chunks.has(id) || (ruleId !== null && sets.rules.has(ruleId));
}

function citationSets(evidence) {
  const data = new Set();
  if (evidence.structured_facts.customer) data.add(evidence.structured_facts.customer.data_id);
  for (const holding of evidence.structured_facts.holdings) data.add(holding.data_id);
  for (const product of evidence.structured_facts.products) data.add(product.data_id);
  return {
    data,
    calculations: new Set(evidenceCalculations(evidence).map((calculation) => calculation.calculation_id)),
    chunks: new Set(evidence.knowledge_chunks.map((chunk) => chunk.chunk_id)),
    rules: new Set(evidence.rule_candidates.map((rule) => rule.rule_id))
  };
}

function validateGeneratedOutput(output, taskType, evidence) {
  if (!output || typeof output.text !== 'string' || !Array.isArray(output.citations) || !Array.isArray(output.risks)) {
    throw new ValidationError('模型输出未通过结构校验', { task_type: taskType });
  }
  if (taskType === 'rule_match' && output.extracted_inputs !== undefined && !isObject(output.extracted_inputs)) {
    throw new ValidationError('extracted_inputs 必须是对象', { task_type: taskType });
  }
  const allowed = citationSets(evidence);
  const invalid = output.citations.filter((id) => typeof id !== 'string' || !isCitationAllowed(id, allowed));
  if (invalid.length) throw new ValidationError('模型引用不属于本次证据白名单', { invalid_citations: invalid });
  if (KNOWLEDGE_REQUIRED.has(taskType) && !output.citations.some((id) => allowed.chunks.has(id))) {
    throw new ValidationError('研究、摘要和写作必须至少引用一个知识片段', { task_type: taskType });
  }
  if (!output.citations.length) throw new ValidationError('内容生成必须至少包含一个有效引用', { task_type: taskType });
  // A23：只接受与证据包 enabled=true 规则版本完全一致的 rule_id，任何动作或比例都不取自模型。
  if (taskType === 'rule_match' && output.rule_id && !evidence.rule_candidates.some((rule) => rule.rule_id === output.rule_id && rule.rule_version === output.rule_version && rule.enabled !== false)) {
    throw new ValidationError('模型选择了不存在、未启用或版本不匹配的规则', { rule_id: output.rule_id, rule_version: output.rule_version });
  }
  if (taskType === 'rule_match' && Array.isArray(output.actions)) {
    throw new ValidationError('模型不能返回规则动作，配置比例只由程序执行规则决定', { task_type: taskType });
  }
  // A07：比较排名与优劣结论属于业务判定，模型只能解释同口径比较，不能自行排名。
  if (Array.isArray(output.ranking) || output.ranking !== undefined) {
    throw new ValidationError('模型不能输出比较排名，比较结论只来自同口径确定性比较', { task_type: taskType });
  }
  return output;
}

function responseEvidence(output, evidence) {
  const allowed = citationSets(evidence);
  const citations = [...new Set(output.citations)];
  const chunkIds = citations.filter((id) => allowed.chunks.has(id));
  const ruleIds = citations.map((id) => (typeof id === 'string' && id.startsWith('rule:') ? id.slice('rule:'.length) : null)).filter((id) => id !== null && allowed.rules.has(id));
  return {
    data_ids: citations.filter((id) => allowed.data.has(id)),
    calculation_ids: citations.filter((id) => allowed.calculations.has(id)),
    // rule:<id> 的逐字 ID 原样保留；rule_ids 只认证据包内 enabled 的规则，不扩展成其他计算。
    rule_citations: citations.filter((id) => typeof id === 'string' && id.startsWith('rule:') && allowed.rules.has(id.slice('rule:'.length))),
    rule_ids: ruleIds,
    chunk_ids: chunkIds,
    retrieval_scores: chunkIds.map((id) => {
      const chunk = evidence.knowledge_chunks.find((item) => item.chunk_id === id);
      return { chunk_id: id, score: chunk.score };
    })
  };
}

function missingFields(rule, inputs) {
  return (rule.required_inputs || []).filter((field) => inputs[field] === undefined || inputs[field] === null || inputs[field] === '');
}

function unselectedRuleResult(rules, inputs) {
  const completeness = rules.map((rule) => ({ rule, missing: missingFields(rule, inputs) })).sort((a, b) => a.missing.length - b.missing.length);
  const mostComplete = completeness[0];
  return {
    status: mostComplete?.missing.length === 0 ? 'UNSUPPORTED_RULE' : 'NEED_CONFIRMATION',
    rule_id: null,
    rule_version: null,
    missing_fields: mostComplete?.missing || []
  };
}

export class AiOrchestrator {
  constructor({ client, dataService, knowledgeService, rulesService, sessionService, logger, db, config }) {
    this.client = client;
    this.dataService = dataService;
    this.knowledgeService = knowledgeService;
    this.rulesService = rulesService;
    this.sessionService = sessionService;
    this.logger = logger;
    this.db = db;
    this.config = config;
    this.fixtureRequests = new Map();
  }

  async generate({ sessionId, sessionVersion, requestId, taskType, input = {}, productIds = [], sourceIds = [] }) {
    if (!UUID_PATTERN.test(String(requestId))) throw new ValidationError('request_id 必须是 UUID');
    if (!Number.isInteger(sessionVersion) || sessionVersion < 1) throw new ValidationError('session_version 必须是正整数');
    assertTaskType(taskType);
    input = sanitizeTaskInput(input);
    productIds = normalizeIds(productIds, 'product_ids');
    sourceIds = normalizeIds(sourceIds, 'source_ids');

    const session = await this.sessionService.get(sessionId);
    if (session.version !== sessionVersion) {
      throw new ConflictError('AI 请求使用了过期的会话版本', { current_version: session.version, session_id: sessionId });
    }
    const snapshot = await this.dataService.getCustomerContext({ customerId: session.customer_id || session.state?.customerId, authorized: true });
    if (session.state?.authorized !== true || snapshot.customer?.authorized !== true) {
      throw new InsufficientEvidenceError('当前会话和客户数据均需保持授权，不能调用生成任务', { task_type: taskType });
    }

    const requestKey = `${sessionId}:${requestId}`;
    if (this.config.DATA_MODE === 'fixture') {
      const prior = this.fixtureRequests.get(requestKey);
      if (prior && prior.taskType !== taskType) throw new ConflictError('request_id 已用于其他 AI 请求', { request_id: requestId });
      if (prior?.status === 'SUCCEEDED') return prior.result;
      if (prior?.status === 'STARTED') throw new ConflictError('相同 AI 请求正在处理中', { request_id: requestId, session_id: sessionId });
      this.fixtureRequests.set(requestKey, { status: 'STARTED', taskType });
    } else {
      const prior = await this.beginDatabaseRequest({ sessionId, requestId, taskType });
      if (prior) return prior;
    }

    let knowledgeVersion = null;
    try {
      const knowledgeStatus = await this.knowledgeService.status();
      knowledgeVersion = knowledgeStatus.knowledge_version || null;
      const result = await this.executeGenerate({ sessionId, sessionVersion, requestId, taskType, input, productIds, sourceIds, session, snapshot, knowledgeStatus });
      await this.succeedRequest({ sessionId, requestId, requestKey, result, knowledgeVersion });
      return result;
    } catch (error) {
      await this.failRequest({ sessionId, requestId, requestKey, error, knowledgeVersion });
      throw error;
    }
  }

  async executeGenerate({ sessionId, sessionVersion, requestId, taskType, input, productIds, sourceIds, session, snapshot, knowledgeStatus }) {
    const knowledgeVersion = knowledgeStatus.knowledge_version || null;
    const rules = taskType === 'rule_match' ? await this.rulesService.list() : [];
    if (taskType === 'rule_match' && !rules.length) throw new InsufficientEvidenceError('规则匹配需要有效规则目录');
    const scoped = scopeTaskFacts({ taskType, snapshot, session, productIds });
    let reportDocumentIds = [];
    if (taskType === 'report_summary') {
      const inputSourceIds = normalizeIds(input.source_ids, 'source_ids');
      sourceIds = [...new Set([...sourceIds, ...inputSourceIds])];
      if (input.document_id !== undefined && (typeof input.document_id !== 'string' || !input.document_id.trim())) {
        throw new ValidationError('document_id 必须是非空字符串');
      }
      reportDocumentIds = input.document_id ? [input.document_id] : [];
      if (!reportDocumentIds.length && !sourceIds.length) throw new ValidationError('report_summary 必须提供 input.document_id 或 source_ids');
    }

    let chunks = [];
    let embeddingModel = null;
    let embeddingLatency = 0;
    const hasActiveKnowledge = knowledgeStatus.status === 'ACTIVE' && Number(knowledgeStatus.vector_count || 0) > 0;
    if (KNOWLEDGE_REQUIRED.has(taskType) && !hasActiveKnowledge) {
      throw new DependencyUnavailableError('必需知识没有可用 ACTIVE 向量版本', { task_type: taskType, knowledge_version: knowledgeVersion });
    }
    if ((KNOWLEDGE_REQUIRED.has(taskType) || KNOWLEDGE_OPTIONAL.has(taskType)) && hasActiveKnowledge) {
      const expectedDim = Number(this.config.KNOWLEDGE_VECTOR_DIM);
      if (!knowledgeVersion || Number(knowledgeStatus.vector_dim) !== expectedDim || knowledgeStatus.embedding_model !== this.config.EMBEDDING_MODEL_NAME) {
        throw new DependencyUnavailableError('知识版本与当前 Embedding 配置不匹配，已阻止生成', {
          knowledge_version: knowledgeVersion,
          vector_dim: knowledgeStatus.vector_dim,
          embedding_model: knowledgeStatus.embedding_model
        });
      }
      const query = String(input.question || input.text || input.prompt || reportDocumentIds.join(' ') || productIds.join(' ') || sourceIds.join(' ') || taskType);
      const embedded = await this.client.embed(query);
      if (!Array.isArray(embedded.embedding) || embedded.embedding.length !== expectedDim || embedded.model !== this.config.EMBEDDING_MODEL_NAME || embedded.model !== knowledgeStatus.embedding_model) {
        throw new DependencyUnavailableError('实际 Embedding 模型或维度与活动知识索引不匹配', {
          knowledge_version: knowledgeVersion,
          expected_dim: expectedDim,
          actual_dim: embedded.embedding?.length,
          expected_model: this.config.EMBEDDING_MODEL_NAME,
          actual_model: embedded.model
        });
      }
      embeddingModel = embedded.model;
      embeddingLatency = Number(embedded.latency_ms || 0);
      try {
        chunks = await this.knowledgeService.retrieve({
          taskType,
          query,
          vector: embedded.embedding,
          productIds,
          sourceIds,
          documentIds: reportDocumentIds,
          knowledgeVersion,
          limit: 4
        });
      } catch (error) {
        if (!(KNOWLEDGE_OPTIONAL.has(taskType) && error.code === 'INSUFFICIENT_EVIDENCE')) throw error;
        chunks = [];
      }
      if (chunks.some((chunk) => chunk.knowledge_version && chunk.knowledge_version !== knowledgeVersion)) {
        throw new DependencyUnavailableError('召回知识片段与请求固定版本不一致', { knowledge_version: knowledgeVersion });
      }
      chunks = chunks.map((chunk) => ({ ...chunk, knowledge_version: knowledgeVersion }));
    }
    if (KNOWLEDGE_REQUIRED.has(taskType) && !chunks.length) {
      throw new InsufficientEvidenceError('当前任务没有足够的知识片段，已停止生成', { task_type: taskType });
    }
    if (taskType === 'assistant_qa' && !chunks.length && !snapshot.holdings.length && !snapshot.products.length) {
      throw new InsufficientEvidenceError('结构化事实和知识均不足，已停止助手问答', { task_type: taskType });
    }
    if (['research_qa', 'report_summary', 'writing_draft'].includes(taskType) && !productIds.length) {
      const relatedIds = new Set(chunks.map((chunk) => chunk.product_id).filter(Boolean));
      scoped.snapshot.products = snapshot.products.filter((product) => relatedIds.has(product.id));
    }

    const generationEvidence = toEvidence({ snapshot: scoped.snapshot, chunks, calculations: scoped.calculations, rules });
    const response = await this.client.generate({
      system: systemPromptFor(taskType),
      user: JSON.stringify({ task_type: taskType, input, product_ids: productIds, source_ids: sourceIds, evidence: generationEvidence }, null, 2)
    });
    // A18：旧响应不得覆盖新状态。先确认会话未推进，再执行规则，避免为过期响应写入计算。
    const latestSession = await this.sessionService.get(sessionId);
    if (latestSession.version !== sessionVersion) {
      throw new ConflictError('AI 生成期间会话版本已变化', { current_version: latestSession.version, session_id: sessionId });
    }

    const output = validateGeneratedOutput(response, taskType, generationEvidence);

    let ruleResult = null;
    let extractedInputs = {};
    let confidence = 0;
    if (taskType === 'rule_match') {
      confidence = Number(output.confidence);
      if (!Number.isFinite(confidence)) confidence = 0;
      extractedInputs = { ...(output.extracted_inputs || {}), ...input, authorized: true };
      const selectedRule = rules.find((rule) => rule.rule_id === output.rule_id && rule.rule_version === output.rule_version);
      const missing = selectedRule ? missingFields(selectedRule, extractedInputs) : [];
      if (confidence < 0.65) {
        ruleResult = { status: 'NEED_CONFIRMATION', rule_id: output.rule_id || null, rule_version: output.rule_version || null, missing_fields: missing };
      } else if (!output.rule_id) {
        ruleResult = unselectedRuleResult(rules, extractedInputs);
      } else if (missing.length) {
        ruleResult = { status: 'NEED_CONFIRMATION', rule_id: output.rule_id, rule_version: output.rule_version, missing_fields: missing };
      } else {
        ruleResult = await this.rulesService.matchAndExecute({ ruleId: output.rule_id, ruleVersion: output.rule_version, inputs: extractedInputs });
        // 只有程序校验并执行成功的规则才能进入证据计算；未匹配时不产生任何计算或动作。
        if (ruleResult.status === 'MATCHED' && ruleResult.calculation_id) {
          ruleResult = { ...ruleResult, rule_source: 'program_validated' };
        }
      }
    }

    // 返回的证据包就是生成时交给模型的那一份（同一引用），不重新拼装；模型无法改写其中的数值或规则动作。
    const evidence = finalizeEvidence(generationEvidence, ruleResult);

    return {
      request_id: requestId,
      text: output.text,
      citations: output.citations,
      evidence: responseEvidence(output, evidence),
      data_as_of: snapshot.data_as_of,
      data_version: snapshot.data_version,
      knowledge_version: knowledgeVersion,
      model: response.model,
      embedding_model: embeddingModel,
      finish_reason: response.finish_reason,
      latency_ms: Number(response.latency_ms || 0) + embeddingLatency,
      risks: output.risks,
      ...(this.config.AI_MODE === 'fixture' ? { execution_mode: 'fixture' } : {}),
      ...(taskType === 'rule_match' ? {
        ...ruleResult,
        missing_fields: ruleResult.missing_fields || [],
        extracted_inputs: extractedInputs,
        confidence,
        // 规则是否由程序执行、动作是否来自规则目录，必须对前端可见，不能只看模型输出。
        validated_by_program: ruleResult.status === 'MATCHED'
      } : {})
    };
  }

  async beginDatabaseRequest({ sessionId, requestId, taskType }) {
    if (!this.db.enabled) throw new DependencyUnavailableError('database 模式需要可用数据库', { dependency: 'postgresql' });
    const inserted = await this.db.query(
      `INSERT INTO ai_requests(request_id, session_id, task_type, model, embedding_model, evidence_json, status)
       VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, 'STARTED')
       ON CONFLICT (request_id) DO NOTHING
       RETURNING request_id`,
      [requestId, sessionId, taskType, this.config.MODEL_NAME || null, this.config.EMBEDDING_MODEL_NAME || null]
    );
    if (inserted.rowCount === 1 || inserted.rows.length) return null;
    const existing = await this.db.query(
      'SELECT session_id, task_type, status, response_json, error_code FROM ai_requests WHERE request_id = $1',
      [requestId]
    );
    const row = existing.rows[0];
    if (!row || row.session_id !== sessionId || row.task_type !== taskType) {
      throw new ConflictError('request_id 已用于其他 AI 请求', { request_id: requestId });
    }
    if (row.status === 'SUCCEEDED' && row.response_json) {
      return typeof row.response_json === 'string' ? JSON.parse(row.response_json) : row.response_json;
    }
    if (row.status === 'STARTED') throw new ConflictError('相同 AI 请求正在处理中', { request_id: requestId, session_id: sessionId });
    if (row.status === 'FAILED') throw new ConflictError('相同 AI 请求已失败，不能作为成功结果返回', { request_id: requestId, error_code: row.error_code });
    throw new ConflictError('相同 AI 请求没有可重放的成功响应', { request_id: requestId });
  }

  async succeedRequest({ sessionId, requestId, requestKey, result, knowledgeVersion }) {
    if (this.config.DATA_MODE === 'fixture') {
      this.fixtureRequests.set(requestKey, { ...this.fixtureRequests.get(requestKey), status: 'SUCCEEDED', result });
      return;
    }
    const updated = await this.db.query(
      `UPDATE ai_requests
       SET status = 'SUCCEEDED', response_json = $2::jsonb, evidence_json = $3::jsonb,
           latency_ms = $4, model = $5, embedding_model = $6, knowledge_version = $7, error_code = NULL
       WHERE request_id = $1 AND session_id = $8 AND status = 'STARTED'`,
      [requestId, JSON.stringify(result), JSON.stringify(result.evidence), result.latency_ms, result.model || null, result.embedding_model || null, knowledgeVersion, sessionId]
    );
    if (updated.rowCount !== 1) throw new ConflictError('AI 成功审计未能更新 STARTED 请求', { request_id: requestId });
  }

  async failRequest({ sessionId, requestId, requestKey, error, knowledgeVersion }) {
    if (this.config.DATA_MODE === 'fixture') {
      this.fixtureRequests.delete(requestKey);
      return;
    }
    try {
      const updated = await this.db.query(
        `UPDATE ai_requests
         SET status = 'FAILED', error_code = $2, knowledge_version = $3
         WHERE request_id = $1 AND session_id = $4 AND status = 'STARTED'`,
        [requestId, error.code || 'AI_GENERATION_FAILED', knowledgeVersion, sessionId]
      );
      if (updated.rowCount !== 1) throw new ConflictError('AI 失败审计未能更新 STARTED 请求', { request_id: requestId });
    } catch (auditError) {
      throw new DependencyUnavailableError('AI 请求失败且失败审计写入未成功', { request_id: requestId, cause: auditError });
    }
  }
}
