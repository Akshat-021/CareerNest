const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Models & Controllers
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const Certificate = require('../models/Certificate');
const CareerProfile = require('../models/CareerProfile');
const User = require('../models/User');
const courseController = require('../controllers/courseController');
const platformController = require('../controllers/platformController');

// Helper to create mock Express request & response
function createMockReqRes({ user, params = {}, body = {}, query = {} } = {}) {
  const req = {
    user: user || { id: new mongoose.Types.ObjectId().toString(), role: 'student' },
    params,
    body,
    query
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };

  const next = (err) => {
    if (err) res.error = err;
  };

  return { req, res, next };
}

test('CAREERNEST: PHASE 7 GATE 2 - COURSE ENROLLMENT & CERTIFICATE ISSUANCE', async (t) => {
  const studentId = new mongoose.Types.ObjectId();
  const mentorId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const mod1Id = new mongoose.Types.ObjectId();
  const mod2Id = new mongoose.Types.ObjectId();
  const fakeModId = new mongoose.Types.ObjectId();

  const mockCourse = {
    _id: courseId,
    title: 'Advanced Full-Stack Engineering',
    instructor: mentorId,
    modules: [
      { _id: mod1Id, title: 'Module 1: Architecture', duration: '2 hours' },
      { _id: mod2Id, title: 'Module 2: Cloud Deployment', duration: '3 hours' }
    ],
    projects: []
  };

  await t.test('1. enrollInCourse: successfully enrolls student and rejects duplicates', async () => {
    // Mock Course.findById
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;
    const origEnrollmentCreate = CourseEnrollment.create;

    Course.findById = async (id) => (id.toString() === courseId.toString() ? mockCourse : null);
    
    // First enrollment attempt: no existing enrollment
    let existing = null;
    CourseEnrollment.findOne = async () => existing;
    CourseEnrollment.create = async (doc) => ({
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      save: async () => {}
    });

    const { req: req1, res: res1, next: next1 } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.enrollInCourse(req1, res1, next1);
    assert.equal(res1.statusCode, 201);
    assert.equal(res1.data.success, true);
    assert.equal(res1.data.enrollment.status, 'enrolled');
    assert.equal(res1.data.enrollment.progressPercent, 0);

    // Second enrollment attempt: duplicate enrollment detected
    existing = { _id: res1.data.enrollment._id, student: studentId, course: courseId, status: 'enrolled' };
    const { req: req2, res: res2, next: next2 } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.enrollInCourse(req2, res2, next2);
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.data.success, false);
    assert.match(res2.data.message, /already enrolled/i);

    // Restore
    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
    CourseEnrollment.create = origEnrollmentCreate;
  });

  await t.test('2. completeCourseModule: rejects unenrolled student with 403', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;

    Course.findById = async () => mockCourse;
    CourseEnrollment.findOne = async () => null; // Not enrolled

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString(), moduleId: mod1Id.toString() }
    });

    await courseController.completeCourseModule(req, res, next);
    assert.equal(res.statusCode, 403);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /must be enrolled/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  });

  await t.test('3. completeCourseModule: rejects invalid/spoofed moduleId with 400', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;

    const mockEnrollment = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      completedModules: [],
      progressPercent: 0,
      status: 'enrolled',
      save: async () => {}
    };

    Course.findById = async () => mockCourse;
    CourseEnrollment.findOne = async () => mockEnrollment;

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString(), moduleId: fakeModId.toString() }
    });

    await courseController.completeCourseModule(req, res, next);
    assert.equal(res.statusCode, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /invalid module reference/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  });

  await t.test('4. completeCourseModule: records valid module completion and updates progress', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;

    const mockEnrollment = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      completedModules: [],
      progressPercent: 0,
      status: 'enrolled',
      save: async () => {}
    };

    Course.findById = async () => mockCourse;
    CourseEnrollment.findOne = async () => mockEnrollment;

    // Complete module 1
    const { req: req1, res: res1, next: next1 } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString(), moduleId: mod1Id.toString() }
    });

    await courseController.completeCourseModule(req1, res1, next1);
    assert.equal(res1.statusCode, 200);
    assert.equal(res1.data.success, true);
    assert.equal(mockEnrollment.completedModules.length, 1);
    assert.equal(mockEnrollment.progressPercent, 50); // 1 out of 2 modules = 50%
    assert.equal(mockEnrollment.status, 'in-progress');

    // Complete module 2
    const { req: req2, res: res2, next: next2 } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString(), moduleId: mod2Id.toString() }
    });

    await courseController.completeCourseModule(req2, res2, next2);
    assert.equal(res2.statusCode, 200);
    assert.equal(mockEnrollment.completedModules.length, 2);
    assert.equal(mockEnrollment.progressPercent, 100);
    assert.equal(mockEnrollment.status, 'completed');

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  });

  await t.test('5. claimCourseCertificate: rejects incomplete course completion with 400', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;

    const incompleteEnrollment = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      completedModules: [{ module: mod1Id }],
      progressPercent: 50,
      status: 'in-progress',
      save: async () => {}
    };

    Course.findById = async () => mockCourse;
    CourseEnrollment.findOne = async () => incompleteEnrollment;

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.claimCourseCertificate(req, res, next);
    assert.equal(res.statusCode, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /requirements not satisfied/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  });

  await t.test('6. claimCourseCertificate: issues certificate upon 100% completion & provides idempotent returns', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;
    const origCertFindOne = Certificate.findOne;
    const origCertCreate = Certificate.create;
    const origProfileFindOne = CareerProfile.findOne;

    CareerProfile.findOne = async () => null;

    const completedEnrollment = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      completedModules: [{ module: mod1Id }, { module: mod2Id }],
      progressPercent: 100,
      status: 'completed',
      certificate: null,
      save: async () => {}
    };

    Course.findById = async () => mockCourse;
    CourseEnrollment.findOne = async () => completedEnrollment;

    let certDb = null;
    Certificate.findOne = async () => certDb;
    Certificate.create = async (doc) => {
      certDb = {
        _id: new mongoose.Types.ObjectId(),
        ...doc
      };
      return certDb;
    };

    // First claim: issues new certificate (201)
    const { req: req1, res: res1, next: next1 } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.claimCourseCertificate(req1, res1, next1);
    assert.equal(res1.statusCode, 201);
    assert.equal(res1.data.success, true);
    assert.ok(res1.data.certificate);
    assert.match(res1.data.certificate.certificateId, /^NEST-/);
    assert.equal(completedEnrollment.certificate, certDb._id);

    // Second claim: returns existing certificate idempotently (200) without creating duplicates
    const { req: req2, res: res2, next: next2 } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.claimCourseCertificate(req2, res2, next2);
    assert.equal(res2.statusCode, 200);
    assert.equal(res2.data.success, true);
    assert.equal(res2.data.certificate._id, certDb._id);
    assert.match(res2.data.message, /already claimed/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
    Certificate.findOne = origCertFindOne;
    Certificate.create = origCertCreate;
    CareerProfile.findOne = origProfileFindOne;
  });

  await t.test('7. platformController.issueCertificate: rejects unauthorized student self-issuance with 403', async () => {
    const origCourseFindById = Course.findById;
    const origCourseFindOne = Course.findOne;

    Course.findById = async () => mockCourse;
    Course.findOne = async () => mockCourse;

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      body: { courseTitle: mockCourse.title }
    });

    await platformController.issueCertificate(req, res, next);
    assert.equal(res.statusCode, 403);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /completion cannot be verified/i);

    Course.findById = origCourseFindById;
    Course.findOne = origCourseFindOne;
  });

  await t.test('8. platformController.issueCertificate: allows course instructor to issue certificate for student', async () => {
    const origCourseFindById = Course.findById;
    const origCourseFindOne = Course.findOne;
    const origCertCreate = Certificate.create;
    const origCertFindOne = Certificate.findOne;
    const origUserFindById = User.findById;
    const origProfileFindOne = CareerProfile.findOne;

    CareerProfile.findOne = async () => null;
    Course.findById = async () => mockCourse;
    Course.findOne = async () => mockCourse;
    Certificate.findOne = async () => null;
    Certificate.create = async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc });
    User.findById = async () => ({ _id: studentId, name: 'Student Test' });

    const { req, res, next } = createMockReqRes({
      user: { id: mentorId.toString(), role: 'mentor' }, // mentor is the instructor of mockCourse
      body: { courseTitle: mockCourse.title, studentId: studentId.toString() }
    });

    await platformController.issueCertificate(req, res, next);
    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.certificate);

    Course.findById = origCourseFindById;
    Course.findOne = origCourseFindOne;
    Certificate.create = origCertCreate;
    Certificate.findOne = origCertFindOne;
    User.findById = origUserFindById;
    CareerProfile.findOne = origProfileFindOne;
  });
});
