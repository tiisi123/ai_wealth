import { test, expect } from '@playwright/test';
import { openRoute, state, waitForSession } from './helpers.js';

test('W1 工作项写入服务端权威状态，刷新后仍可恢复', async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name === 'mobile';
  await openRoute(page, isMobile ? 'm/fund' : 'pc/architecture');
  const selector = isMobile ? '[data-action="mobile-search"]' : '[data-action="task-center"]';
  await page.locator(selector).first().click();

  await expect(page.locator('#app')).toContainText('服务端状态', { timeout: 20_000 });
  await expect(page.locator('#app')).toContainText('已由应用服务写入真实记录', { timeout: 20_000 });

  const before = await state(page);
  expect(before.activities.length).toBe(1);
  expect(before.activities[0].activity_id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(before.activities[0].kind).toBe(isMobile ? 'mobile-search' : 'task-center');
  expect(before.activities[0].data_version).toBe('demo-2026-09-28-v1');

  await page.reload();
  await waitForSession(page);
  expect((await state(page)).activities.length).toBe(1);
});

test('未知操作显示 W1 未实现失败态，不伪装成功也不写入状态', async ({ page }) => {
  await openRoute(page, 'pc/architecture');
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.dataset.action = 'w1-unknown-action';
    button.textContent = 'unknown';
    // Keep it inside #app and above the full-screen PC shell so the delegated
    // document click handler reliably receives it in both viewports.
    button.style.cssText = 'position:fixed;top:4px;left:4px;z-index:99999;width:80px;height:30px';
    document.querySelector('#app').appendChild(button);
  });
  await page.locator('#app [data-action="w1-unknown-action"]').click();
  await expect(page.locator('#app')).toContainText('W1 未实现', { timeout: 20_000 });
  expect(((await state(page)).activities || []).length).toBe(0);
});
