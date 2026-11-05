import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSecrets } from '../../scripts/ci/check-secrets.mjs';

// Assembled at runtime so this tracked file never contains a literal PEM
// header that the repository's own secret scanner would flag.
const FAKE_PEM_HEADER = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');

const IGNORE = ['.env', '.env.*', '!.env.example', 'qwen.key', 'node_modules/'].join('\n');

function run(files, contents = {}, ignoreText = IGNORE) {
  return checkSecrets({ files, read: (file) => contents[file] ?? '', ignoreText });
}

test('a clean tracked tree produces no violations', () => {
  assert.deepEqual(
    run(['src/app.js', 'docs/api-contract.md', '.gitignore'], {
      'src/app.js': 'export const app = 1;',
      'docs/api-contract.md': 'postgres://wealth:wealth@localhost:5432/wealth_demo',
      '.gitignore': IGNORE
    }),
    []
  );
});

test('a tracked .env or qwen.key is rejected', () => {
  const result = run(['.env', 'config/qwen.key'], { '.env': 'FOO=bar' });
  assert.ok(result.some((line) => line.includes('tracked secret file: .env')));
  assert.ok(result.some((line) => line.includes('config/qwen.key')));
});

test('private key and model API key patterns are rejected', () => {
  const result = run(['src/a.js', 'src/b.js'], {
    'src/a.js': `const pem = "${FAKE_PEM_HEADER}\\nMIIEvQIBADANBgkq";`,
    'src/b.js': 'const key = "sk-' + 'a'.repeat(40) + '";'
  });
  assert.ok(result.some((line) => line.includes('private key')));
  assert.ok(result.some((line) => line.includes('model API key')));
});

test('demo connection strings are not mistaken for secrets', () => {
  assert.deepEqual(
    run(['docker-compose.yml', '.gitignore'], {
      'docker-compose.yml': 'DATABASE_URL=postgres://wealth:wealth@db:5432/wealth_demo',
      '.gitignore': IGNORE
    }),
    []
  );
});

test('missing ignore rules are reported', () => {
  const result = run(['src/app.js'], { 'src/app.js': 'ok' }, '.env\n');
  assert.ok(result.some((line) => line.includes('missing qwen.key')));
});
