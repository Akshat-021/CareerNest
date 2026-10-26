/**
 * Regression Tests: Phase 2 Critical Functionality Fixes
 * Covers:
 * 1. Forgot Password & Reset Password flow
 * 2. AI Skill Gap frontend/backend response shape normalization
 * 3. Certificate schema alignment, issuance & dual-identifier verification
 * 4. Notification persistence, bidirectional schema sync & ownership checks
 * 5. Resume text extraction & evidence-based heuristic fallback evaluation
 */

const assert = require('assert');
const path = require('path');
const mongoose = require('mongoose');

console.log('\n=========================================');
console.log('CAREERNEST: PHASE 2 CRITICAL FUNCTIONALITY REGRESSION TESTS');
console.log('=========================================\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${name}`);
    console.error(`  Reason: ${err.message}`);
    failed++;
  }
}

async function runCriticalFixesTests() {
  // ---------------------------------------------------------
  // 1. Forgot Password & Reset Password Flow
  // ---------------------------------------------------------
  const User = require('../models/User');
  const authController = require('../controllers/authController');

  await test('authController.forgotPassword returns 404 for unregistered email', async () => {
    const originalFindOne = User.findOne;
    User.findOne = async () => null;

    let statusCode = null;
    let jsonResp = null;
    const req = { body: { email: 'nonexistent@example.com' } };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (d) => { jsonResp = d; } };
      }
    };

    await authController.forgotPassword(req, res, () => {});
    assert.strictEqual(statusCode, 404);
    assert.strictEqual(jsonResp.success, false);

    User.findOne = originalFindOne;
  });

  await test('authController.forgotPassword generates OTP and returns success for valid user', async () => {
    let savedOtp = null;
    let savedExpiry = null;
    const mockUser = {
      email: 'student@example.com',
      save: async function() {
        savedOtp = this.otp;
        savedExpiry = this.otpExpires;
      }
    };
    const originalFindOne = User.findOne;
    User.findOne = async () => mockUser;

    let statusCode = null;
    let jsonResp = null;
    const req = { body: { email: 'student@example.com' } };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (d) => { jsonResp = d; } };
      }
    };

    await authController.forgotPassword(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);
    assert.ok(savedOtp && savedOtp.length === 6, 'Should generate a 6-digit OTP');
    assert.ok(savedExpiry > new Date(), 'OTP expiry should be in the future');

    User.findOne = originalFindOne;
  });

  await test('authController.resetPassword validates OTP and updates password', async () => {
    let passwordUpdated = false;
    const mockUser = {
      email: 'student@example.com',
      otp: '123456',
      otpExpires: new Date(Date.now() + 60000),
      save: async function() {
        if (this.password === 'newStrongPass123') passwordUpdated = true;
      }
    };
    const originalFindOne = User.findOne;
    User.findOne = async () => mockUser;

    let statusCode = null;
    let jsonResp = null;
    const req = {
      body: {
        email: 'student@example.com',
        otp: '123456',
        newPassword: 'newStrongPass123'
      }
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (d) => { jsonResp = d; } };
      }
    };

    await authController.resetPassword(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);
    assert.strictEqual(passwordUpdated, true);
    assert.strictEqual(mockUser.otp, null, 'OTP should be cleared upon reset');

    User.findOne = originalFindOne;
  });

  // ---------------------------------------------------------
  // 2. AI Skill Gap Response Normalization
  // ---------------------------------------------------------
  const aiController = require('../controllers/aiController');
  const careerProfileService = require('../services/careerProfileService');

  await test('aiController.skillGapAnalysis produces normalized payload matching frontend expectations', async () => {
    const originalGetProfile = careerProfileService.getOrCreateProfile;
    careerProfileService.getOrCreateProfile = async () => ({
      targetRole: 'Full Stack Engineer',
      skills: [{ name: 'React' }, { name: 'JavaScript' }, { name: 'HTML' }]
    });

    let statusCode = null;
    let jsonResp = null;
    const req = { user: { id: new mongoose.Types.ObjectId().toString() } };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (d) => { jsonResp = d; } };
      }
    };

    await aiController.skillGapAnalysis(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);

    const analysis = jsonResp.analysis;
    assert.ok(Array.isArray(analysis.missingSkills), 'missingSkills must be an array');
    assert.ok(Array.isArray(analysis.recommendedLearningPath), 'recommendedLearningPath must be an array');
    assert.ok(Array.isArray(analysis.recommendedCourses), 'recommendedCourses must be an array');
    assert.ok(Array.isArray(analysis.practiceProjects), 'practiceProjects must be an array');
    assert.strictEqual(typeof analysis.timeline, 'string', 'timeline must be a string');

    careerProfileService.getOrCreateProfile = originalGetProfile;
  });

  // ---------------------------------------------------------
  // 3. Certificate Schema, Creation & Dual Lookup Alignment
  // ---------------------------------------------------------
  const Certificate = require('../models/Certificate');
  const platformController = require('../controllers/platformController');

  await test('Certificate model pre-validate hook bidirectionally harmonizes aliases', async () => {
    const cert = new Certificate({
      student: new mongoose.Types.ObjectId(),
      verificationCode: 'NEST-TEST-2026',
      courseTitle: 'Advanced Cloud Architecture'
    });

    await cert.validate();
    assert.strictEqual(cert.certificateId, 'NEST-TEST-2026', 'certificateId should be populated from verificationCode');
    assert.strictEqual(cert.courseName, 'Advanced Cloud Architecture', 'courseName should be populated from courseTitle');
    assert.ok(cert.qrCodeData && cert.qrCodeData.includes('NEST-TEST-2026'), 'qrCodeData should be populated');
    assert.ok(cert.issuedDate, 'issuedDate should be defined');
    assert.ok(cert.issueDate, 'issueDate should be defined');
  });

  await test('platformController.verifyCertificate finds certificate by certificateId or verificationCode', async () => {
    const originalFindOne = Certificate.findOne;
    let queryUsed = null;

    Certificate.findOne = function(query) {
      queryUsed = query;
      return {
        populate: async () => ({
          certificateId: 'NEST-VALID-001',
          verificationCode: 'NEST-VALID-001',
          courseTitle: 'Full Stack Modern Web Architecture',
          student: { name: 'Alex Rivera' }
        })
      };
    };

    let statusCode = null;
    let jsonResp = null;
    const req = { params: { id: 'NEST-VALID-001' } };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (d) => { jsonResp = d; } };
      }
    };

    await platformController.verifyCertificate(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.verified, true);
    assert.ok(queryUsed.$or, 'Query must use $or to support both verificationCode and certificateId');

    Certificate.findOne = originalFindOne;
  });

  // ---------------------------------------------------------
  // 4. Notification Schema Sync & Query Alignment
  // ---------------------------------------------------------
  const Notification = require('../models/Notification');

  await test('Notification model synchronizes recipient and user fields', async () => {
    const testUserId = new mongoose.Types.ObjectId();
    const notif = new Notification({
      recipient: testUserId,
      title: 'New Session Booking',
      message: 'Your mentorship slot has been reserved.'
    });

    await notif.validate();
    assert.strictEqual(notif.user.toString(), testUserId.toString(), 'user should sync from recipient');
    assert.strictEqual(notif.recipient.toString(), testUserId.toString(), 'recipient should match');
  });

  await test('platformController.getNotifications queries both user and recipient fields', async () => {
    const originalFind = Notification.find;
    let queryUsed = null;

    Notification.find = function(query) {
      queryUsed = query;
      return {
        sort: async () => [
          { title: 'Welcome', message: 'Hello', isRead: false }
        ]
      };
    };

    let statusCode = null;
    let jsonResp = null;
    const req = { user: { id: new mongoose.Types.ObjectId().toString() } };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: (d) => { jsonResp = d; } };
      }
    };

    await platformController.getNotifications(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.count, 1);
    assert.ok(queryUsed.$or, 'Notification query must use $or to match either recipient or user');

    Notification.find = originalFind;
  });

  // ---------------------------------------------------------
  // 5. Resume Document Text Extraction & Evidence-Based Heuristic Evaluation
  // ---------------------------------------------------------
  const { extractDocumentText } = require('../services/documentParser');
  const aiService = require('../services/gemini');

  await test('extractDocumentText extracts plain text from document buffer', async () => {
    const sampleResumeContent = `
John Doe
Software Engineer | Full Stack Developer
Email: john.doe@example.com | LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

Summary:
Dedicated engineer with 2+ years building web applications and microservices.

Technical Skills:
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Docker, Git, REST APIs

Professional Experience:
Software Engineer at Acme Corp (2023 - Present)
- Engineered scalable microservices in Node.js and Express handling 50,000+ daily API requests.
- Optimized PostgreSQL database indexing, reducing query latency by 35%.
- Implemented responsive frontend dashboards in React and TypeScript with unit testing.

Education:
Bachelor of Science in Computer Science, University of Technology (2019 - 2023)
    `.trim();

    const mockFile = {
      originalname: 'resume_johndoe.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from(sampleResumeContent, 'utf-8')
    };

    const extracted = await extractDocumentText(mockFile);
    assert.ok(extracted.text.length > 200, 'Should extract substantial text');
    assert.strictEqual(extracted.format, 'text');
    assert.ok(extracted.text.includes('Acme Corp'));
  });

  await test('aiService.analyzeResume performs evidence-based heuristic scoring with transparent fallback indicators', async () => {
    const realExtractedResume = `
Jane Smith
Full Stack Developer
Email: jane@smith.dev | GitHub: github.com/janesmith | LinkedIn: linkedin.com/in/janesmith

Experience:
Full Stack Developer at Alpha Solutions
- Architected REST APIs using Node.js and Express serving 100,000+ users.
- Built customer-facing dashboard in React and Tailwind CSS.
- Containerized development workflows using Docker.

Projects:
- E-Commerce Microservices: Engineered distributed catalog with Redis caching and PostgreSQL.

Education:
B.S. Software Engineering, State University

Skills:
React, Node.js, Express, JavaScript, TypeScript, PostgreSQL, Redis, Docker, Git, REST API
    `.trim();

    const evaluation = await aiService.analyzeResume(realExtractedResume, 'Full Stack');

    assert.strictEqual(evaluation.isSimulatedFallback, true, 'Fallback indicator must be transparently true');
    assert.strictEqual(evaluation.aiEngine, 'evidence-based-heuristic-v1');
    assert.ok(evaluation.disclaimer, 'Must include honest disclaimer about deferred live Gemini API');
    
    // Evidence checks
    assert.ok(evaluation.detectedSkills.includes('React'), 'Should detect React in resume');
    assert.ok(evaluation.detectedSkills.includes('Node.js') || evaluation.detectedSkills.includes('Nodejs'), 'Should detect Node.js');
    assert.ok(evaluation.detectedSkills.includes('Docker'), 'Should detect Docker');
    assert.ok(evaluation.sectionsIdentified.includes('Experience'), 'Should identify Experience section');
    assert.ok(evaluation.sectionsIdentified.includes('Education'), 'Should identify Education section');
    assert.ok(evaluation.sectionsIdentified.includes('Projects'), 'Should identify Projects section');
    
    // Scoring validation
    assert.ok(evaluation.atsScore >= 70 && evaluation.atsScore <= 95, `ATS score ${evaluation.atsScore} should be grounded in evidence`);
    assert.strictEqual(evaluation.rating, 'Excellent');
  });

  console.log('\n=========================================');
  console.log(`CRITICAL FIXES TESTS FINISHED: ${passed} passed, ${failed} failed`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCriticalFixesTests().catch((err) => {
  console.error('Critical fixes test suite runner crashed:', err);
  process.exit(1);
});
