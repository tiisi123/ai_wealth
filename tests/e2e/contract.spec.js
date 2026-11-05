import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { openRoute, waitForSession, storedSessionId, state } from './helpers.js';

test('页面契约标记、fixture AI 与 /ready', async ({ page, request }) => {
  await openRoute(page, 'pc/architecture');
  await expect(page.locator('meta[name="api-version"]')).toHaveAttribute('content', 'v1');
  await expect(page.locator('meta[name="frontend-contract-version"]')).toHaveAttribute('content', '2026-11-02.1');

  const health = await (await request.get('/api/health')).json();
  expect(health.ai_mode).toBe('fixture');
  expect(health.data_mode).toBe('database');
  expect(health.dependencies.model.execution_mode).toBe('fixture');
  expect(health.dependencies.model.model).toBe('fixture-generate-1');

  const ready = await (await request.get('/ready')).json();
  expect(ready.ready).toBe(true);
  expect(ready.checks.knowledge).toBe(true);
});

test('创建 session，刷新后恢复同一 session_id 与服务端状态', async ({ page }) => {
  await openRoute(page, 'pc/architecture');
  const sessionId = await storedSessionId(page);
  expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

  await page.reload();
  await waitForSession(page);
  expect(await storedSessionId(page)).toBe(sessionId);
  expect((await state(page)).customerId).toBe('customer-001');
});

test('旧会话版本写入返回 409', async ({ page, request }) => {
  await openRoute(page, 'pc/architecture');
  const sessionId = await storedSessionId(page);

  const first = await request.patch(`/api/sessions/${sessionId}`, {
    data: { expected_version: 1, request_id: randomUUID(), patch: { lastQuestion: '第一问' } }
  });
  expect(first.status()).toBe(200);

  const stale = await request.patch(`/api/sessions/${sessionId}`, {
    data: { expected_version: 1, request_id: randomUUID(), patch: { lastQuestion: '过期写入' } }
  });
  expect(stale.status()).toBe(409);
  expect((await stale.json()).error.code).toBe('VERSION_CONFLICT');
});

test('证据不足走真实错误路径，不返回预置成功答案', async ({ page, request }) => {
  await openRoute(page, 'pc/architecture');
  const sessionId = await storedSessionId(page);
  const current = await (await request.get(`/api/sessions/${sessionId}`)).json();

  // research_qa is knowledge-required, so an unknown source filter yields zero
  // chunks and a real 422. product_explain is knowledge-optional and would
  // legitimately degrade to structured facts, so it cannot be used here.
  // request_id is a global PK in ai_requests: it must be unique per project run.
  const response = await request.post('/api/ai/generate', {
    data: {
      session_id: sessionId,
      session_version: current.session.version,
      request_id: randomUUID(),
      task_type: 'research_qa',
      input: { question: '请解释产品特征' },
      product_ids: [],
      source_ids: ['nonexistent-source-for-e2e']
    }
  });
  expect(response.status()).toBe(422);
  expect((await response.json()).error.code).toBe('INSUFFICIENT_EVIDENCE');
});
