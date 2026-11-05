const baseUrl = process.argv[2] || process.env.ACCEPTANCE_BASE_URL || 'http://localhost:3000';
const checks = [];

async function check(name, path, predicate = (response) => response.ok) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const body = await response.json().catch(() => ({}));
    const pass = predicate(response, body);
    checks.push({ name, pass, status: response.status, body: pass ? undefined : body });
  } catch (error) {
    checks.push({ name, pass: false, error: error.message });
  }
}

await check('health', '/api/health');
await check('static_frontend', '/');
await check('demo_data', '/api/demo-data', (_response, body) => Array.isArray(body.products) && body.customer?.id);
await check('knowledge_contract', '/api/knowledge', (_response, body) => Array.isArray(body.chunks) && body.status);
await check('ready', '/ready', (_response, body) => body.ready === true);

console.log(JSON.stringify({ base_url: baseUrl, pass: checks.every((item) => item.pass), checks }, null, 2));
if (checks.some((item) => !item.pass)) process.exitCode = 1;
