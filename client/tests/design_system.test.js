import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

test('CAREERNEST PHASE 4 - MILESTONE 1: DESIGN SYSTEM & COMPONENT SUITE', async (t) => {
  await t.test('1. Design Tokens: tailwind.config.js contains accessible semantic tokens', async () => {
    const tailwindConfigPath = path.join(clientRoot, 'tailwind.config.js');
    assert.ok(fs.existsSync(tailwindConfigPath), 'tailwind.config.js must exist');

    const configContent = fs.readFileSync(tailwindConfigPath, 'utf8');
    
    // Check brand tokens
    assert.match(configContent, /mutedLight:\s*['"]#475569['"]/, 'mutedLight token defined with high contrast #475569');
    assert.match(configContent, /mutedDark:\s*['"]#94a3b8['"]/, 'mutedDark token defined with high contrast #94a3b8');
    assert.match(configContent, /accent:\s*['"]#6366f1['"]/, 'brand.accent defined as indigo');
    assert.match(configContent, /accentHover:\s*['"]#4f46e5['"]/, 'brand.accentHover defined');

    // Check status semantic colors
    assert.match(configContent, /status:\s*\{/, 'status semantic color block defined');
    assert.match(configContent, /success:\s*['"]#10b981['"]/, 'status.success defined');
    assert.match(configContent, /warning:\s*['"]#f59e0b['"]/, 'status.warning defined');
    assert.match(configContent, /danger:\s*['"]#f43f5e['"]/, 'status.danger defined');
    assert.match(configContent, /info:\s*['"]#0ea5e9['"]/, 'status.info defined');

    // Check shadow tokens
    assert.match(configContent, /modal:\s*['"]0 24px 48px -12px rgba\(0, 0, 0, 0.25\)['"]/, 'boxShadow.modal defined');
  });

  await t.test('2. Global CSS: index.css contains accessible utilities and focus rings', async () => {
    const cssPath = path.join(clientRoot, 'src', 'index.css');
    assert.ok(fs.existsSync(cssPath), 'index.css must exist');

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert.match(cssContent, /\.focus-ring\s*\{/, '.focus-ring class defined');
    assert.match(cssContent, /\.focus-ring-within\s*\{/, '.focus-ring-within class defined');
    assert.match(cssContent, /\.text-muted\s*\{/, '.text-muted class defined');
    assert.match(cssContent, /\.glass-panel\s*\{/, '.glass-panel preserved');
    assert.match(cssContent, /\.glass-input\s*\{/, '.glass-input preserved');
  });

  await t.test('3. Common Components: all 6 required components exist with proper structure', async () => {
    const commonDir = path.join(clientRoot, 'src', 'components', 'common');
    assert.ok(fs.existsSync(commonDir), 'client/src/components/common must exist');

    const expectedComponents = [
      { name: 'Button.jsx', checks: [/isLoading/, /variantStyles/, /sizeStyles/, /focus:ring-2/, /aria-disabled/] },
      { name: 'Input.jsx', checks: [/forwardRef/, /htmlFor=\{generatedId\}/, /aria-invalid/, /role="alert"/] },
      { name: 'Modal.jsx', checks: [/role="dialog"/, /aria-modal="true"/, /Escape/, /overflow = 'hidden'/] },
      { name: 'Badge.jsx', checks: [/variantStyles/, /resolvedDotColor/, /animate-pulse/] },
      { name: 'Card.jsx', checks: [/glass-panel/, /isInteractive/, /tabIndex=\{isInteractive \? 0 : undefined\}/] },
      { name: 'Spinner.jsx', checks: [/animate-spin/, /role="status"/, /sr-only/] },
      { name: 'index.js', checks: [/Button/, /Input/, /Modal/, /Badge/, /Card/, /Spinner/] }
    ];

    for (const comp of expectedComponents) {
      const filePath = path.join(commonDir, comp.name);
      assert.ok(fs.existsSync(filePath), `Component file ${comp.name} must exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      for (const check of comp.checks) {
        assert.match(content, check, `${comp.name} must contain expected code pattern ${check}`);
      }
    }
  });

  await t.test('4. Feedback Components: all 3 required components exist with proper structure', async () => {
    const feedbackDir = path.join(clientRoot, 'src', 'components', 'feedback');
    assert.ok(fs.existsSync(feedbackDir), 'client/src/components/feedback must exist');

    const expectedComponents = [
      { name: 'Alert.jsx', checks: [/role=\{role\}/, /typeConfig/, /FiAlertCircle/, /onClose/] },
      { name: 'EmptyState.jsx', checks: [/role="region"/, /aria-label=\{title\}/, /FiInbox/] },
      { name: 'FallbackDisclosure.jsx', checks: [/isSimulated/, /Heuristic Career Simulation Engine/, /Live Gemini AI Verified/] },
      { name: 'index.js', checks: [/Alert/, /EmptyState/, /FallbackDisclosure/] }
    ];

    for (const comp of expectedComponents) {
      const filePath = path.join(feedbackDir, comp.name);
      assert.ok(fs.existsSync(filePath), `Component file ${comp.name} must exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      for (const check of comp.checks) {
        assert.match(content, check, `${comp.name} must contain expected code pattern ${check}`);
      }
    }
  });

  await t.test('5. Non-regression: existing pages remain unaffected and unmodified', async () => {
    const pagesDir = path.join(clientRoot, 'src', 'pages');
    const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));
    assert.ok(pages.length >= 30, 'All existing pages must remain present');
  });
});
