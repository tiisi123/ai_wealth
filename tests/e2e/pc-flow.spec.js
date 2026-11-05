import { test, expect } from '@playwright/test';
import { openRoute, ensureAuthorization, state, waitForSession } from './helpers.js';

test('PC 闭环：研究 → 配置 → 候选 → 比较 → 保存，刷新后保持', async ({ page }) => {
  await openRoute(page, 'pc/research');
  await page.locator('#researchPrompt').fill('降息对固收+可能有什么影响？');
  await page.locator('[data-action="ask"]').first().click();
  await expect(page.locator('#app')).toContainText('研究结果', { timeout: 30_000 });
  expect((await state(page)).researchAnswer.text).toContain('演示桩');

  // PC 候选依赖配置方案，方案由同一应用的资产配置页生成，仍走真实 UI 与业务命令。
  await ensureAuthorization(page);
  expect((await state(page)).plan).toBeTruthy();

  await openRoute(page, 'pc/candidates');
  await page.locator('[data-action="generate-candidates"]').first().click();
  await expect.poll(async () => (await state(page)).candidates?.length ?? 0, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);

  // Write the comparison set before navigating: pageCompare renders an empty
  // state without a save button while compareSet is empty.
  await page.evaluate(async () => {
    const ids = (window.DemoSession?.get?.().candidates || []).slice(0, 2);
    await window.WealthApi.patch({ compareSet: ids });
    await window.WealthApi.whenSynced();
  });
  await openRoute(page, 'pc/compare');
  await page.locator('[data-action="save-pc-compare"], [data-action="save"]').first().click();
  await expect.poll(async () => (await state(page)).compareSaved, { timeout: 20_000 }).toBe(true);

  await page.reload();
  await waitForSession(page);
  expect((await state(page)).compareSaved).toBe(true);
  expect((await state(page)).researchAnswer.text).toContain('演示桩');
});
