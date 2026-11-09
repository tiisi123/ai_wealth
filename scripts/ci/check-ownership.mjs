import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Source of truth for W1 directory ownership. Longest prefix wins; an
// unregistered path is rejected by default and must be added here explicitly.
const OWNERSHIP = [
  ['public/actions/navigation.js', ['frontend-navigation']],
  ['public/actions/research.js', ['frontend-research']],
  ['public/actions/diagnosis.js', ['frontend-diagnosis']],
  ['public/actions/flow.js', ['frontend-flow']],
  ['public/actions/', ['frontend-lead']],
  ['public/actions-registry.js', ['frontend-lead']],
  ['public/app.js', ['frontend-lead']],
  ['public/index.html', ['frontend-lead']],
  ['public/style.css', ['frontend-lead']],
  ['public/demo-data.js', ['contract']],
  ['public/session-sync.js', ['contract']],
  ['public/requirements.js', ['docs']],
  ['.env.example', ['ci']],
  ['.gitignore', ['ci']],
  ['package.json', ['ci']],
  ['package-lock.json', ['ci']],
  ['playwright.config.js', ['test-e2e']],
  ['docker-compose.yml', ['ci']],
  ['Dockerfile', ['ci']],
  ['deploy/', ['ci']],
  ['.github/', ['ci']],
  ['src/components/sessions/', ['contract']],
  ['src/fixtures/', ['contract']],
  ['src/interfaces/http/', ['contract']],
  ['src/compositionRoot.js', ['contract']],
  ['src/config/', ['contract']],
  // A contract change is atomic: the code, the frozen contract document and the
  // state-contract locks must land in one PR. These exact files are the only
  // cross-domain files a contract PR may touch; both owners keep access.
  ['docs/api-contract.md', ['docs', 'contract']],
  ['tests/unit/session-contract.test.js', ['test-unit', 'contract']],
  ['tests/unit/activities.test.js', ['test-unit', 'contract']],
  ['tests/unit/frozen-set-regression.test.js', ['test-unit', 'contract']],
  // A fixture-data baseline change is atomic: the SQL seed, the contract-owned
  // JS fixtures and the acceptance checklist must land in one PR. These exact
  // files are the only cross-domain files a contract PR may touch; the original
  // owners keep access. Longest-prefix matching keeps the narrower rules above
  // in force for every other path.
  ['db/seeds/001_demo.sql', ['data', 'contract']],
  ['docs/w1-pending-features.md', ['docs', 'contract']],
  ['src/components/ai-orchestration/', ['backend']],
  ['src/components/business-rules/', ['backend']],
  ['src/components/data-knowledge/', ['backend']],
  ['src/components/demo-data/', ['backend']],
  ['src/platform/', ['backend']],
  ['src/app.js', ['backend']],
  ['src/server.js', ['backend']],
  ['db/', ['data']],
  ['scripts/seed/', ['data']],
  ['scripts/import/', ['data']],
  ['scripts/knowledge/', ['data']],
  ['scripts/sync/', ['data']],
  ['scripts/migrate.js', ['data']],
  ['scripts/seed.js', ['data']],
  ['scripts/acceptance/', ['test-e2e']],
  ['scripts/ci/', ['ci']],
  ['tests/unit/', ['test-unit']],
  ['tests/http/', ['test-unit']],
  ['tests/integration/', ['test-db']],
  ['tests/e2e/', ['test-e2e']],
  ['docs/', ['docs']],
  ['CONTEXT.md', ['docs']],
  ['README.md', ['docs']],
  ['wealth-prototype-demo-architecture.md', ['docs']]
];

const AGENTS = new Set([
  'frontend-lead', 'frontend-navigation', 'frontend-research',
  'frontend-diagnosis', 'frontend-flow', 'contract', 'backend', 'data',
  'test-unit', 'test-db', 'test-e2e', 'ci', 'docs'
]);

const eventName = process.env.EVENT_NAME || 'pull_request';
const headRef = process.env.PR_HEAD_REF || '';
const baseRef = process.env.BASE_REF || 'main';

if (eventName === 'merge_group') {
  console.log('ci-ownership: skipped on merge_group (validated at PR stage)');
  process.exit(0);
}

// The one-time initialization PR carries changes across every ownership
// domain, so a single agent branch could never pass. Exempt it by label
// (job still reports success, so ci-merge-gate keeps its simple aggregation).
const labels = (process.env.PR_LABELS || '').split(',').map((s) => s.trim().toLowerCase());
if (labels.includes('baseline')) {
  console.log('ci-ownership: baseline initialization PR exempt from ownership check');
  process.exit(0);
}

const match = headRef.match(/^ao\/([a-z0-9-]+)\/.+$/);
if (!match || !AGENTS.has(match[1])) {
  console.error(`ci-ownership: branch "${headRef}" must be ao/<agent-id>/<topic> with a registered agent id.`);
  console.error(`registered agents: ${[...AGENTS].sort().join(', ')}`);
  process.exit(1);
}
const agent = match[1];

let changed = [];
const injected = process.env.CHANGED_FILES;
if (injected) {
  changed = injected.split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);
} else {
  try {
    const out = execFileSync('git', ['diff', '--name-only', `origin/${baseRef}...HEAD`], { encoding: 'utf8' });
    changed = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (error) {
    console.error(`ci-ownership: cannot compute diff against origin/${baseRef}: ${error.message}`);
    process.exit(1);
  }
}

const ownerFor = (file) => {
  const normalized = path.posix.normalize(file.replace(/\\/g, '/'));
  let best = null;
  for (const [prefix, owners] of OWNERSHIP) {
    if (normalized.startsWith(prefix) && (!best || prefix.length > best.prefix.length)) best = { prefix, owners };
  }
  return best;
};

const violations = [];
for (const file of changed) {
  const rule = ownerFor(file);
  if (!rule) violations.push(`${file}  ->  unregistered path (ask the main agent to register it)`);
  else if (!rule.owners.includes(agent)) violations.push(`${file}  ->  owner: ${rule.owners.join('|')}, branch agent: ${agent}`);
}

if (violations.length) {
  console.error(`ci-ownership FAILED for ${agent}: ${violations.length} of ${changed.length} changed files are out of scope`);
  violations.forEach((line) => console.error('  ' + line));
  console.error('\nMove these changes to the owning agent\'s PR, or ask that owner to make them.');
  process.exit(1);
}

console.log(`ci-ownership OK: agent=${agent}, ${changed.length} changed file(s) all within its ownership scope`);
