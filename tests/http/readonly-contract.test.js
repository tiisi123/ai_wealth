import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';

// 只读 HTTP 端点契约（A34 前置 + health/ready 结构）。
// 这些用例只做 GET，不写会话、不依赖新增写接口，因此不会与并行的端点实现冲突。
//
// 数据库相关分支沿用仓库既有的 W1_DB_SMOKE 跳过约定：未设置该变量时跳过，
// 避免在 CI 中硬连 PostgreSQL 导致红灯；设置 W1_DB_SMOKE=true 且有已迁移/播种的库时才会真实执行。

const runDbTests = process.env.W1_DB_SMOKE === 'true';
const dbSkip = runDbTests ? false : 'requires W1_DB_SMOKE=true and a migrated/seeded PostgreSQL';

const BASE_CONFIG = {
  AI_MODE: 'real',
  DATABASE_URL: undefined,
  REQUIRE_MODEL: false,
  INSTANCE_ID: 'http-contract-test',
  MODEL_BASE_URL: undefined,
  MODEL_API_KEY: undefined,
  MODEL_NAME: undefined,
  EMBEDDING_MODEL_NAME: undefined,
  KNOWLEDGE_VECTOR_DIM: 1536
};

function makeApp(config = {}) {
  const container = createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', ...BASE_CONFIG, ...config } });
  return { app: createApp(container), container };
}

function readFrontendMeta(name) {
  const html = fs.readFileSync(new URL('../../public/index.html', import.meta.url), 'utf8');
  return html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'))?.[1] || null;
}

test('GET /api/demo-data without session_id returns 400 in DATA_MODE=database', { skip: dbSkip }, async () => {
  const { app } = makeApp({ DATA_MODE: 'database', DATABASE_URL: process.env.DATABASE_URL });
  const response = await request(app).get('/api/demo-data').expect(400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  // 响应不得包含任何客户或持仓明细。
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'holdings'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'customer'), false);
});

test('GET /api/demo-data rejects a malformed session_id with 400 instead of falling back to fixture data', async () => {
  // 该分支在任何 DATA_MODE 下都不会读库：UUID 校验先于任何数据访问。
  const { app } = makeApp({ DATA_MODE: 'database', DATABASE_URL: process.env.DATABASE_URL });
  const response = await request(app).get('/api/demo-data?session_id=not-a-uuid').expect(400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'holdings'), false);
});

test('GET /api/health exposes api_version, frontend_contract_version and dependencies', async () => {
  const { app, container } = makeApp();
  const response = await request(app).get('/api/health').expect(200);

  assert.equal(typeof response.body.api_version, 'string');
  assert.ok(response.body.api_version.length > 0);
  assert.equal(response.body.api_version, container.config.API_VERSION);

  assert.equal(typeof response.body.frontend_contract_version, 'string');
  assert.ok(response.body.frontend_contract_version.length > 0);

  const dependencies = response.body.dependencies;
  assert.ok(dependencies && typeof dependencies === 'object');
  for (const key of ['database', 'shared_document_store', 'knowledge', 'model', 'rules', 'contract', 'data_mode']) {
    assert.ok(Object.prototype.hasOwnProperty.call(dependencies, key), `dependencies.${key} must be present`);
  }
  assert.equal(typeof dependencies.contract.api_version, 'string');
  assert.equal(typeof dependencies.contract.frontend_contract_version, 'string');

  // 健康响应不得泄露模型密钥等敏感配置。
  const serialized = JSON.stringify(response.body);
  assert.equal(serialized.includes('api_key'), false);
  assert.equal(serialized.includes('API_KEY'), false);
});

test('frontend contract versions in public/index.html match what /api/health reports', async () => {
  // 前后端契约版本必须同源：meta 标签与 config 不一致会让契约检查永久为 false。
  const { app } = makeApp();
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(readFrontendMeta('api-version'), response.body.api_version);
  assert.equal(readFrontendMeta('frontend-contract-version'), response.body.frontend_contract_version);
  assert.equal(response.body.dependencies.contract.ready, true);
});

test('/ready exposes exactly 7 boolean checks covering documented dependencies', async () => {
  const { app } = makeApp();
  const response = await request(app).get('/ready');
  assert.ok([200, 503].includes(response.status), `unexpected status ${response.status}`);

  const { checks } = response.body;
  assert.ok(checks && typeof checks === 'object');
  const keys = Object.keys(checks);
  assert.equal(keys.length, 7, `expected 7 checks, got ${keys.length}: ${keys.join(',')}`);
  assert.deepEqual(
    [...keys].sort(),
    ['contract', 'data_mode', 'database', 'knowledge', 'model', 'rules', 'shared_document_store'].sort()
  );
  for (const [name, value] of Object.entries(checks)) {
    assert.equal(typeof value, 'boolean', `checks.${name} must be a boolean, got ${typeof value}`);
  }

  // ready 必须是 7 项 checks 的合取，不能与 checks 自相矛盾。
  const allGreen = Object.values(checks).every(Boolean);
  assert.equal(response.body.ready, allGreen);
  assert.equal(response.status, allGreen ? 200 : 503);
});

test('/ready in fixture mode reports database and storage checks as booleans even when dependencies are absent', async () => {
  const { app } = makeApp({ DATA_MODE: 'fixture' });
  const response = await request(app).get('/ready');
  const { checks } = response.body;
  // fixture 模式下没有真实数据库/文档存储：这些项应为 false 的布尔值，而不是 undefined 或对象。
  assert.equal(typeof checks.database, 'boolean');
  assert.equal(typeof checks.shared_document_store, 'boolean');
  assert.equal(typeof checks.knowledge, 'boolean');
  // 契约版本与数据模式检查不依赖外部服务，应恒为真。
  assert.equal(checks.contract, true);
  assert.equal(checks.data_mode, true);
});

test('/healthz liveness stays a minimal ok payload', async () => {
  const { app } = makeApp();
  const response = await request(app).get('/healthz').expect(200);
  assert.equal(response.body.status, 'ok');
});
