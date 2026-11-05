import { test, expect } from '@playwright/test';
import { openRoute, state, ensureAuthorization, clickAndWaitForRoute } from './helpers.js';

test('手机闭环：助手 → 配置 → 候选 → 比较 → 投后陪伴', async ({ page }) => {
  await openRoute(page, 'm/assistant');
  await page.locator('#mobilePrompt').fill('帮我看一下我的组合');
  await page.locator('[data-action="m-send"]').click();
  await expect(page.locator('#app')).toContainText('问小财已回答', { timeout: 30_000 });
  const answer = (await state(page)).lastAnswer;
  expect(answer.text).toContain('演示桩');
  expect(answer.model).toContain('演示桩 fixture');

  await ensureAuthorization(page);
  const planned = await state(page);
  expect(planned.plan).toBeTruthy();
  expect(planned.candidates.length).toBeGreaterThanOrEqual(2);

  await openRoute(page, 'm/candidates');
  await clickAndWaitForRoute(page, page.locator('[data-action="m-compare-add"]').first(), 'm/compare');
  await expect.poll(async () => (await state(page)).compareSet?.length ?? 0, { timeout: 20_000 }).toBe(1);
  await openRoute(page, 'm/candidates');
  await clickAndWaitForRoute(page, page.locator('[data-action="m-compare-add"]').nth(1), 'm/compare');
  await expect.poll(async () => (await state(page)).compareSet?.length ?? 0, { timeout: 20_000 }).toBe(2);

  await openRoute(page, 'm/compare');
  await clickAndWaitForRoute(page, page.locator('[data-action="m-save-compare"]'), 'm/result');
  await expect.poll(async () => (await state(page)).compareSaved, { timeout: 20_000 }).toBe(true);

  await openRoute(page, 'm/companion');
  await page.locator('[data-action="m-submit-care"]').click();
  await expect.poll(async () => (await state(page)).careSubmitted, { timeout: 20_000 }).toBe(true);
});

test('撤销授权清理方案、候选和比较状态', async ({ page }) => {
  await ensureAuthorization(page);
  expect((await state(page)).plan).toBeTruthy();

  await openRoute(page, 'm/allocation');
  await page.locator('#allocAuth').uncheck();
  await expect.poll(async () => (await state(page)).authorized, { timeout: 20_000 }).toBe(false);

  const cleared = await state(page);
  expect(cleared.plan).toBeNull();
  expect(cleared.candidates).toEqual([]);
  expect(cleared.compareSaved).toBe(false);
});
