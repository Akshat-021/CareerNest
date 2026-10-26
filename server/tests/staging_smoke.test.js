const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'staging_jwt_secret_careernest_2026';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'staging_jwt_refresh_secret_careernest_2026';

const STAGING_URI = process.env.STAGING_MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-staging';

// Models
const User = require('../models/User');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const Certificate = require('../models/Certificate');
const Community = require('../models/Community');
const StudyPod = require('../models/StudyPod');
const Session = require('../models/Session');
const ForumPost = require('../models/Forum');

// Controllers
const authController = require('../controllers/authController');
const courseController = require('../controllers/courseController');
const platformController = require('../controllers/platformController');
const mentorController = require('../controllers/mentorController');

// Helper to create mock Express req & res
function createMockReqRes({ user, params = {}, body = {}, query = {}, headers = {} } = {}) {
  const req = {
    user: user || null,
    params,
    body,
    query,
    headers
  };

  const res = {
    statusCode: 200,
    data: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    }
  };

  const next = (err) => {
    if (err) res.error = err;
  };

  return { req, res, next };
}

test('CAREERNEST PHASE 7: GATE 3 - STAGING SMOKE & INTEGRATION SUITE', async (t) => {
  // Connect to isolated staging database
  await mongoose.connect(STAGING_URI);

  let studentUser = await User.findOne({ email: 'student.staging@careernest.org' });
  let mentorUser = await User.findOne({ email: 'mentor.staging@careernest.org' });
  let adminUser = await User.findOne({ email: 'admin.staging@careernest.org' });
  let stagingCourse = await Course.findOne({ title: 'Cloud Native Microservices Architecture' });

  assert.ok(studentUser, 'Synthetic staging student must exist');
  assert.ok(mentorUser, 'Synthetic staging mentor must exist');
  assert.ok(adminUser, 'Synthetic staging admin must exist');
  assert.ok(stagingCourse, 'Synthetic staging course must exist');

  let studentToken = null;
  let studentRefreshToken = null;

  await t.test('1. Authentication: Student login, JWT issuance, and token refresh', async () => {
    const { req: loginReq, res: loginRes, next: loginNext } = createMockReqRes({
      body: {
        email: 'student.staging@careernest.org',
        password: 'StagingTestPass123!'
      }
    });

    await authController.login(loginReq, loginRes, loginNext);
    assert.equal(loginRes.statusCode, 200);
    assert.equal(loginRes.data.success, true);
    assert.ok(loginRes.data.accessToken, 'Must return JWT access token');
    assert.ok(loginRes.data.refreshToken, 'Must return JWT refresh token');

    studentToken = loginRes.data.accessToken;
    studentRefreshToken = loginRes.data.refreshToken;

    // Verify token refresh using authController.refresh
    const { req: refreshReq, res: refreshRes, next: refreshNext } = createMockReqRes({
      body: { refreshToken: studentRefreshToken }
    });

    await authController.refresh(refreshReq, refreshRes, refreshNext);
    assert.equal(refreshRes.statusCode, 200);
    assert.equal(refreshRes.data.success, true);
    assert.ok(refreshRes.data.accessToken, 'Must return refreshed access token');
  });

  await t.test('2. Role Boundary: Student rejected when attempting to create a course (HTTP 403)', async () => {
    const { req, res, next } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      body: {
        title: 'Unauthorized Student Course',
        description: 'Testing role enforcement',
        category: 'Engineering',
        difficulty: 'Easy'
      }
    });

    await courseController.createCourse(req, res, next);
    assert.equal(res.statusCode, 403);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /Only approved mentors or administrators/i);
  });

  await t.test('3. Role Boundary: Approved mentor successfully creates a course (HTTP 201)', async () => {
    const { req, res, next } = createMockReqRes({
      user: { id: mentorUser._id.toString(), role: 'mentor' },
      body: {
        title: 'Advanced Kubernetes & Istio Service Mesh',
        description: 'Production cluster management and zero-trust networking.',
        category: 'Engineering',
        difficulty: 'Hard',
        duration: '5 weeks',
        prerequisites: JSON.stringify(['Docker', 'Kubernetes']),
        modules: JSON.stringify([{ title: 'Pod Topology & Scheduling' }]),
        projects: JSON.stringify([{ title: 'Istio Canary Deployment Engine', difficulty: 'Hard' }])
      }
    });

    await courseController.createCourse(req, res, next);
    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.course);
  });

  await t.test('4. Course Enrollment & Verified Completion: Complete flow from enrollment to certificate', async () => {
    // Clean up any prior test enrollments
    await CourseEnrollment.deleteMany({ student: studentUser._id, course: stagingCourse._id });
    await Certificate.deleteMany({ student: studentUser._id, courseTitle: stagingCourse.title });

    // Step 1: Check enrollment status before enrolling
    const { req: enrReq1, res: enrRes1, next: enrNext1 } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString() }
    });
    await courseController.getCourseEnrollment(enrReq1, enrRes1, enrNext1);
    assert.equal(enrRes1.statusCode, 200);
    assert.equal(enrRes1.data.enrolled, false);

    // Step 2: Enroll in course
    const { req: enrollReq, res: enrollRes, next: enrollNext } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString() }
    });
    await courseController.enrollInCourse(enrollReq, enrollRes, enrollNext);
    assert.equal(enrollRes.statusCode, 201);
    assert.equal(enrollRes.data.success, true);
    assert.equal(enrollRes.data.enrollment.status, 'enrolled');

    // Step 3: Duplicate enrollment must be rejected
    const { req: dupReq, res: dupRes, next: dupNext } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString() }
    });
    await courseController.enrollInCourse(dupReq, dupRes, dupNext);
    assert.equal(dupRes.statusCode, 400);
    assert.equal(dupRes.data.success, false);

    // Step 4: Attempt to complete non-existent / arbitrary module ID -> HTTP 400
    const fakeModuleId = new mongoose.Types.ObjectId();
    const { req: fakeModReq, res: fakeModRes, next: fakeModNext } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString(), moduleId: fakeModuleId.toString() }
    });
    await courseController.completeCourseModule(fakeModReq, fakeModRes, fakeModNext);
    assert.equal(fakeModRes.statusCode, 400);
    assert.match(fakeModRes.data.message, /Invalid module reference/i);

    // Step 5: Premature certificate claim -> HTTP 400
    const { req: earlyCertReq, res: earlyCertRes, next: earlyCertNext } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString() }
    });
    await courseController.claimCourseCertificate(earlyCertReq, earlyCertRes, earlyCertNext);
    assert.equal(earlyCertRes.statusCode, 400);
    assert.match(earlyCertRes.data.message, /requirements not satisfied/i);

    // Step 6: Complete Module 1
    const mod1Id = stagingCourse.modules[0]._id;
    const { req: m1Req, res: m1Res, next: m1Next } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString(), moduleId: mod1Id.toString() }
    });
    await courseController.completeCourseModule(m1Req, m1Res, m1Next);
    assert.equal(m1Res.statusCode, 200);
    assert.equal(m1Res.data.enrollment.progressPercent, 50);
    assert.equal(m1Res.data.enrollment.status, 'in-progress');

    // Step 7: Complete Module 2 (100% completion)
    const mod2Id = stagingCourse.modules[1]._id;
    const { req: m2Req, res: m2Res, next: m2Next } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString(), moduleId: mod2Id.toString() }
    });
    await courseController.completeCourseModule(m2Req, m2Res, m2Next);
    assert.equal(m2Res.statusCode, 200);
    assert.equal(m2Res.data.enrollment.progressPercent, 100);
    assert.equal(m2Res.data.enrollment.status, 'completed');

    // Step 8: Claim certificate -> HTTP 201
    const { req: claimReq, res: claimRes, next: claimNext } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString() }
    });
    await courseController.claimCourseCertificate(claimReq, claimRes, claimNext);
    assert.equal(claimRes.statusCode, 201);
    assert.equal(claimRes.data.success, true);
    assert.ok(claimRes.data.certificate);
    assert.match(claimRes.data.certificate.certificateId, /^NEST-/);

    const issuedCode = claimRes.data.certificate.certificateId;

    // Step 9: Repeated claim returns existing certificate idempotently -> HTTP 200
    const { req: repClaimReq, res: repClaimRes, next: repClaimNext } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: stagingCourse._id.toString() }
    });
    await courseController.claimCourseCertificate(repClaimReq, repClaimRes, repClaimNext);
    assert.equal(repClaimRes.statusCode, 200);
    assert.equal(repClaimRes.data.certificate.certificateId, issuedCode);
    assert.match(repClaimRes.data.message, /already claimed/i);

    // Step 10: Verify Certificate Publicly
    const { req: verReq, res: verRes, next: verNext } = createMockReqRes({
      params: { id: issuedCode }
    });
    await platformController.verifyCertificate(verReq, verRes, verNext);
    assert.equal(verRes.statusCode, 200);
    assert.equal(verRes.data.success, true);
    assert.equal(verRes.data.certificate.certificateId, issuedCode);
  });

  await t.test('5. StudyPod authorization: Non-member rejected with HTTP 403', async () => {
    const pod = await StudyPod.create({
      title: 'Staging Pod',
      track: 'Engineering',
      creator: mentorUser._id,
      members: [{ user: mentorUser._id, role: 'leader' }],
      messages: []
    });

    const { req, res, next } = createMockReqRes({
      user: { id: studentUser._id.toString(), role: 'student' },
      params: { id: pod._id.toString() },
      body: { text: 'Unauthorized message attempt' }
    });

    await platformController.postPodMessage(req, res, next);
    assert.equal(res.statusCode, 403);
    assert.match(res.data.message, /You must be a member/i);

    await StudyPod.findByIdAndDelete(pod._id);
  });

  await t.test('6. Mentorship Room authorization: Unauthorized user rejected with HTTP 403', async () => {
    const session = await Session.create({
      student: studentUser._id,
      mentor: mentorUser._id,
      date: new Date(),
      time: '14:00',
      status: 'approved',
      topic: 'Staging System Design'
    });

    const unauthorizedUserId = new mongoose.Types.ObjectId();
    const { req, res, next } = createMockReqRes({
      user: { id: unauthorizedUserId.toString(), role: 'student' },
      params: { id: session._id.toString() }
    });

    await mentorController.getSessionById(req, res, next);
    assert.equal(res.statusCode, 403);
    assert.match(res.data.message, /not authorized/i);

    await Session.findByIdAndDelete(session._id);
  });

  await t.test('7. Seed script safety: Refuses execution when ALLOW_SEED is not explicitly true', () => {
    const { validateSeedEnvironment } = require('../scripts/seed');
    assert.throws(
      () => validateSeedEnvironment({ NODE_ENV: 'staging', ALLOW_SEED: 'false' }),
      /ALLOW_SEED/i
    );
  });

  await mongoose.disconnect();
});
