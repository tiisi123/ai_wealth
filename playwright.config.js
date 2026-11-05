import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT || 3100);
const baseURL = `http://127.0.0.1:${port}`;
const databaseUrl = process.env.DATABASE_URL || 'postgres://wealth:wealth@localhost:5432/wealth_demo';
// Local convenience: E2E_BROWSER_CHANNEL=chrome|msedge reuses an installed browser.
// CI leaves it unset so the pinned Chromium from `playwright install` is used.
const browserChannel = process.env.E2E_BROWSER_CHANNEL;
const projectUse = (device) => ({ ...device, ...(browserChannel ? { channel: browserChannel } : {}) });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    { name: 'pc', testIgnore: /mobile-flow\.spec\.js/, use: projectUse(devices['Desktop Chrome']) },
    { name: 'mobile', testIgnore: /pc-flow\.spec\.js/, use: projectUse(devices['Pixel 7']) }
  ],
  webServer: {
    command: 'node src/server.js',
    url: `${baseURL}/ready`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: 'test',
      PORT: String(port),
      DATA_MODE: 'database',
      AI_MODE: 'fixture',
      DATABASE_URL: databaseUrl,
      DATABASE_SSL: 'false',
      REQUIRE_MODEL: 'true',
      KNOWLEDGE_VECTOR_DIM: '1536'
    }
  }
});
