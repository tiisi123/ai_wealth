import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';
import { compareBasis } from '../../src/components/business-rules/domain/candidateRules.js';

// §15.2 第 9 行（pc/compare）与第 29 行（m/companion）· test-unit。
//
// 第 9 行要求：`save_comparison` 的 **2–3 个**边界与**可比性**（`comparable` /
// `incomparable_reason` / `comparison_basis`）；第 29 行要求：`submit_care` 在未保存有效
// 比较时返回 **409**，而不是静默成功。
//
// 既有覆盖只有 sessions.test.js 的「1 个被拒 / 2 个成功」；本条补齐 3 个成功、4 个被拒、
// 重复 id、不存在产品，以及 A07 的口径判定与「可保存但不可排名」这一不变量。
// 断言对外行为（状态码、错误码、会话状态、口径字段），不绑定内部实现；不连库、不调模型。
// 真实产品 id 来自 fixture 快照（fund / wealth / deposit / bondfund），不使用 candidate score。

function makeContainer() {
  return createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'comparison-care-test',
      MODEL_BASE_URL: undefined,
      MODEL_API_KEY: undefined,
      MODEL_NAME: undefined,
      EMBEDDING_MODEL_NAME: undefined,
      KNOWLEDGE_VECTOR_DIM: 1536
    }
  });
}

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function command(container, session, requestId, name, input = {}) {
  return container.sessionService.command({
    sessionId: session.session_id,
    expectedVersion: session.version,
    requestId,
    command: name,
    input
  });
}

test('save_comparison accepts the full 3-product upper bound and records it as saved', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  const saved = await command(container, session, uuid(401), 'save_comparison', {
    product_ids: ['fund', 'wealth', 'deposit']
  });

  assert.equal(saved.result.status, 'APPLIED');
  assert.deepEqual(saved.session.state.compareSet, ['fund', 'wealth', 'deposit']);
  assert.equal(saved.session.state.compareSaved, true);
  // 新的比较结果必须让此前提交的陪伴请求失效，避免旧关怀结论挂在新比较上。
  assert.equal(saved.session.state.careSubmitted, false);
});

test('save_comparison still accepts the 2-product lower bound', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  const saved = await command(container, session, uuid(402), 'save_comparison', {
    product_ids: ['fund', 'wealth']
  });
  assert.equal(saved.session.state.compareSaved, true);
  assert.deepEqual(saved.session.state.compareSet, ['fund', 'wealth']);
});

test('save_comparison rejects 4 products, duplicates and unknown products without writing state', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  const rejected = [
    { productIds: ['fund', 'wealth', 'deposit', 'bondfund'], label: '4 个产品超出上限' },
    { productIds: ['fund', 'fund'], label: '重复 id 不是有效比较' },
    { productIds: ['fund', 'not-in-data-version'], label: '不存在或已失效产品' }
  ];
  let index = 403;
  for (const { productIds, label } of rejected) {
    await assert.rejects(
      command(container, session, uuid(index++), 'save_comparison', { product_ids: productIds }),
      (error) => {
        assert.equal(error.status, 400, `${label} 必须是 400`);
        assert.equal(error.code, 'VALIDATION_ERROR', `${label} 必须是 VALIDATION_ERROR`);
        return true;
      }
    );
  }
  // 三次被拒都不得留下半成品比较状态。
  const latest = await container.sessionService.get(session.session_id);
  assert.deepEqual(latest.state.compareSet, []);
  assert.equal(latest.state.compareSaved, false);
  assert.equal(latest.version, session.version);
});

test('submit_care before a saved comparison is 409 and grants nothing', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();

  await assert.rejects(
    command(container, session, uuid(410), 'submit_care', {}),
    (error) => {
      assert.equal(error.status, 409, '未保存比较时的陪伴请求必须 409');
      assert.match(error.message, /保存有效产品比较/);
      return true;
    }
  );

  const latest = await container.sessionService.get(session.session_id);
  assert.equal(latest.state.careSubmitted, false);
  assert.equal(latest.version, session.version);
});

test('submit_care succeeds only after a saved comparison and flips the care state', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  const saved = await command(container, session, uuid(411), 'save_comparison', {
    product_ids: ['fund', 'wealth']
  });

  const cared = await command(container, saved.session, uuid(412), 'submit_care', {});
  assert.equal(cared.result.status, 'WAITING_FOR_MANAGER');
  assert.equal(cared.session.state.careSubmitted, true);
  assert.equal(cared.session.state.compareSaved, true);
});

test('comparability is decided by product type, risk and return basis, never by the saved set alone', () => {
  // 同类型 + 同风险 + 同收益口径 → comparable=true 并回显比较基准。
  const sameBasis = compareBasis({
    productIds: ['a', 'b'],
    products: [
      { id: 'a', type: '基金', risk: 'R3', annual_rate: 0.04 },
      { id: 'b', type: '基金', risk: 'R3', annual_rate: 0.05 }
    ]
  });
  assert.equal(sameBasis.comparable, true);
  assert.equal(sameBasis.incomparable_reason, null);
  assert.deepEqual(sameBasis.comparison_basis, { type: '基金', benchmark: 'annual_rate', risk: 'R3' });
  assert.deepEqual(sameBasis.missing_product_ids, []);

  // 口径不同（类型/风险/收益指标任一不同）→ 不可排名，并给出机器可读原因。
  const different = compareBasis({
    productIds: ['a', 'b'],
    products: [
      { id: 'a', type: '基金', risk: 'R3', annual_rate: 0.04 },
      { id: 'b', type: '理财', risk: 'R2', latest_return: 0.03 }
    ]
  });
  assert.equal(different.comparable, false);
  assert.equal(different.incomparable_reason, 'different_basis');
  assert.equal(different.comparison_basis, null);

  // 少于 2 个产品不构成比较。
  const single = compareBasis({
    productIds: ['a'],
    products: [{ id: 'a', type: '基金', risk: 'R3', annual_rate: 0.04 }]
  });
  assert.equal(single.comparable, false);
  assert.equal(single.incomparable_reason, 'fewer_than_two_products');

  // 当前数据版本缺值 → 记为缺失，绝不按 0 补齐后比较。
  const missing = compareBasis({
    productIds: ['a', 'gone'],
    products: [{ id: 'a', type: '基金', risk: 'R3', annual_rate: 0.04 }]
  });
  assert.equal(missing.comparable, false);
  assert.equal(missing.incomparable_reason, 'missing_values');
  assert.deepEqual(missing.missing_product_ids, ['gone']);
});

test('a non-comparable set can still be saved, but saving never implies rankable', async () => {
  // A07：保存的是“用户选择的比较集”，排名资格由服务端口径判定。两者不得混为一谈。
  const container = makeContainer();
  const session = await container.sessionService.create();
  const saved = await command(container, session, uuid(413), 'save_comparison', {
    product_ids: ['fund', 'deposit']
  });
  assert.equal(saved.session.state.compareSaved, true);

  // 同口径判定对同一组真实产品给 comparable=false（基金 R3 vs 存款 R1，类型/风险不同）。
  const snapshot = await container.dataService.snapshot({ customerId: session.customer_id });
  const comparison = compareBasis({ products: snapshot.products, productIds: ['fund', 'deposit'] });
  assert.equal(comparison.comparable, false);
  assert.equal(comparison.incomparable_reason, 'different_basis');
  // 已保存状态不因不可比较而被回退，也不得被读成“可排名”。
  const latest = await container.sessionService.get(session.session_id);
  assert.equal(latest.state.compareSaved, true);
});
