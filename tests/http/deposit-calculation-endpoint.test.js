import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';

// §15.2 第 6 行（pc/product-deposit）· test-unit：存款单位矩阵的 **HTTP 入口**。
//
// 服务层的单位矩阵已由 tests/unit/deposit-calculation.test.js 覆盖；但页面实际调用的是
// `GET /api/calculations/deposit`，而该端点此前没有任何测试。HTTP 层有两个服务层测不到的
// 真实差异：查询参数一律是**字符串**，以及控制器的**状态码映射**（非 MATCHED → 422）。
// 本条只补这两点，不重复服务层已覆盖的公式矩阵。
//
// 只读 GET，不写会话、不连库、不调模型。fixture 规则目录，数字仅用于验证单位口径。

function makeApp() {
  const container = createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'deposit-endpoint-test',
      MODEL_BASE_URL: undefined,
      MODEL_API_KEY: undefined,
      MODEL_NAME: undefined,
      EMBEDDING_MODEL_NAME: undefined,
      KNOWLEDGE_VECTOR_DIM: 1536
    }
  });
  return { app: createApp(container), container };
}

test('GET /api/calculations/deposit computes from string query params and is reproducible', async () => {
  const { app } = makeApp();
  const response = await request(app)
    .get('/api/calculations/deposit?principal=500000&annual_rate=0.0215&years=3')
    .expect(200);

  assert.equal(response.body.status, 'MATCHED');
  assert.equal(response.body.rule_id, 'deposit-interest-simple');
  assert.equal(response.body.result.interest, 32250);
  assert.equal(response.body.result.maturity_amount, 532250);
  assert.equal(response.body.result.principal, 500000);
  assert.equal(typeof response.body.calculation_id, 'string');
  assert.equal(response.body.api_version, 'v1');
});

test('the endpoint treats rate_unit=percent and decimal as the same calculation', async () => {
  const { app } = makeApp();
  const decimal = await request(app)
    .get('/api/calculations/deposit?principal=500000&annual_rate=0.0215&years=3&rate_unit=decimal')
    .expect(200);
  const percent = await request(app)
    .get('/api/calculations/deposit?principal=500000&annual_rate=2.15&years=3&rate_unit=percent')
    .expect(200);

  assert.equal(percent.body.result.interest, decimal.body.result.interest);
  assert.equal(percent.body.result.maturity_amount, decimal.body.result.maturity_amount);
  // calculation_id 同源：单位换算是同一笔计算，不得产生两份不同口径的结果。
  assert.equal(percent.body.calculation_id, decimal.body.calculation_id);
  assert.equal(percent.body.rate_unit, 'percent');
  assert.equal(decimal.body.rate_unit, 'decimal');
});

test('a percentage value sent without rate_unit=percent is rejected with 400 instead of inflating 100x', async () => {
  const { app } = makeApp();
  const response = await request(app)
    .get('/api/calculations/deposit?principal=500000&annual_rate=2.15&years=3')
    .expect(400);

  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  const details = response.body.error.details || {};
  const fields = Array.isArray(details.fields) ? details.fields : [];
  assert.ok(fields.includes('rate_unit'), `details.fields should include rate_unit, got ${JSON.stringify(fields)}`);
  // 失败响应不得携带任何金额，避免页面把 0 或旧值当成结果渲染。
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'result'), false);
});

test('missing or non-numeric inputs return 400 and never a zero-filled calculation', async () => {
  const { app } = makeApp();
  const cases = [
    '/api/calculations/deposit?principal=500000&annual_rate=0.0215',
    '/api/calculations/deposit?annual_rate=0.0215&years=3',
    '/api/calculations/deposit?principal=abc&annual_rate=0.0215&years=3',
    '/api/calculations/deposit?principal=500000&annual_rate=0.0215&years=0'
  ];
  for (const path of cases) {
    const response = await request(app).get(path).expect(400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR', `${path} must be VALIDATION_ERROR`);
    assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'result'), false);
  }
});

test('an unknown rule version maps to 422 UNSUPPORTED_RULE without inventing a result', async () => {
  const { app } = makeApp();
  const response = await request(app)
    .get('/api/calculations/deposit?principal=500000&annual_rate=0.0215&years=3&rule_version=rules-demo-v999')
    .expect(422);

  assert.equal(response.body.status, 'UNSUPPORTED_RULE');
  assert.equal(response.body.rule_version, 'rules-demo-v999');
  // 未匹配规则时不得回退到硬编码计算：没有金额、没有计算 id。
  assert.equal(response.body.result, undefined);
  assert.equal(response.body.calculation_id, undefined);
  assert.equal(response.body.api_version, 'v1');
});
