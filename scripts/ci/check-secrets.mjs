import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FORBIDDEN_FILES = [
  /(^|\/)\.env$/,
  /(^|\/)qwen\.key$/,
  /\.(pem|p12|pfx|key)$/i,
  /(^|\/)id_rsa$/
];

const SECRET_PATTERNS = [
  { name: 'private key', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: 'model API key', re: /\bsk-[A-Za-z0-9_-]{32,}\b/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ }
];

const REQUIRED_IGNORES = ['.env', 'qwen.key'];
const SKIP_CONTENT = /\.(png|jpe?g|gif|webp|ico|pdf|docx?|xlsx?|zip|woff2?|ttf|lock)$/i;

export function checkSecrets({ files, read, ignoreText }) {
  const violations = [];
  for (const file of files) {
    if (FORBIDDEN_FILES.some((rule) => rule.test(file))) violations.push(`tracked secret file: ${file}`);
  }
  const ignoreLines = (ignoreText || '').split('\n').map((line) => line.trim());
  for (const token of REQUIRED_IGNORES) {
    if (!ignoreLines.includes(token)) violations.push(`.gitignore missing ${token}`);
  }
  for (const file of files) {
    if (SKIP_CONTENT.test(file)) continue;
    let content;
    try { content = read(file); } catch { continue; }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.re.test(content)) violations.push(`${file}: ${pattern.name}`);
    }
  }
  return violations;
}

const isCli = import.meta.url === pathToFileURL(path.resolve(process.argv[1] || '')).href;
if (isCli) {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n').map((line) => line.trim()).filter(Boolean);
  const ignoreText = fs.readFileSync('.gitignore', 'utf8');
  const violations = checkSecrets({
    files,
    read: (file) => fs.readFileSync(file, 'utf8'),
    ignoreText
  });
  if (violations.length) {
    console.error(`ci-security FAILED: ${violations.length} secret issue(s)`);
    violations.forEach((line) => console.error('  ' + line));
    process.exit(1);
  }
  console.log(`ci-security OK: ${files.length} tracked files scanned, no secrets or missing ignore rules`);
}
