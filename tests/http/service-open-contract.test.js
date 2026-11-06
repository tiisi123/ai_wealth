import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';

// A34 服务开放接口契约（§7，不含 DB）。
//
// §7 修正后应满足：`/api/demo-data` 不带 `session_id` 时在 `DATA_MODE=database` 直接 400，
// 外部调用者必须先建会话再传 `session_id`；验收用例必须体现该前置。
//
// 本文件只调用 router/controller 层并显式置 `DATABASE_URL: undefined`：
// - `DB_ENABLED=false`，任何代码路径都不会建立连接，因此用例在无 PostgreSQL 的环境下也可执行，
//   也不需要 W1_DB_SMOKE 跳过（与 readonly-contract.test.js 中依赖真库的用例区分开）；
// - 这里断言的是对外可见的行为（状态码、错误码、响应里不得出现客户明细、会话前置条件），
//   不断言私有实现细节。fixture 结果只证明契约与链路，不构成真实模型或生产验收结论。

const BASE_CONFIG = {
  NODE_ENV: 'test',
  DATA_MODE: 'fixture',
  AI_MODE: 'real',
  DATABASE_URL: undefined,
  REQUIRE_MODEL: false,
  INSTANCE_ID: 'service-open-contract',
  MODEL_BASE_URL: undefined,
  MODEL_API_KEY: undefined,
  MODEL_NAME: undefined,
  EMBEDDING_MODEL_NAME: undefined,
  KNOWLEDGE_VECTOR_DIM: 1536
};

function makeApp(config = {}) {
  const container = createContainer({ config: { ...BASE_CONFIG, ...config } });
  return { app: createApp(container), container };
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function assertNoCustomerDetails(body) {
  for (const key of ['customer', 'holdings', 'products', 'readonly_projections']) {
    assert.equal(hasOwn(body, key), false, `400 响应不得包含 ${key}`);
  }
}

test('A34: GET /api/demo-data without session_id is rejected with 400 in DATA_MODE=database, without touching a database', async () => {
  const { app, container } = makeApp({ DATA_MODE: 'database', DATABASE_URL: undefined });
  // 前置：本用例不含 DB。database 模式 + 未配置 DATABASE_URL 时按设计 DB_ENABLED=false、
  // 未就绪，但控制器仍必须先执行 session_id 前置校验，不能借未就绪去读库。
  assert.equal(container.config.DATA_MODE, 'database');
  assert.equal(container.config.DB_ENABLED, false);

  const response = await request(app).get('/api/demo-data').expect(400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.equal(response.body.api_version, undefined, '错误响应不应伪装成数据响应');
  assertNoCustomerDetails(response.body);
});

test('A34: the database-mode rejection also applies when a caller sends browser-supplied identity instead of session_id', async () => {
  const { app } = makeApp({ DATA_MODE: 'database', DATABASE_URL: undefined });
  // 传入 customer_id 不能绕过会话前置：服务端不接受浏览器自报客户身份。
  const response = await request(app).get('/api/demo-data?customer_id=customer-001').expect(400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assertNoCustomerDetails(response.body);
});

test('A34: a malformed session_id is rejected before any data access, in every DATA_MODE', async () => {
  for (const dataMode of ['database', 'fixture']) {
    const { app } = makeApp({ DATA_MODE: dataMode, DATABASE_URL: undefined });
    const response = await request(app).get('/api/demo-data?session_id=not-a-uuid').expect(400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assertNoCustomerDetails(response.body);
  }
});

test('A34: unknown session_id is rejected instead of falling back to the default customer', async () => {
  const { app } = makeApp({ DATA_MODE: 'fixture', DATABASE_URL: undefined });
  const response = await request(app)
    .get('/api/demo-data?session_id=00000000-0000-4000-8000-0000000009f1')
    .expect(404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assertNoCustomerDetails(response.body);
});

test('A34: the documented precondition (create a session, then pass its session_id) yields customer data', async () => {
  const { app } = makeApp({ DATA_MODE: 'fixture', DATABASE_URL: undefined });

  // 1) 外部调用者先建会话。
  const created = await request(app).post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;
  assert.equal(typeof sessionId, 'string');

  // 2) 再带上 session_id 取业务数据。
  const data = await request(app).get(`/api/demo-data?session_id=${sessionId}`).expect(200);
  assert.equal(data.body.api_version, 'v1');
  assert.equal(data.body.customer.id, created.body.session.customer_id);
  assert.ok(Array.isArray(data.body.holdings));
  assert.ok(Array.isArray(data.body.products));
  // 只读派生投影放在独立命名空间，不写回会话状态。
  assert.equal(hasOwn(data.body, 'readonly_projections'), true);
});

test('A34: the session_id precondition is not a bypass — an unauthorized session returns no customer details', async () => {
  const { app } = makeApp({ DATA_MODE: 'fixture', DATABASE_URL: undefined });
  const session = (await request(app).post('/api/sessions').send({}).expect(201)).body.session;

  // 携带 session_id 只是通过了前置校验，最终可见数据仍由会话授权状态决定（A04 同源口径）。
  const revoked = await request(app)
    .post(`/api/sessions/${session.session_id}/commands`)
    .send({
      expected_version: session.version,
      request_id: '00000000-0000-4000-8000-000000000a01',
      command: 'set_authorization',
      input: { authorized: false }
    })
    .expect(200);
  assert.equal(revoked.body.session.state.authorized, false);

  const data = await request(app).get(`/api/demo-data?session_id=${session.session_id}`).expect(200);
  assert.deepEqual(data.body.holdings, []);
  assert.equal(data.body.readonly_projections.insurance_coverage.facts.length, 0);
});
