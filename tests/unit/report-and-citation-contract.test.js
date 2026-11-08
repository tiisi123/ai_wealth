import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';

// §15.2 第 16 行（pc/reader）与第 11 行（pc/research）· test-unit。
//
// 第 16 行要求：阅读器的 `report_summary` 在**缺 `document_id`** 时被拒绝，而不是用空引用继续生成
// （F-11 登记的实现复核点）；第 11 行要求：引用必须落在证据白名单内，规则引用还要**版本精确匹配**
// （A23：只接受与证据包 enabled 规则版本完全一致的 `rule_id`）。
//
// 既有覆盖：qa-boundary.test.js 断言「有 document_id 但无片段 → 422」、ai.test.js 断言
// 「伪造引用 → 400」。本文件补的是「连 document_id/source_ids 都没有 → 400」与
// 「规则 id 存在但版本不匹配 → 400」这两个尚未有断言的边界。
//
// DATA_MODE=fixture + mock client：不连库、不调真实模型。

const EMBEDDING_MODEL = 'embedding-test';
const GENERATION_MODEL = 'generation-test';

function makeContainer() {
  const calls = { generate: 0, embed: 0 };
  const state = { ruleVersion: 'rules-demo-v1' };
  const modelClient = {
    configured: true,
    async embed() {
      calls.embed += 1;
      return { embedding: Array.from({ length: 1536 }, () => 0.01), model: EMBEDDING_MODEL, latency_ms: 1 };
    },
    async generate() {
      calls.generate += 1;
      return {
        text: '模型回答',
        citations: ['rule:allocation-balanced-r3'],
        risks: [],
        rule_id: 'allocation-balanced-r3',
        rule_version: state.ruleVersion,
        extracted_inputs: {
          amount: '¥500,000',
          term: '3–5 年',
          risk: 'R3 平衡型',
          purpose: '教育金储备',
          liquidity: '大部分可长期投资',
          authorized: true
        },
        confidence: 0.98,
        model: GENERATION_MODEL,
        finish_reason: 'stop',
        latency_ms: 2
      };
    }
  };
  const container = createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'report-citation-test',
      EMBEDDING_MODEL_NAME: EMBEDDING_MODEL,
      MODEL_NAME: GENERATION_MODEL,
      KNOWLEDGE_VECTOR_DIM: 1536
    },
    modelClient
  });
  return { container, calls, state };
}

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('report_summary without document_id or source_ids is rejected with 400 instead of generating', async () => {
  const { container, calls } = makeContainer();
  const session = await container.sessionService.create();

  await assert.rejects(
    container.aiOrchestrator.generate({
      sessionId: session.session_id,
      sessionVersion: session.version,
      requestId: uuid(501),
      taskType: 'report_summary',
      input: { question: '总结一下' }
    }),
    (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.status, 400);
      assert.match(error.message, /document_id|source_ids/);
      return true;
    }
  );
  // 缺少文档定位时不得调用模型（不能凭问题文本凭空写摘要）。
  assert.equal(calls.generate, 0);
});

test('report_summary rejects a blank document_id rather than treating it as absent', async () => {
  const { container, calls } = makeContainer();
  const session = await container.sessionService.create();

  for (const blank of ['', '   ']) {
    await assert.rejects(
      container.aiOrchestrator.generate({
        sessionId: session.session_id,
        sessionVersion: session.version,
        requestId: uuid(blank === '' ? 502 : 503),
        taskType: 'report_summary',
        input: { document_id: blank }
      }),
      (error) => {
        assert.equal(error.code, 'VALIDATION_ERROR');
        assert.equal(error.status, 400);
        return true;
      }
    );
  }
  assert.equal(calls.generate, 0);
});

test('rule_match rejects a rule version that does not match the enabled catalog rule', async () => {
  const { container, state } = makeContainer();
  const session = await container.sessionService.create();
  state.ruleVersion = 'rules-demo-v999';

  await assert.rejects(
    container.aiOrchestrator.generate({
      sessionId: session.session_id,
      sessionVersion: session.version,
      requestId: uuid(504),
      taskType: 'rule_match',
      input: {
        amount: '¥500,000',
        term: '3–5 年',
        risk: 'R3 平衡型',
        purpose: '教育金储备',
        liquidity: '大部分可长期投资'
      }
    }),
    (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.status, 400);
      // 错误必须指向具体的规则与版本，便于定位是模型选错了还是目录漂移了。
      assert.equal(error.details?.rule_id, 'allocation-balanced-r3');
      assert.equal(error.details?.rule_version, 'rules-demo-v999');
      return true;
    }
  );
});

test('the same rule id with the catalog version is accepted, proving the rejection is about the version', async () => {
  // 正对照：只把 rule_version 换回目录值就必须成功，否则上一条断言可能只是“rule_match 总是失败”。
  const { container, state } = makeContainer();
  const session = await container.sessionService.create();
  state.ruleVersion = 'rules-demo-v1';

  const result = await container.aiOrchestrator.generate({
    sessionId: session.session_id,
    sessionVersion: session.version,
    requestId: uuid(505),
    taskType: 'rule_match',
    input: {
      amount: '¥500,000',
      term: '3–5 年',
      risk: 'R3 平衡型',
      purpose: '教育金储备',
      liquidity: '大部分可长期投资'
    }
  });
  assert.equal(result.status, 'MATCHED');
  assert.equal(result.rule_id, 'allocation-balanced-r3');
  assert.equal(result.rule_version, 'rules-demo-v1');
  assert.deepEqual(result.result, { cash: 20, bond: 50, equity: 20, protection: 10 });
});
