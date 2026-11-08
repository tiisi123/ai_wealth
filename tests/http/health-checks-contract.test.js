import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';

// §15.2 第 1 行（pc/architecture）· test-unit：health / ready 结构。
//
// P-01 页面消费的是 `GET /api/health` 的 `dependencies` 与（修复后）`GET /ready` 的 7 项 checks。
// 既有测试覆盖了 `/api/health` 与 `/ready`；`GET /api/health/checks`（#14 新增的只读聚合端点）
// 一直没有任何断言，本条补齐，并锁定它与 `/ready` 的同源关系——避免页面读到的 checks 与
// 就绪探针漂移成两套事实。
//
// 只读 GET，不连库、不调模型。

function makeApp(config = {}) {
  const container = createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'health-checks-test',
      MODEL_BASE_URL: undefined,
      MODEL_API_KEY: undefined,
      MODEL_NAME: undefined,
      EMBEDDING_MODEL_NAME: undefined,
      KNOWLEDGE_VECTOR_DIM: 1536,
      ...config
    }
  });
  return { app: createApp(container), container };
}

const EXPECTED_CHECKS = ['contract', 'data_mode', 'database', 'knowledge', 'model', 'rules', 'shared_document_store'];

test('GET /api/health/checks returns the same 7 boolean checks the readiness probe uses', async () => {
  const { app } = makeApp();
  const response = await request(app).get('/api/health/checks').expect(200);

  const { checks } = response.body;
  assert.ok(checks && typeof checks === 'object');
  assert.deepEqual([...Object.keys(checks)].sort(), [...EXPECTED_CHECKS].sort());
  assert.equal(Object.keys(checks).length, 7);
  for (const [name, value] of Object.entries(checks)) {
    assert.equal(typeof value, 'boolean', `checks.${name} must be a boolean, got ${typeof value}`);
  }

  // 与 /ready 同源：同一实例下 checks 与 ready 汇总必须完全一致，否则页面与探针会各说各话。
  // generated_at 是每次求值的时间戳，不跨请求比较，只校验它是可解析的时间。
  const ready = await request(app).get('/ready');
  assert.deepEqual(checks, ready.body.checks);
  assert.equal(response.body.ready, ready.body.ready);
  assert.equal(Number.isNaN(Date.parse(response.body.generated_at)), false);
});

test('GET /api/health/checks exposes contract metadata and no secrets', async () => {
  const { app, container } = makeApp();
  const response = await request(app).get('/api/health/checks').expect(200);

  assert.equal(response.body.api_version, container.config.API_VERSION);
  assert.equal(response.body.frontend_contract_version, container.config.FRONTEND_CONTRACT_VERSION);
  assert.ok(response.body.dependencies && typeof response.body.dependencies === 'object');

  const serialized = JSON.stringify(response.body);
  assert.equal(serialized.includes('API_KEY'), false);
  assert.equal(serialized.includes('api_key'), false);
});

test('the aggregate endpoint stays read-only: it never advances any session state', async () => {
  const { app } = makeApp();
  const created = await request(app).post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;
  const before = created.body.session.version;

  await request(app).get('/api/health/checks').expect(200);
  await request(app).get('/api/health/checks').expect(200);

  const after = await request(app).get(`/api/sessions/${sessionId}`).expect(200);
  assert.equal(after.body.session.version, before);
});
