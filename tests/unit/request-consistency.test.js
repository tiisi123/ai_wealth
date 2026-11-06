import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';

// A18 请求一致性（§7，不依赖真库与真实模型）。
//
// §7 现状：`runRealAiTask()` 用 `activeAiRequestToken` 在浏览器侧丢弃旧响应；服务端在规则执行前
// 复核会话版本。§7 修正后应满足：现有机制需一条显式用例。
//
// 本文件锁定服务端两个不变量（与浏览器 token 机制互为补强：浏览器丢弃过期响应，
// 服务端拒绝为过期响应写入状态）：
//   1) 同一 `request_id` 重放不推进状态——版本不变、不二次生成、不二次入账；
//   2) 旧 `session_version` 一律返回 409 VERSION_CONFLICT（AI 生成、会话 PATCH、会话命令三条写入路径）。
//
// 沿用 tests/unit/ai.test.js 的 mock client 惯例：DATA_MODE=fixture 使会话落在内存仓储，
// 任何路径都不会连接数据库；mock client 也不会调用真实模型。

const goal = { amount: '¥500,000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资' };

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function makeContainer({ onGenerate } = {}) {
  const calls = { generate: 0, embed: 0 };
  const modelClient = {
    configured: true,
    async embed() {
      calls.embed += 1;
      return { embedding: Array.from({ length: 1536 }, () => 0.01), model: 'embedding-test', latency_ms: 1 };
    },
    async generate(args) {
      calls.generate += 1;
      if (onGenerate) await onGenerate(args);
      return { text: '基于本次证据的研究回答', citations: ['chunk-a500-001'], risks: ['仅供参考'], model: 'generation-test', finish_reason: 'stop', latency_ms: 2 };
    }
  };
  const container = createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'a18-contract-test',
      EMBEDDING_MODEL_NAME: 'embedding-test',
      MODEL_NAME: 'generation-test',
      KNOWLEDGE_VECTOR_DIM: 1536
    },
    modelClient
  });
  return { container, calls };
}

const generateArgs = (session, requestId = uuid(1)) => ({
  sessionId: session.session_id,
  sessionVersion: session.version,
  requestId,
  taskType: 'research_qa',
  input: { question: 'A500 波动原因' }
});

test('A18: replaying the same request_id does not advance state and does not generate twice', async () => {
  const { container, calls } = makeContainer();
  const created = await container.sessionService.create();
  const args = generateArgs(created);

  const first = await container.aiOrchestrator.generate(args);
  const afterFirst = await container.sessionService.get(created.session_id);
  const replay = await container.aiOrchestrator.generate(args);
  const afterReplay = await container.sessionService.get(created.session_id);

  // 不变量 1a：重放返回同一结果，且只生成一次。
  assert.deepEqual(replay, first);
  assert.equal(calls.generate, 1);
  assert.equal(calls.embed, 1);
  // 不变量 1b：状态未推进——版本不变，审计记录不新增。
  assert.equal(afterFirst.version, created.version);
  assert.equal(afterReplay.version, created.version);
  assert.deepEqual(afterReplay.state.aiRequests, created.state.aiRequests);
});

test('A18: a stale session_version on an AI request is rejected with 409 and generates nothing', async () => {
  const { container, calls } = makeContainer();
  const created = await container.sessionService.create();
  // 会话先推进到 v2（另一条浏览器标签页的写入）。
  const advanced = await container.sessionService.patch({
    sessionId: created.session_id,
    expectedVersion: created.version,
    requestId: uuid(101),
    patch: { lastQuestion: '另一标签页的新问题' }
  });
  assert.equal(advanced.version, created.version + 1);

  await assert.rejects(
    container.aiOrchestrator.generate({ ...generateArgs(created), sessionVersion: created.version, requestId: uuid(102) }),
    (error) => error.code === 'VERSION_CONFLICT' && error.status === 409
  );
  // 被拒绝的请求不得调用模型，也不得改写已推进的状态。
  assert.equal(calls.generate, 0);
  const latest = await container.sessionService.get(created.session_id);
  assert.equal(latest.version, advanced.version);
  assert.equal(latest.state.lastQuestion, '另一标签页的新问题');
});

test('A18: an AI response that arrives after the session advanced is rejected before any rule execution', async () => {
  // 模型生成期间，另一条路径推进了会话；旧响应必须被丢弃，不能覆盖新状态。
  // 该回调只在 generate() 内部被调用，此时创建下方会话的 await 已经完成并完成赋值。
  let sessionId;
  const { container } = makeContainer({
    onGenerate: async () => {
      await container.sessionService.patch({
        sessionId,
        expectedVersion: 1,
        requestId: uuid(103),
        patch: { lastQuestion: '生成期间的新问题' }
      });
    }
  });
  const created = await container.sessionService.create();
  sessionId = created.session_id;

  await assert.rejects(
    container.aiOrchestrator.generate(generateArgs(created, uuid(104))),
    (error) => error.code === 'VERSION_CONFLICT'
  );
  const latest = await container.sessionService.get(sessionId);
  assert.equal(latest.version, 2);
  assert.equal(latest.state.lastQuestion, '生成期间的新问题');
});

test('A18: session PATCH with a stale expected_version returns 409 without changing state', async () => {
  const { container } = makeContainer();
  const created = await container.sessionService.create();
  const first = await container.sessionService.patch({
    sessionId: created.session_id,
    expectedVersion: 1,
    requestId: uuid(105),
    patch: { lastQuestion: '第一次写入' }
  });

  await assert.rejects(
    container.sessionService.patch({
      sessionId: created.session_id,
      expectedVersion: 1,
      requestId: uuid(106),
      patch: { lastQuestion: '过期写入' }
    }),
    (error) => error.code === 'VERSION_CONFLICT' && error.details.current_version === first.version
  );
  const latest = await container.sessionService.get(created.session_id);
  assert.equal(latest.version, first.version);
  assert.equal(latest.state.lastQuestion, '第一次写入');
});

test('A18: the same request_id replayed through a command does not apply twice or bump the version', async () => {
  const { container } = makeContainer();
  const created = await container.sessionService.create();
  const args = {
    sessionId: created.session_id,
    expectedVersion: created.version,
    requestId: uuid(107),
    command: 'record_activity',
    input: { kind: 'save' }
  };

  const first = await container.sessionService.command(args);
  const replay = await container.sessionService.command(args);
  // 重放命中同一条已落库的变更，返回同一结果（同一 activity_id），不新增第二条记录。
  assert.deepEqual(replay, first);
  assert.equal(first.session.state.activities.length, 1);
  const latest = await container.sessionService.get(created.session_id);
  assert.equal(latest.version, first.session.version);
  assert.equal(latest.state.activities.length, 1);
});

test('A18: a command with a stale expected_version returns 409 and leaves downstream state untouched', async () => {
  const { container } = makeContainer();
  const created = await container.sessionService.create();
  const allocation = await container.sessionService.command({
    sessionId: created.session_id,
    expectedVersion: created.version,
    requestId: uuid(108),
    command: 'generate_allocation',
    input: { rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', goal }
  });
  const planSnapshot = JSON.stringify(allocation.session.state.plan);

  await assert.rejects(
    container.sessionService.command({
      sessionId: created.session_id,
      expectedVersion: created.version, // 旧版本：allocation 已把它推进
      requestId: uuid(109),
      command: 'generate_candidates',
      input: {}
    }),
    (error) => error.code === 'VERSION_CONFLICT' && error.details.current_version === allocation.session.version
  );
  const latest = await container.sessionService.get(created.session_id);
  assert.equal(latest.version, allocation.session.version);
  assert.deepEqual(latest.state.candidates, []);
  assert.equal(JSON.stringify(latest.state.plan), planSnapshot);
});
