import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';
import { rules } from '../../src/fixtures/rules.js';
import { executeRule } from '../../src/components/business-rules/domain/ruleCatalog.js';

// §15.2 第 25 行（m/allocation）· test-unit：规则三类状态映射。
//
// 要求：`MATCHED` / `NEED_CONFIRMATION` / `UNSUPPORTED_RULE` 三类状态在**会话命令层**
// （`generate_allocation`，前端实际调用的入口）可区分，并且非 MATCHED 时**不写入任何方案状态**。
// 既有覆盖只有 rules.test.js 的领域函数级断言与会话层的 MATCHED 正常路径，本条补齐命令层三态。
//
// 断言的是对外可见结果（命令返回的 status / reason / missing_fields、会话版本与 plan 不变），
// 不绑定内部实现；未使用 candidate score / H-05 多轮上下文（仍待裁决，属排除项）。
// fixture 规则目录 + 内存会话，不连库、不调真实模型。

const GOAL = {
  amount: '¥500,000',
  term: '3–5 年',
  risk: 'R3 平衡型',
  purpose: '教育金储备',
  liquidity: '大部分可长期投资'
};

const RULE = { rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1' };

function makeContainer() {
  return createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'allocation-state-test',
      MODEL_BASE_URL: undefined,
      MODEL_API_KEY: undefined,
      MODEL_NAME: undefined,
      EMBEDDING_MODEL_NAME: undefined,
      KNOWLEDGE_VECTOR_DIM: 1536
    }
  });
}

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

async function generateAllocation(container, session, requestId, goal, rule = RULE) {
  return container.sessionService.command({
    sessionId: session.session_id,
    expectedVersion: session.version,
    requestId,
    command: 'generate_allocation',
    input: { ...rule, goal }
  });
}

test('MATCHED writes the plan and rule evidence for an in-scope goal', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  const result = await generateAllocation(container, session, uuid(301), GOAL);
  assert.equal(result.result.status, 'MATCHED');
  assert.deepEqual(result.session.state.plan, { cash: 20, bond: 50, equity: 20, protection: 10 });
  assert.equal(result.session.state.ruleMatch.rule_id, 'allocation-balanced-r3');
  assert.equal(result.session.state.ruleMatch.rule_version, 'rules-demo-v1');
  // 三类状态互斥：成功态必须真的推进版本，才能证明下面两条不是“什么都没发生”。
  assert.ok(result.session.version > session.version);
});

test('UNSUPPORTED_RULE is returned when the goal does not match the selected rule, and no plan is written', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  // R4 目标与 allocation-balanced-r3（仅适用于 R3）不匹配。
  const result = await generateAllocation(container, session, uuid(302), { ...GOAL, risk: 'R4 成长型' });
  assert.equal(result.result.status, 'UNSUPPORTED_RULE');
  assert.equal(result.result.reason, 'risk_mismatch');
  // 不得覆盖旧方案、不得写入半成品状态：会话与版本保持原样。
  assert.equal(result.session.state.plan, null);
  assert.equal(result.session.state.ruleMatch, null);
  assert.equal(result.session.version, session.version);

  const latest = await container.sessionService.get(session.session_id);
  assert.equal(latest.version, session.version);
  assert.equal(latest.state.plan, null);
});

test('UNSUPPORTED_RULE is returned for an unknown rule id or rule version instead of guessing', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  const unknownRule = await generateAllocation(container, session, uuid(303), GOAL, {
    rule_id: 'allocation-not-in-catalog',
    rule_version: 'rules-demo-v1'
  });
  assert.equal(unknownRule.result.status, 'UNSUPPORTED_RULE');
  assert.equal(unknownRule.session.state.plan, null);

  const unknownVersion = await generateAllocation(container, session, uuid(304), GOAL, {
    rule_id: 'allocation-balanced-r3',
    rule_version: 'rules-demo-v999'
  });
  assert.equal(unknownVersion.result.status, 'UNSUPPORTED_RULE');
  assert.equal(unknownVersion.session.state.plan, null);
  assert.equal(unknownVersion.session.version, session.version);
});

test('NEED_CONFIRMATION is returned when a required input is missing, naming the field, and no plan is written', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  const goal = { ...GOAL };
  delete goal.purpose;
  const result = await generateAllocation(container, session, uuid(305), goal);

  assert.equal(result.result.status, 'NEED_CONFIRMATION');
  assert.ok(Array.isArray(result.result.missing_fields));
  assert.ok(result.result.missing_fields.includes('purpose'), `missing_fields should name purpose, got ${result.result.missing_fields}`);
  // 缺字段不得产出方案，也不得把会话推进到“已配置”。
  assert.equal(result.session.state.plan, null);
  assert.equal(result.session.version, session.version);
});

test('the three states map to distinct, non-overlapping results for the same rule', async () => {
  // 同一规则、同一会话类型下三类状态都必须可达且互不相同：
  // 防止未来把 NEED_CONFIRMATION 折叠成 UNSUPPORTED_RULE（或反之）而无人发现。
  const catalogRule = rules.find((rule) => rule.rule_id === 'allocation-balanced-r3');
  const matched = executeRule(catalogRule, { ...GOAL, authorized: true });
  const missing = executeRule(catalogRule, { ...GOAL, purpose: '', authorized: true });
  const mismatched = executeRule(catalogRule, { ...GOAL, risk: 'R4 成长型', authorized: true });

  assert.equal(matched.status, 'MATCHED');
  assert.equal(missing.status, 'NEED_CONFIRMATION');
  assert.equal(mismatched.status, 'UNSUPPORTED_RULE');
  assert.equal(new Set([matched.status, missing.status, mismatched.status]).size, 3);
  // 只有 MATCHED 才带可复算计算 id；其余两类不得携带计算或动作。
  assert.equal(typeof matched.calculation_id, 'string');
  assert.equal(missing.calculation_id, undefined);
  assert.equal(mismatched.calculation_id, undefined);
});
