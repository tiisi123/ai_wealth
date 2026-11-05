import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const FRONTEND_FILES = [
  '../../public/app.js',
  '../../public/actions/navigation.js',
  '../../public/actions/research.js',
  '../../public/actions/diagnosis.js',
  '../../public/actions/flow.js'
];
const source = FRONTEND_FILES.map((file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');

test('uncovered auxiliary entries are removed while retained entries stay available', () => {
  for (const removed of ['data-action="search"', 'data-action="notifications"', 'review-queue', 'start-integration', 'new-model', 'source-renew', '专精模型', 'pc/delivery', 'pc/model-delivery', 'pc/rollout', 'pc/acceptance', 'pc/models', 'pc/orchestration', 'pc/standards', 'pc/integration', 'pc/select-fund', 'pc/select-wealth', 'pc/select-insurance', 'pc/sources']) {
    assert.equal(source.includes(removed), false, `unexpected retained entry: ${removed}`);
  }
  for (const retained of ['task-center', 'source-detail']) {
    assert.ok(source.includes(retained), `missing retained entry: ${retained}`);
  }
});

test('acceptance automation and records remain in the repository', () => {
  assert.ok(fs.existsSync(new URL('../../scripts/acceptance/checks.js', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../../.github/workflows/ci.yml', import.meta.url)));
  assert.ok(source.includes('无独立运行页面'));
});
