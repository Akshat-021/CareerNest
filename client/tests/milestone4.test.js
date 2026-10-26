import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(__dirname, '..', '..', 'server');

test('CAREERNEST PHASE 4 - MILESTONE 4: COMMUNITY BACKEND & CORE SCREENS', async (t) => {
  await t.test('1. Community Backend Models: Community, CommunityPost, Report models exist with proper schemas', async () => {
    const modelsDir = path.join(serverRoot, 'models');
    assert.ok(fs.existsSync(path.join(modelsDir, 'Community.js')), 'Community.js must exist');
    assert.ok(fs.existsSync(path.join(modelsDir, 'CommunityPost.js')), 'CommunityPost.js must exist');
    assert.ok(fs.existsSync(path.join(modelsDir, 'Report.js')), 'Report.js must exist');

    const communityContent = fs.readFileSync(path.join(modelsDir, 'Community.js'), 'utf8');
    assert.match(communityContent, /slug:\s*\{/, 'Community has slug field');
    assert.match(communityContent, /isPrivate:\s*\{/, 'Community has isPrivate field');
    assert.match(communityContent, /isMentorLed:\s*\{/, 'Community has isMentorLed field');
    assert.match(communityContent, /enum:\s*\['owner',\s*'moderator',\s*'member'\]/, 'Community has scoped roles');
    assert.match(communityContent, /joinRequests:\s*\[/, 'Community tracks joinRequests');

    const postContent = fs.readFileSync(path.join(modelsDir, 'CommunityPost.js'), 'utf8');
    assert.match(postContent, /parentPost:\s*\{/, 'CommunityPost supports threaded replies via parentPost');
    assert.match(postContent, /replyCount:\s*\{/, 'CommunityPost tracks replyCount');
    assert.match(postContent, /isDeleted:\s*\{/, 'CommunityPost supports soft deletion');
  });

  await t.test('2. Community Core Screens: Hub, Detail, and Governance screens exist with complete feature set', async () => {
    const pagesDir = path.join(clientRoot, 'src', 'pages');

    // 1. CommunityHub.jsx
    const hubPath = path.join(pagesDir, 'CommunityHub.jsx');
    assert.ok(fs.existsSync(hubPath), 'CommunityHub.jsx must exist');
    const hubContent = fs.readFileSync(hubPath, 'utf8');
    assert.match(hubContent, /CATEGORIES/, 'CommunityHub has category filters');
    assert.match(hubContent, /activeTab/, 'CommunityHub has filter tabs');
    assert.match(hubContent, /handleCreateCommunity/, 'CommunityHub has create community flow');
    assert.match(hubContent, /handleJoinPublic/, 'CommunityHub supports joining public communities');
    assert.match(hubContent, /handleSendJoinRequest/, 'CommunityHub supports private join requests');

    // 2. CommunityDetail.jsx
    const detailPath = path.join(pagesDir, 'CommunityDetail.jsx');
    assert.ok(fs.existsSync(detailPath), 'CommunityDetail.jsx must exist');
    const detailContent = fs.readFileSync(detailPath, 'utf8');
    assert.match(detailContent, /handleCreatePost/, 'CommunityDetail has post composer');
    assert.match(detailContent, /threadedReplies/, 'CommunityDetail has nested threaded replies');
    assert.match(detailContent, /handleToggleLike/, 'CommunityDetail supports toggling likes');
    assert.match(detailContent, /handleSubmitReport/, 'CommunityDetail supports reporting content');
    assert.match(detailContent, /handleOpenEdit/, 'CommunityDetail supports post editing');

    // 3. CommunityManage.jsx
    const managePath = path.join(pagesDir, 'CommunityManage.jsx');
    assert.ok(fs.existsSync(managePath), 'CommunityManage.jsx must exist');
    const manageContent = fs.readFileSync(managePath, 'utf8');
    assert.match(manageContent, /handleReviewRequest/, 'CommunityManage reviews pending join requests');
    assert.match(manageContent, /handleUpdateRole/, 'CommunityManage manages member roles');
    assert.match(manageContent, /handleRemoveMember/, 'CommunityManage allows removing members');
    assert.match(manageContent, /handleReviewReport/, 'CommunityManage reviews moderation reports');
  });

  await t.test('3. Navigation & Route Integration: Community routes registered in App.jsx, Sidebar, and GlobalSearch', async () => {
    const appContent = fs.readFileSync(path.join(clientRoot, 'src', 'App.jsx'), 'utf8');
    assert.match(appContent, /path="\/communities"/, 'App.jsx registers /communities');
    assert.match(appContent, /path="\/communities\/:idOrSlug"/, 'App.jsx registers /communities/:idOrSlug');
    assert.match(appContent, /path="\/communities\/:idOrSlug\/manage"/, 'App.jsx registers /communities/:idOrSlug/manage');

    const sidebarContent = fs.readFileSync(path.join(clientRoot, 'src', 'components', 'navigation', 'Sidebar.jsx'), 'utf8');
    assert.match(sidebarContent, /path:\s*['"]\/communities['"]/, 'Sidebar includes /communities');

    const searchContent = fs.readFileSync(path.join(clientRoot, 'src', 'components', 'navigation', 'GlobalSearch.jsx'), 'utf8');
    assert.match(searchContent, /path:\s*['"]\/communities['"]/, 'GlobalSearch includes /communities');
  });

  await t.test('4. Milestone 4.1 UI Accessibility & State Handling: Error banners, spinners, empty states, and aria labels', async () => {
    const pagesDir = path.join(clientRoot, 'src', 'pages');

    const hubContent = fs.readFileSync(path.join(pagesDir, 'CommunityHub.jsx'), 'utf8');
    assert.match(hubContent, /aria-label="Refresh communities"/, 'Hub has accessible refresh button');
    assert.match(hubContent, /aria-label="Search communities"/, 'Hub has accessible search input');
    assert.match(hubContent, /<EmptyState/, 'Hub renders EmptyState when no cohorts match');
    assert.match(hubContent, /<Spinner/, 'Hub renders loading Spinner');

    const detailContent = fs.readFileSync(path.join(pagesDir, 'CommunityDetail.jsx'), 'utf8');
    assert.match(detailContent, /window\.confirm/, 'Detail uses confirmation dialog before leaving community');
    assert.match(detailContent, /<EmptyState/, 'Detail renders EmptyState on not found / error');
    assert.match(detailContent, /<Spinner/, 'Detail renders loading Spinner');

    const manageContent = fs.readFileSync(path.join(pagesDir, 'CommunityManage.jsx'), 'utf8');
    assert.match(manageContent, /window\.confirm/, 'Manage uses confirmation dialog before removing a member');
    assert.match(manageContent, /<EmptyState/, 'Manage renders EmptyState for access denied');
    assert.match(manageContent, /<Spinner/, 'Manage renders loading Spinner');
  });

  await t.test('5. Milestone 4.1 Legacy Coexistence: Forum, StudyPods, and Mentorship routes remain preserved', async () => {
    const appContent = fs.readFileSync(path.join(clientRoot, 'src', 'App.jsx'), 'utf8');
    assert.match(appContent, /path="\/forum"/, 'App.jsx preserves /forum route');
    assert.match(appContent, /path="\/study-pods"/, 'App.jsx preserves /study-pods route');
    assert.match(appContent, /path="\/mentors"/, 'App.jsx preserves /mentors route');

    const pagesDir = path.join(clientRoot, 'src', 'pages');
    assert.ok(fs.existsSync(path.join(pagesDir, 'ForumBoard.jsx')), 'ForumBoard.jsx must remain intact');
    assert.ok(fs.existsSync(path.join(pagesDir, 'StudyPods.jsx')), 'StudyPods.jsx must remain intact');
  });
});
