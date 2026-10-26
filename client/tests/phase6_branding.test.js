import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

function getAllSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getAllSourceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('CAREERNEST PHASE 6 - BRANDING, ROUTING & UX STANDARDIZATION', async (t) => {
  await t.test('1. Brand standardization: client/src contains zero user-facing Aura remnants', () => {
    const srcDir = path.join(clientRoot, 'src');
    const sourceFiles = getAllSourceFiles(srcDir);
    const violations = [];

    // Regex for finding "Aura" as an isolated word (case-insensitive)
    const auraRegex = /\bAura\b/i;

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, lineIdx) => {
        // Exclude comments or non-user-facing technical symbols if any
        if (auraRegex.test(line)) {
          violations.push({
            file: path.relative(clientRoot, filePath),
            line: lineIdx + 1,
            text: line.trim()
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found legacy 'Aura' branding in client/src:\n${violations.map(v => `  ${v.file}:${v.line} -> ${v.text}`).join('\n')}`
    );
  });

  await t.test('2. Vercel SPA routing: client/vercel.json is properly configured with SPA rewrites', () => {
    const vercelConfigPath = path.join(clientRoot, 'vercel.json');
    assert.ok(fs.existsSync(vercelConfigPath), 'client/vercel.json must exist');

    const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
    const config = JSON.parse(configContent);
    assert.ok(Array.isArray(config.rewrites), 'vercel.json must have rewrites array');
    
    const catchAllRewrite = config.rewrites.find(r => r.destination === '/index.html');
    assert.ok(catchAllRewrite, 'vercel.json must rewrite route requests to /index.html');
    assert.strictEqual(catchAllRewrite.source, '/(.*)');
  });

  await t.test('3. Code splitting & Suspense boundary: App.jsx uses React.lazy and React.Suspense', () => {
    const appPath = path.join(clientRoot, 'src', 'App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    assert.match(appContent, /React\.lazy\(\s*\(\)\s*=>\s*import\(/, 'App.jsx must use React.lazy for code splitting');
    assert.match(appContent, /<React\.Suspense/, 'App.jsx must wrap routes with Suspense boundary');
    assert.match(appContent, /PageLoadingFallback/, 'App.jsx must provide a design-system loading fallback');
  });

  await t.test('4. Mentorship room authorization: MentorshipRoom.jsx checks session API before camera/timer', () => {
    const roomPath = path.join(clientRoot, 'src', 'pages', 'MentorshipRoom.jsx');
    const roomContent = fs.readFileSync(roomPath, 'utf8');

    assert.match(roomContent, /api\.get\(\s*`\/api\/mentors\/sessions\/\$\{id\}`\s*\)/, 'Must query backend session endpoint');
    assert.match(roomContent, /sessionError/, 'Must track and display authorization/session errors');
    assert.match(roomContent, /sessionLoading/, 'Must hold device access until authorization finishes');
    assert.match(roomContent, /STUN\/TURN/, 'Must disclose WebRTC infrastructure requirements without claiming live video is already streaming');
  });
});
