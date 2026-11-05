export const SESSION_KEY = 'wealth-demo-session-id';

export async function waitForSession(page) {
  await page.waitForFunction(() => window.WealthApi?.connected === true, null, { timeout: 25_000 });
}

export async function openRoute(page, route) {
  await page.goto(`/#${route}`);
  await waitForSession(page);
  // Only assert that app.js rendered. PC and phone layouts differ by viewport,
  // so asserting a visible heading here would make contract tests viewport-bound.
  await page.waitForFunction(() => (document.querySelector('#app')?.children.length ?? 0) > 0);
}

export function state(page) {
  return page.evaluate(() => window.DemoSession?.get?.() || {});
}

export function storedSessionId(page) {
  return page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
}

export async function clickAndWaitForRoute(page, locator, route) {
  await locator.click();
  // Several handlers update session state first and only then change the hash,
  // so waiting on state alone lets a later navigation get overwritten.
  await page.waitForURL(`**/#${route}`, { timeout: 20_000 });
}

export async function ensureAuthorization(page) {
  await openRoute(page, 'm/allocation');
  const checkbox = page.locator('#allocAuth');
  if (!(await checkbox.isChecked())) await checkbox.check();
  await page.locator('[data-action="m-generate-allocation"]').click();
  await page.locator('#app').getByText('配置方案与候选已生成', { exact: false }).waitFor({ state: 'visible', timeout: 30_000 });
}
