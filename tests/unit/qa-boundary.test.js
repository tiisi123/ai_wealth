import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';

// A09 问答边界（§7，不连库、不调真实模型）。
//
// §7：`research_qa` 无片段 → `422`。修正后应满足：返回 `INSUFFICIENT_EVIDENCE` 的结构可被调用方
// 稳定识别（状态码 + 错误码 + 上下文），而不是通用错误。
//
// 本文件锁定该边界的对外可观测结构，并守住两条安全边界：
// - 证据不足时绝不调用模型（不能在没有证据的情况下产出一段"看起来合理"的回答）；
// - 证据不足的错误响应不得泄露知识片段正文或客户明细。
//
// 结构性不足（必需知识库未激活）与检索性不足（知识版本内无相关片段 / 新版本尚无片段）分别覆盖；
// 后者与 E2E 主链路的"有证据成功态"互补——本文只断言边界，不把 fixture 结果当作真实模型结论。

const EMBEDDING_MODEL = 'embedding-test';
const GENERATION_MODEL = 'generation-test';

function makeContainer(config = {}, citations = null) {
  const calls = { generate: 0, embed: 0 };
  const modelClient = {
    configured: true,
    async embed() {
      calls.embed += 1;
      return { embedding: Array.from({ length: 1536 }, () => 0.01), model: EMBEDDING_MODEL, latency_ms: 1 };
    },
    async generate(args) {
      calls.generate += 1;
      // 与 tests/unit/ai.test.js 同一惯例：上层只判断"模型是否被调用"。缺省引用证据包里的第一个片段，
      // 使"边界失效、走到生成"的分支也会因 A09 的断言（必须 422 / 必须未调用模型）而失败；
      // 需要对照成功态的用例再显式传入期望的 citations。
      const chunk = JSON.parse(args.user)?.evidence?.knowledge_chunks?.[0];
      return { text: '基于本次证据的研究回答', citations: citations || (chunk ? [chunk.chunk_id] : []), risks: ['仅供参考'], model: GENERATION_MODEL, finish_reason: 'stop', latency_ms: 2 };
    }
  };
  const container = createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'a09-boundary-test',
      EMBEDDING_MODEL_NAME: EMBEDDING_MODEL,
      MODEL_NAME: GENERATION_MODEL,
      KNOWLEDGE_VECTOR_DIM: 1536,
      ...config
    },
    modelClient
  });
  return { container, calls };
}

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function isInsufficientEvidence(taskType) {
  return (error) => error.code === 'INSUFFICIENT_EVIDENCE'
    && error.status === 422
    && error.details?.task_type === taskType;
}

test('A09: research_qa with no retrievable chunk returns 422 INSUFFICIENT_EVIDENCE and never calls the model', async () => {
  const { container, calls } = makeContainer();
  const session = await container.sessionService.create();

  await assert.rejects(
    container.aiOrchestrator.generate({
      sessionId: session.session_id,
      sessionVersion: session.version,
      requestId: uuid(201),
      taskType: 'research_qa',
      // 与 fixture 知识库（A500 / 固收 / 保险 / 存款）无关的问题，且限定到不存在的来源：
      // 检索结果为空，必须走证据不足路径，而不是拿无关片段凑答案。
      input: { question: '全球海运运价与红海航线的短期波动原因' },
      sourceIds: ['source-not-indexed']
    }),
    isInsufficientEvidence('research_qa')
  );
  assert.equal(calls.generate, 0, '证据不足时不得调用模型');
});

test('A09: the 422 error carries a stable machine-readable structure, not a generic failure', async () => {
  const { container } = makeContainer();
  const session = await container.sessionService.create();
  let captured;
  try {
    await container.aiOrchestrator.generate({
      sessionId: session.session_id,
      sessionVersion: session.version,
      requestId: uuid(202),
      taskType: 'research_qa',
      input: { question: '全球海运运价与红海航线的短期波动原因' },
      sourceIds: ['source-not-indexed']
    });
  } catch (error) {
    captured = error;
  }
  assert.ok(captured, '证据不足必须抛出错误而不是返回空回答');
  assert.equal(captured.code, 'INSUFFICIENT_EVIDENCE');
  assert.equal(captured.status, 422);
  assert.equal(captured.details.task_type, 'research_qa');
  assert.equal(typeof captured.message, 'string');
  assert.ok(captured.message.length > 0);
  // 错误上下文只说明"哪个任务没有证据"，不得夹带知识片段正文或客户明细。
  const serialized = JSON.stringify({ message: captured.message, details: captured.details });
  assert.equal(serialized.includes('chunk-'), false);
  assert.equal(serialized.includes('customer-'), false);
});

test('A09: a missing ACTIVE knowledge base blocks research_qa instead of answering without evidence', async () => {
  const { container, calls } = makeContainer({ EMBEDDING_MODEL_NAME: 'embedding-other' });
  const session = await container.sessionService.create();

  // Embedding 与活动知识版本不匹配：服务端必须阻止生成，而不是退回无证据回答。
  const error = await container.aiOrchestrator.generate({
    sessionId: session.session_id,
    sessionVersion: session.version,
    requestId: uuid(203),
    taskType: 'research_qa',
    input: { question: 'A500 波动原因' },
    productIds: ['fund']
  }).then(() => null, (thrown) => thrown);

  assert.ok(error, '知识版本不匹配时必须失败');
  // 配置不匹配属于依赖不可用（503），与"证据不足"（422）区分：前者是环境/配置问题，后者是数据边界。
  assert.equal(error.code, 'DEPENDENCY_UNAVAILABLE');
  assert.equal(error.status, 503);
  assert.equal(calls.generate, 0, '知识前置不满足时不得调用模型');
});

test('A09: the same knowledge-required boundary applies to report_summary and writing_draft', async () => {
  const { container, calls } = makeContainer();
  const session = await container.sessionService.create();

  await assert.rejects(
    container.aiOrchestrator.generate({
      sessionId: session.session_id,
      sessionVersion: session.version,
      requestId: uuid(204),
      taskType: 'report_summary',
      input: { document_id: 'doc-not-indexed' }
    }),
    isInsufficientEvidence('report_summary')
  );
  await assert.rejects(
    container.aiOrchestrator.generate({
      sessionId: session.session_id,
      sessionVersion: session.version,
      requestId: uuid(205),
      taskType: 'writing_draft',
      input: { text: '全球海运运价与红海航线的短期波动原因' },
      sourceIds: ['source-not-indexed']
    }),
    isInsufficientEvidence('writing_draft')
  );
  assert.equal(calls.generate, 0);
});

test('A09: the boundary does not degrade into a fabricated answer — the same evidence-dependent question succeeds only when evidence exists', async () => {
  // 反向对照：同一任务，问题落在 fixture 知识覆盖范围内时必须成功并引用本次证据包内的片段。
  // 这条对照确保上面的 422 来自"没有证据"而不是端点本身不可用。
  const { container, calls } = makeContainer({}, ['chunk-a500-001']);
  const session = await container.sessionService.create();
  const result = await container.aiOrchestrator.generate({
    sessionId: session.session_id,
    sessionVersion: session.version,
    requestId: uuid(206),
    taskType: 'research_qa',
    input: { question: 'A500 波动原因' }
  });
  assert.deepEqual(result.evidence.chunk_ids, ['chunk-a500-001']);
  assert.equal(calls.generate, 1);
});
