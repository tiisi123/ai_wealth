import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../../scripts/ci/check-ownership.mjs', import.meta.url));

function run(env) {
  try {
    const stdout = execFileSync(process.execPath, [script], {
      encoding: 'utf8',
      env: { ...process.env, EVENT_NAME: 'pull_request', ...env }
    });
    return { code: 0, output: stdout };
  } catch (error) {
    return { code: error.status, output: `${error.stdout || ''}${error.stderr || ''}` };
  }
}

test('a domain owner may change its own file', () => {
  const result = run({ PR_HEAD_REF: 'ao/frontend-flow/w1-test', CHANGED_FILES: 'public/actions/flow.js' });
  assert.equal(result.code, 0);
  assert.match(result.output, /ci-ownership OK/);
});

test('a domain owner cannot change another domain or app.js', () => {
  const result = run({ PR_HEAD_REF: 'ao/frontend-flow/w1-test', CHANGED_FILES: 'public/actions/flow.js,public/app.js' });
  assert.equal(result.code, 1);
  assert.match(result.output, /out of scope/);
  assert.match(result.output, /public\/app\.js/);
});

test('unregistered paths are rejected by default', () => {
  const result = run({ PR_HEAD_REF: 'ao/ci/test', CHANGED_FILES: 'some-random.txt' });
  assert.equal(result.code, 1);
  assert.match(result.output, /unregistered path/);
});

test('branch name must declare a registered agent id', () => {
  const result = run({ PR_HEAD_REF: 'feature/whatever', CHANGED_FILES: 'public/app.js' });
  assert.equal(result.code, 1);
  assert.match(result.output, /must be ao\//);
});

test('contract agent may change all of its owned paths', () => {
  const result = run({
    PR_HEAD_REF: 'ao/contract/w1-test',
    CHANGED_FILES: 'src/components/sessions/domain/session.js,src/fixtures/demoData.js,src/interfaces/http/routes.js'
  });
  assert.equal(result.code, 0);
});

test('merge_group skips the check because PR stage already validated it', () => {
  const result = run({ EVENT_NAME: 'merge_group', PR_HEAD_REF: 'gh-readonly-queue/main/pr-1', CHANGED_FILES: 'public/app.js' });
  assert.equal(result.code, 0);
  assert.match(result.output, /skipped/);
});

test('baseline-labelled initialization PR is exempt across all ownership domains', () => {
  const result = run({
    PR_HEAD_REF: 'ao/orchestrator/w1-baseline',
    PR_LABELS: 'w1, baseline',
    CHANGED_FILES: 'public/app.js,src/config/env.js,docs/api-contract.md,package.json'
  });
  assert.equal(result.code, 0);
  assert.match(result.output, /baseline initialization PR exempt/);
});
