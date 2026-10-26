import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('CAREERNEST PHASE 7 - GATE 2: COURSE ENROLLMENT & VERIFIED PROGRESS UI', async (t) => {
  const courseDetailPath = path.join(rootDir, 'src', 'pages', 'CourseDetail.jsx');
  assert.ok(fs.existsSync(courseDetailPath), 'CourseDetail.jsx must exist');
  const courseDetailCode = fs.readFileSync(courseDetailPath, 'utf8');

  await t.test('1. Enrollment API integration: calls server endpoints for enrollment, module completion, and claim', () => {
    assert.match(courseDetailCode, /\/api\/courses\/\$\{id\}\/enroll/, 'CourseDetail must call POST /enroll');
    assert.match(courseDetailCode, /\/api\/courses\/\$\{id\}\/enrollment/, 'CourseDetail must call GET /enrollment');
    assert.match(courseDetailCode, /\/api\/courses\/\$\{id\}\/modules\/\$\{modId\}\/complete/, 'CourseDetail must call POST /modules/:modId/complete');
    assert.match(courseDetailCode, /\/api\/courses\/\$\{id\}\/claim-certificate/, 'CourseDetail must call POST /claim-certificate');
  });

  await t.test('2. Progress & Error handling: displays error notifications and enrollment states', () => {
    assert.match(courseDetailCode, /claimError/, 'CourseDetail must track and display claimError');
    assert.match(courseDetailCode, /enrollment\.progressPercent/, 'CourseDetail must bind to server-verified progressPercent');
    assert.match(courseDetailCode, /Enroll in Course/, 'CourseDetail must provide an explicit Enroll button for unenrolled users');
    assert.match(courseDetailCode, /Claim Course Certificate/, 'CourseDetail must provide Claim Course Certificate button');
  });
});
