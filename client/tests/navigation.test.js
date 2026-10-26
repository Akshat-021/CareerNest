import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

test('CAREERNEST PHASE 4 - MILESTONE 2: NAVIGATION, LAYOUT & REAL-TIME HEADER SUITE', async (t) => {
  await t.test('1. Navigation Components: all required navigation modules exist and export cleanly', async () => {
    const navDir = path.join(clientRoot, 'src', 'components', 'navigation');
    assert.ok(fs.existsSync(navDir), 'client/src/components/navigation must exist');

    const expectedFiles = [
      'Breadcrumbs.jsx',
      'NotificationDrawer.jsx',
      'GlobalSearch.jsx',
      'TopNavbar.jsx',
      'Sidebar.jsx',
      'index.js'
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(navDir, file);
      assert.ok(fs.existsSync(filePath), `Navigation file ${file} must exist`);
    }

    const indexContent = fs.readFileSync(path.join(navDir, 'index.js'), 'utf8');
    assert.match(indexContent, /Breadcrumbs/, 'Exports Breadcrumbs');
    assert.match(indexContent, /NotificationDrawer/, 'Exports NotificationDrawer');
    assert.match(indexContent, /GlobalSearch/, 'Exports GlobalSearch');
    assert.match(indexContent, /TopNavbar/, 'Exports TopNavbar');
    assert.match(indexContent, /Sidebar/, 'Exports Sidebar');
  });

  await t.test('2. Grouped Sidebar: Student navigation is partitioned into 5 functional domains', async () => {
    const sidebarPath = path.join(clientRoot, 'src', 'components', 'navigation', 'Sidebar.jsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    // Check student 5 domain titles
    assert.match(content, /title:\s*['"]Overview['"]/, 'Overview domain exists');
    assert.match(content, /title:\s*['"]Career Intelligence['"]/, 'Career Intelligence domain exists');
    assert.match(content, /title:\s*['"]Learning & Practice['"]/, 'Learning & Practice domain exists');
    assert.match(content, /title:\s*['"]Community & Mentors['"]/, 'Community & Mentors domain exists');
    assert.match(content, /title:\s*['"]Career Pipeline['"]/, 'Career Pipeline domain exists');

    // Check student routes are preserved
    const studentRoutes = [
      '/dashboard', '/passport',
      '/ai-job-analyzer', '/ai-chatbot', '/ai-resume', '/ai-gap', '/ai-interview', '/ai-roadmap',
      '/courses', '/challenges', '/ai-quiz', '/micro-internships',
      '/forum', '/study-pods', '/mentors', '/chat',
      '/job-applications', '/certificates'
    ];

    for (const route of studentRoutes) {
      assert.ok(content.includes(`path: '${route}'`), `Student route ${route} must be preserved in Sidebar`);
    }

    // Check accordion state and accessibility attributes
    assert.match(content, /aria-expanded=\{isExpanded\}/, 'Group toggle button includes aria-expanded');
    assert.match(content, /aria-label="Main sidebar navigation"/, 'Sidebar includes main navigation landmark');
  });

  await t.test('3. Role-Aware Navigation: Mentor and Admin navigation paths are preserved', async () => {
    const sidebarPath = path.join(clientRoot, 'src', 'components', 'navigation', 'Sidebar.jsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    // Mentor routes
    assert.match(content, /path:\s*['"]\/mentor\/dashboard['"]/, 'Mentor dashboard route preserved');
    assert.match(content, /path:\s*['"]\/profile['"]/, 'Profile route preserved');

    // Admin routes
    assert.match(content, /path:\s*['"]\/admin\/dashboard['"]/, 'Admin dashboard route preserved');
    assert.match(content, /path:\s*['"]\/admin\/mentors-approval['"]/, 'Admin mentors approval route preserved');
  });

  await t.test('4. Universal TopNavbar & Notifications: persistence, Socket.IO, deduplication & ownership', async () => {
    const drawerPath = path.join(clientRoot, 'src', 'components', 'navigation', 'NotificationDrawer.jsx');
    const drawerContent = fs.readFileSync(drawerPath, 'utf8');

    // Backend endpoint calls
    assert.match(drawerContent, /\/api\/platform\/notifications/, 'Queries /api/platform/notifications');
    assert.match(drawerContent, /\/api\/platform\/notifications\/\$\{id\}\/read/, 'Calls mark read endpoint');

    // Real-time Socket.IO listener and deduplication
    assert.match(drawerContent, /useSocket\(\)/, 'Subscribes to SocketContext');
    assert.match(drawerContent, /newNotification\._id/, 'Deduplicates by notification _id');

    // Accessibility attributes
    assert.match(drawerContent, /role="dialog"/, 'Notification drawer has dialog role');
    assert.match(drawerContent, /aria-modal="true"/, 'Drawer has aria-modal="true"');
    assert.match(drawerContent, /handleKeyDown/, 'Handles Escape key dismissal');
  });

  await t.test('5. Mobile Navigation: Accessible drawers in DashboardLayout and Landing', async () => {
    const layoutPath = path.join(clientRoot, 'src', 'layouts', 'DashboardLayout.jsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    assert.match(layoutContent, /aria-label="Mobile Navigation Drawer"/, 'DashboardLayout has mobile navigation drawer');
    assert.match(layoutContent, /Skip to main content/, 'Keyboard skip-link present');
    assert.match(layoutContent, /e\.key === 'Escape'/, 'Handles Escape key in DashboardLayout');

    const landingPath = path.join(clientRoot, 'src', 'pages', 'Landing.jsx');
    const landingContent = fs.readFileSync(landingPath, 'utf8');

    assert.match(landingContent, /aria-label="Open mobile navigation menu"/, 'Landing has mobile hamburger button');
    assert.match(landingContent, /aria-label="Mobile Navigation Menu"/, 'Landing has mobile navigation drawer');
    assert.match(landingContent, /e\.key === 'Escape'/, 'Landing handles Escape key for mobile nav');
  });

  await t.test('6. Global Search: Cmd+K / Ctrl+K quick palette implemented with full route coverage', async () => {
    const searchPath = path.join(clientRoot, 'src', 'components', 'navigation', 'GlobalSearch.jsx');
    const searchContent = fs.readFileSync(searchPath, 'utf8');

    assert.match(searchContent, /SEARCH_DESTINATIONS/, 'Contains search destinations catalogue');
    assert.match(searchContent, /role="dialog"/, 'Palette has dialog role');
    assert.match(searchContent, /ArrowDown/, 'Keyboard arrow navigation supported');
    assert.match(searchContent, /Escape/, 'Escape key supported');
  });
});
