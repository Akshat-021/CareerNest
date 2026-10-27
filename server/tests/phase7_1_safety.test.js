const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Models & Controllers
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const courseController = require('../controllers/courseController');
const platformController = require('../controllers/platformController');
const authController = require('../controllers/authController');

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

test('CAREERNEST: PHASE 7.1 RELEASE-SAFETY AUDIT TESTS', async (t) => {
  const studentId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();

  await t.test('1. Zero-module course: completeCourseModule rejects course with 0 modules with HTTP 400', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;

    const zeroModuleCourse = {
      _id: courseId,
      title: 'Empty Course',
      modules: [],
      projects: []
    };

    Course.findById = async () => zeroModuleCourse;
    CourseEnrollment.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      completedModules: []
    });

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString(), moduleId: new mongoose.Types.ObjectId().toString() }
    });

    await courseController.completeCourseModule(req, res, next);
    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /curriculum is empty/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  });

  await t.test('2. Zero-module course: claimCourseCertificate rejects course with 0 modules with HTTP 400', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;

    const zeroModuleCourse = {
      _id: courseId,
      title: 'Empty Course',
      modules: [],
      projects: []
    };

    Course.findById = async () => zeroModuleCourse;
    CourseEnrollment.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      status: 'completed',
      completedModules: []
    });

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.claimCourseCertificate(req, res, next);
    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /curriculum is empty/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  });

  await t.test('3. Privacy Protection: verifyCertificate populates only name and profileImage, hiding email and studentProfile', async () => {
    const origCertFindOne = Certificate.findOne;
    const mockCertId = 'NEST-ABC123-2026';

    const mockCert = {
      certificateId: mockCertId,
      verificationCode: mockCertId,
      courseTitle: 'Full-Stack Engineering',
      grade: 'A+',
      issuedDate: new Date(),
      student: {
        _id: studentId,
        name: 'Private Student',
        profileImage: 'https://avatar.url/student.jpg'
      }
    };

    let populatedFields = '';
    Certificate.findOne = () => ({
      populate: (field, select) => {
        populatedFields = select;
        return Promise.resolve(mockCert);
      }
    });

    const { req, res, next } = createMockReqRes({
      params: { id: mockCertId }
    });

    await platformController.verifyCertificate(req, res, next);
    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.certificate.student.name, 'Private Student');
    // Ensure select string does NOT contain email or studentProfile
    assert.ok(!populatedFields.includes('email'), 'Must not populate student email');
    assert.ok(!populatedFields.includes('studentProfile'), 'Must not populate student profile details');

    Certificate.findOne = origCertFindOne;
  });

  await t.test('4. Production OTP Safety: devOtp is never included in HTTP responses when NODE_ENV=production', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const origUserFindOne = User.findOne;
    User.findOne = async () => ({
      _id: studentId,
      email: 'student@example.com',
      save: async () => {}
    });

    // Test forgotPassword in production
    const { req: fpReq, res: fpRes, next: fpNext } = createMockReqRes({
      body: { email: 'student@example.com' }
    });

    await authController.forgotPassword(fpReq, fpRes, fpNext);
    assert.equal(fpRes.statusCode, 200);
    assert.equal(fpRes.data.success, true);
    assert.equal(fpRes.data.devOtp, undefined, 'devOtp must NEVER be included in production responses');

    // Test resendOtp in production
    const { req: roReq, res: roRes, next: roNext } = createMockReqRes({
      body: { email: 'student@example.com' }
    });

    await authController.resendOtp(roReq, roRes, roNext);
    assert.equal(roRes.statusCode, 200);
    assert.equal(roRes.data.success, true);
    assert.equal(roRes.data.devOtp, undefined, 'devOtp must NEVER be included in production responses');

    User.findOne = origUserFindOne;
    process.env.NODE_ENV = origNodeEnv;
  });

  await t.test('5. Certificate Concurrency Handling: E11000 duplicate key race condition returns existing certificate idempotently', async () => {
    const origCourseFindById = Course.findById;
    const origEnrollmentFindOne = CourseEnrollment.findOne;
    const origCertFindOne = Certificate.findOne;
    const origCertCreate = Certificate.create;

    const mockCourse = {
      _id: courseId,
      title: 'Distributed Systems',
      modules: [{ _id: new mongoose.Types.ObjectId() }]
    };

    const mockEnrollment = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      status: 'completed',
      completedModules: [{ module: mockCourse.modules[0]._id }],
      certificate: null,
      save: async () => {}
    };

    const existingCert = {
      _id: new mongoose.Types.ObjectId(),
      student: studentId,
      course: courseId,
      certificateId: 'NEST-CONCUR-2026'
    };

    Course.findById = async () => mockCourse;
    CourseEnrollment.findOne = async () => mockEnrollment;
    
    // Simulate first find returns null, but create throws E11000 duplicate key error
    let findCount = 0;
    Certificate.findOne = async () => {
      findCount++;
      return findCount === 1 ? null : existingCert;
    };
    Certificate.create = async () => {
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;
      throw err;
    };

    const { req, res, next } = createMockReqRes({
      user: { id: studentId.toString(), role: 'student' },
      params: { id: courseId.toString() }
    });

    await courseController.claimCourseCertificate(req, res, next);
    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.certificate.certificateId, 'NEST-CONCUR-2026');
    assert.match(res.data.message, /already claimed/i);

    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
    Certificate.findOne = origCertFindOne;
    Certificate.create = origCertCreate;
  });

  await t.test('6. Gmail SMTP Configuration: createTransporter automatically sets service to gmail and strips spaces', async () => {
    const { createTransporter } = require('../config/mailer');
    const origUser = process.env.EMAIL_USER;
    const origPass = process.env.EMAIL_PASS;

    try {
      process.env.EMAIL_USER = '  careernest.portal@gmail.com ';
      process.env.EMAIL_PASS = 'abcd efgh ijkl mnop';
      const transporter = createTransporter();
      assert.equal(transporter.options.service, 'gmail');
      assert.equal(transporter.options.auth.user, 'careernest.portal@gmail.com');
      assert.equal(transporter.options.auth.pass, 'abcdefghijklmnop');
    } finally {
      process.env.EMAIL_USER = origUser;
      process.env.EMAIL_PASS = origPass;
    }
  });
});

