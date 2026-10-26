/**
 * Regression Tests: Phase 5 Platform Hardening, Concurrency & Security Remediation
 * Covers:
 * Task 1 - Seed script environment and database target protection
 * Task 2 - CareerProfile concurrency and VersionError prevention
 * Task 3 - StudyPod messaging authorization and IDOR/cross-pod protection
 * Task 4 - Course creation restriction to approved mentors & admins
 * Task 5 - Certificate issuance security & authorized issuer enforcement
 * Task 6 - Forum likes ObjectId toggle and duplicate prevention
 * Task 7 - Admin analytics resilience against incomplete CareerProfiles
 */

const assert = require('assert');
const mongoose = require('mongoose');

console.log('\n=========================================');
console.log('CAREERNEST: PHASE 5 HARDENING & SECURITY TESTS');
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

async function runPhase5Tests() {
  // ------------------------------------------------------------------------
  // TASK 1: Protect Seed Script
  // ------------------------------------------------------------------------
  const { validateSeedEnvironment, sanitizeMongoUri } = require('../scripts/seed');

  await test('Task 1 - seed: Refuses execution when NODE_ENV is production', () => {
    assert.throws(
      () => validateSeedEnvironment({ NODE_ENV: 'production', ALLOW_SEED: 'true' }, 'mongodb://127.0.0.1:27017/test'),
      /NODE_ENV=production/
    );
  });

  await test('Task 1 - seed: Refuses execution when ALLOW_SEED is not explicitly true', () => {
    assert.throws(
      () => validateSeedEnvironment({ NODE_ENV: 'development', ALLOW_SEED: 'false' }, 'mongodb://127.0.0.1:27017/test'),
      /ALLOW_SEED must be 'true'/
    );
    assert.throws(
      () => validateSeedEnvironment({ NODE_ENV: 'development' }, 'mongodb://127.0.0.1:27017/test'),
      /ALLOW_SEED must be 'true'/
    );
  });

  await test('Task 1 - seed: Refuses remote Atlas or non-local database targets', () => {
    assert.throws(
      () => validateSeedEnvironment({ NODE_ENV: 'development', ALLOW_SEED: 'true' }, 'mongodb+srv://cluster.mongodb.net/prod'),
      /Non-local or remote database target detected/
    );
    assert.throws(
      () => validateSeedEnvironment({ NODE_ENV: 'development', ALLOW_SEED: 'true' }, 'mongodb://192.168.1.100:27017/prod'),
      /Non-local or remote database target detected/
    );
  });

  await test('Task 1 - seed: Allows safe local development database target', () => {
    const ok1 = validateSeedEnvironment({ NODE_ENV: 'development', ALLOW_SEED: 'true' }, 'mongodb://127.0.0.1:27017/ai-mentor-test');
    assert.strictEqual(ok1, true);

    const ok2 = validateSeedEnvironment({ NODE_ENV: 'test', ALLOW_SEED: 'true' }, 'mongodb://localhost:27017/ai-mentor-test');
    assert.strictEqual(ok2, true);
  });

  await test('Task 1 - seed: Sanitizes and masks database credentials in logged URI', () => {
    const masked = sanitizeMongoUri('mongodb://adminUser:superSecretPass123@127.0.0.1:27017/ai-mentor-portal');
    assert.strictEqual(masked, 'mongodb://***:***@127.0.0.1:27017/ai-mentor-portal');
    assert.strictEqual(masked.includes('superSecretPass123'), false);
  });

  // ------------------------------------------------------------------------
  // TASK 2: CareerProfile Concurrency & VersionError Prevention
  // ------------------------------------------------------------------------
  const careerProfileService = require('../services/careerProfileService');
  const CareerProfile = require('../models/CareerProfile');
  const User = require('../models/User');
  const Quiz = require('../models/Quiz');
  const Roadmap = require('../models/Roadmap');
  const Certificate = require('../models/Certificate');

  await test('Task 2 - careerProfile: recalculateReadiness updates atomically via findByIdAndUpdate', async () => {
    const mockProfileId = new mongoose.Types.ObjectId();
    const mockStudentId = new mongoose.Types.ObjectId();

    const originalFindById = CareerProfile.findById;
    const originalFindByIdAndUpdate = CareerProfile.findByIdAndUpdate;
    const originalUserFindById = User.findById;
    const originalQuizFind = Quiz.find;
    const originalRoadmapFind = Roadmap.find;
    const originalCertFind = Certificate.find;

    let updatedWith = null;

    Quiz.find = async () => [];
    Roadmap.find = async () => [];
    Certificate.find = async () => [];

    CareerProfile.findById = async (id) => ({
      _id: mockProfileId,
      student: mockStudentId,
      targetRole: 'Full Stack Engineer',
      skills: [{ name: 'React', proficiency: 80, verifiedBy: ['self', 'quiz'] }],
      interviewEvaluations: []
    });

    User.findById = async () => ({
      _id: mockStudentId,
      studentProfile: { leaderboardPoints: 50 }
    });

    CareerProfile.findByIdAndUpdate = async (id, update, options) => {
      updatedWith = update;
      return { _id: id, ...update.$set };
    };

    const result = await careerProfileService.recalculateReadiness(mockProfileId);
    assert.ok(result, 'Result should be returned');
    assert.ok(updatedWith?.$set?.readinessScore, 'Must use atomic $set for readinessScore');
    assert.ok(updatedWith?.$set?.nextActions, 'Must use atomic $set for nextActions');
    assert.ok(result.readinessScore.overallReadiness > 0, 'Overall readiness should be calculated');

    CareerProfile.findById = originalFindById;
    CareerProfile.findByIdAndUpdate = originalFindByIdAndUpdate;
    User.findById = originalUserFindById;
    Quiz.find = originalQuizFind;
    Roadmap.find = originalRoadmapFind;
    Certificate.find = originalCertFind;
  });

  await test('Task 2 - careerProfile: getOrCreateProfile handles duplicate key race condition safely', async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const originalFindOne = CareerProfile.findOne;
    const originalFindOneAndUpdate = CareerProfile.findOneAndUpdate;
    const originalUserFindById = User.findById;
    const originalRecalc = careerProfileService.recalculateReadiness;

    let findOneCallCount = 0;
    CareerProfile.findOne = async () => {
      findOneCallCount++;
      if (findOneCallCount === 1) return null; // First find: doesn't exist
      return {
        _id: new mongoose.Types.ObjectId(),
        student: mockUserId,
        targetRole: 'Full Stack Software Engineer',
        populate: async () => ({ student: mockUserId })
      };
    };

    CareerProfile.findOneAndUpdate = async () => {
      // Simulate another concurrent worker creating the profile right before us
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;
      throw err;
    };

    User.findById = async () => ({
      _id: mockUserId,
      email: 'alex@student.com',
      studentProfile: { skills: ['React'] }
    });

    careerProfileService.recalculateReadiness = async () => ({});

    const originalFindById = CareerProfile.findById;
    CareerProfile.findById = () => ({
      populate: async () => ({ student: mockUserId })
    });

    const profile = await careerProfileService.getOrCreateProfile(mockUserId);
    assert.ok(profile, 'Profile should be successfully resolved on duplicate key race condition');

    CareerProfile.findOne = originalFindOne;
    CareerProfile.findOneAndUpdate = originalFindOneAndUpdate;
    User.findById = originalUserFindById;
    CareerProfile.findById = originalFindById;
    careerProfileService.recalculateReadiness = originalRecalc;
  });

  // ------------------------------------------------------------------------
  // TASK 3: Secure StudyPod Messaging
  // ------------------------------------------------------------------------
  const platformController = require('../controllers/platformController');
  const StudyPod = require('../models/StudyPod');

  await test('Task 3 - studyPod: postPodMessage rejects empty text with 400', async () => {
    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId() },
      body: { text: '   ' },
      user: { id: new mongoose.Types.ObjectId().toString() }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.postPodMessage(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResp.success, false);
  });

  await test('Task 3 - studyPod: postPodMessage rejects non-member with 403', async () => {
    const memberId = new mongoose.Types.ObjectId();
    const outsiderId = new mongoose.Types.ObjectId();
    const originalFindById = StudyPod.findById;

    StudyPod.findById = async () => ({
      _id: new mongoose.Types.ObjectId(),
      creator: memberId,
      members: [{ user: memberId, role: 'leader' }],
      messages: []
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { text: 'Hello outside world' },
      user: { id: outsiderId.toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.postPodMessage(req, res, () => {});
    assert.strictEqual(statusCode, 403, 'Must reject non-member with HTTP 403');
    assert.strictEqual(jsonResp.success, false);
    assert.match(jsonResp.message, /member of this study pod/i);

    StudyPod.findById = originalFindById;
  });

  await test('Task 3 - studyPod: postPodMessage allows member to post message', async () => {
    const memberId = new mongoose.Types.ObjectId();
    const originalFindById = StudyPod.findById;

    const mockPod = {
      _id: new mongoose.Types.ObjectId(),
      creator: new mongoose.Types.ObjectId(),
      members: [{ user: memberId, role: 'member' }],
      messages: [],
      save: async function() {
        return this;
      }
    };

    let findByIdCalls = 0;
    StudyPod.findById = function() {
      findByIdCalls++;
      if (findByIdCalls === 1) return Promise.resolve(mockPod);
      return {
        populate: async () => ({
          messages: [{ sender: memberId, text: 'Valid message' }]
        })
      };
    };

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: mockPod._id.toString() },
      body: { text: 'Valid message' },
      user: { id: memberId.toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.postPodMessage(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);
    assert.strictEqual(jsonResp.messages.length, 1);

    StudyPod.findById = originalFindById;
  });

  // ------------------------------------------------------------------------
  // TASK 4: Restrict Course Creation
  // ------------------------------------------------------------------------
  const courseController = require('../controllers/courseController');
  const Course = require('../models/Course');

  await test('Task 4 - course: createCourse rejects student with 403', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const originalUserFindById = User.findById;

    User.findById = async () => ({
      _id: studentId,
      role: 'student'
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: studentId.toString(), role: 'student' },
      body: { title: 'Unauthorized Course' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await courseController.createCourse(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResp.success, false);

    User.findById = originalUserFindById;
  });

  await test('Task 4 - course: createCourse rejects unapproved mentor with 403', async () => {
    const unapprovedMentorId = new mongoose.Types.ObjectId();
    const originalUserFindById = User.findById;

    User.findById = async () => ({
      _id: unapprovedMentorId,
      role: 'mentor',
      mentorProfile: { isApproved: false }
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: unapprovedMentorId.toString(), role: 'mentor' },
      body: {
        title: 'Python for Beginners',
        description: 'Test description',
        category: 'AI/ML'
      }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await courseController.createCourse(req, res, () => {});
    assert.strictEqual(statusCode, 403, 'Must reject unapproved mentor with HTTP 403');
    assert.match(jsonResp.message, /approval/i);

    User.findById = originalUserFindById;
  });

  await test('Task 4 - course: createCourse ignores spoofed client body role/approval and rejects unapproved mentor', async () => {
    const unapprovedMentorId = new mongoose.Types.ObjectId();
    const originalUserFindById = User.findById;

    User.findById = async () => ({
      _id: unapprovedMentorId,
      role: 'mentor',
      mentorProfile: { isApproved: false }
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: unapprovedMentorId.toString(), role: 'mentor' },
      body: {
        title: 'Spoofed Course',
        role: 'admin', // Attacker attempts to spoof admin role in request body
        mentorProfile: { isApproved: true } // Attacker attempts to spoof isApproved in body
      }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await courseController.createCourse(req, res, () => {});
    assert.strictEqual(statusCode, 403, 'Must strictly rely on server-side user data, ignoring body spoofing');

    User.findById = originalUserFindById;
  });

  await test('Task 4 - course: createCourse allows approved mentor to create course', async () => {
    const approvedMentorId = new mongoose.Types.ObjectId();
    const originalUserFindById = User.findById;
    const originalCourseCreate = Course.create;

    User.findById = async () => ({
      _id: approvedMentorId,
      role: 'mentor',
      mentorProfile: { isApproved: true }
    });

    Course.create = async (data) => ({
      _id: new mongoose.Types.ObjectId(),
      ...data
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: approvedMentorId.toString(), role: 'mentor' },
      body: {
        title: 'Advanced System Design',
        description: 'Scalable architectures',
        category: 'Backend',
        difficulty: 'Hard',
        duration: '6 weeks',
        prerequisites: ['NodeJS'],
        modules: [{ title: 'Module 1' }],
        projects: []
      }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await courseController.createCourse(req, res, () => {});
    assert.strictEqual(statusCode, 201);
    assert.strictEqual(jsonResp.success, true);
    assert.strictEqual(jsonResp.course.title, 'Advanced System Design');

    User.findById = originalUserFindById;
    Course.create = originalCourseCreate;
  });

  // ------------------------------------------------------------------------
  // TASK 5: Secure Certificate Issuance
  // ------------------------------------------------------------------------
  await test('Task 5 - certificate: issueCertificate rejects arbitrary course title not in database', async () => {
    const originalCourseFind = Course.findOne;
    Course.findOne = async () => null;

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'student' },
      body: { courseTitle: 'Arbitrary Non-Existent Course' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.issueCertificate(req, res, () => {});
    assert.strictEqual(statusCode, 404);
    assert.strictEqual(jsonResp.success, false);
    assert.match(jsonResp.message, /existing platform course/i);

    Course.findOne = originalCourseFind;
  });

  await test('Task 5 - certificate: issueCertificate rejects student self-issuance without authorized issuer', async () => {
    const studentId = new mongoose.Types.ObjectId();
    const instructorId = new mongoose.Types.ObjectId();
    const originalCourseFind = Course.findOne;

    Course.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      title: 'Full Stack Web Development',
      instructor: instructorId
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: studentId.toString(), role: 'student' },
      body: { courseTitle: 'Full Stack Web Development' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.issueCertificate(req, res, () => {});
    assert.strictEqual(statusCode, 403, 'Student self-issuance must be rejected with 403');
    assert.match(jsonResp.message, /Course completion cannot be verified/i);

    Course.findOne = originalCourseFind;
  });

  await test('Task 5 - certificate: issueCertificate allows course instructor to issue certificate for student', async () => {
    const instructorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const originalCourseFind = Course.findOne;
    const originalUserFindById = User.findById;
    const originalCertCreate = Certificate.create;
    const originalCertFindOne = Certificate.findOne;
    const originalCPFindOne = CareerProfile.findOne;

    Course.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      title: 'Full Stack Web Development',
      instructor: instructorId
    });

    User.findById = async () => ({
      _id: studentId,
      name: 'Alex Rivera'
    });

    Certificate.findOne = async () => null;

    Certificate.create = async (data) => ({
      _id: new mongoose.Types.ObjectId(),
      ...data
    });

    CareerProfile.findOne = async () => null;

    let statusCode = null;
    let jsonResp = null;
    const req = {
      user: { id: instructorId.toString(), role: 'mentor' },
      body: {
        courseTitle: 'Full Stack Web Development',
        studentId: studentId.toString(),
        grade: 'A+'
      }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.issueCertificate(req, res, (err) => {
      if (err) console.error('issueCertificate error:', err);
    });
    assert.strictEqual(statusCode, 201);
    assert.strictEqual(jsonResp.success, true);
    assert.strictEqual(jsonResp.certificate.courseTitle, 'Full Stack Web Development');
    assert.strictEqual(jsonResp.certificate.student.toString(), studentId.toString());

    Course.findOne = originalCourseFind;
    User.findById = originalUserFindById;
    Certificate.create = originalCertCreate;
    Certificate.findOne = originalCertFindOne;
    CareerProfile.findOne = originalCPFindOne;
  });

  // ------------------------------------------------------------------------
  // TASK 6: Fix Forum Likes
  // ------------------------------------------------------------------------
  const ForumPost = require('../models/Forum');

  await test('Task 6 - forum: likeForumPost accurately handles ObjectId/string comparison and toggles like', async () => {
    const userId = new mongoose.Types.ObjectId();
    const postId = new mongoose.Types.ObjectId();

    const originalFindById = ForumPost.findById;
    const originalFindByIdAndUpdate = ForumPost.findByIdAndUpdate;

    // Simulate post currently has NO likes
    ForumPost.findById = async () => ({
      _id: postId,
      likes: []
    });

    // Atomic $addToSet adds userId
    ForumPost.findByIdAndUpdate = async (id, update) => {
      assert.ok(update.$addToSet?.likes, 'Must use $addToSet when user has not liked');
      return {
        _id: postId,
        likes: [userId]
      };
    };

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: postId.toString() },
      user: { id: userId.toString() }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    // 1. First click: Like
    await platformController.likeForumPost(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.hasLiked, true);
    assert.strictEqual(jsonResp.likesCount, 1);

    // 2. Second click: Unlike
    // Simulate post now has user's ObjectId
    ForumPost.findById = async () => ({
      _id: postId,
      likes: [userId] // Mongoose ObjectId array
    });

    ForumPost.findByIdAndUpdate = async (id, update) => {
      assert.ok(update.$pull?.likes, 'Must use $pull when user has already liked');
      return {
        _id: postId,
        likes: []
      };
    };

    await platformController.likeForumPost(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.hasLiked, false);
    assert.strictEqual(jsonResp.likesCount, 0);

    ForumPost.findById = originalFindById;
    ForumPost.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  // ------------------------------------------------------------------------
  // TASK 7: Stabilize Admin Analytics
  // ------------------------------------------------------------------------
  await test('Task 7 - analytics: getAdminAnalytics handles documents with missing/null readinessScore without crashing', async () => {
    const originalCPFind = CareerProfile.find;
    const originalUserCount = User.countDocuments;
    const originalUserFind = User.find;
    const originalCourseCount = Course.countDocuments;
    const Session = require('../models/Session');
    const JobApplication = require('../models/JobApplication');
    const originalSessionCount = Session.countDocuments;
    const originalAppCount = JobApplication.countDocuments;
    const originalPodCount = StudyPod.countDocuments;

    User.countDocuments = async () => 10;
    User.find = (query) => {
      const arr = [];
      arr.select = () => Promise.resolve([]);
      return arr;
    };
    Course.countDocuments = async () => 5;
    Session.countDocuments = async () => 2;
    JobApplication.countDocuments = async () => 3;
    StudyPod.countDocuments = async () => 1;

    // Simulate mixture of complete, incomplete, and missing readinessScore documents
    CareerProfile.find = async () => [
      { _id: new mongoose.Types.ObjectId(), readinessScore: { overallReadiness: 45 } }, // foundation
      { _id: new mongoose.Types.ObjectId(), readinessScore: { overallReadiness: 65 } }, // developing
      { _id: new mongoose.Types.ObjectId(), readinessScore: { overallReadiness: 78 } }, // jobReady
      { _id: new mongoose.Types.ObjectId(), readinessScore: { overallReadiness: 92 } }, // highEdge
      { _id: new mongoose.Types.ObjectId(), readinessScore: null }, // Null readinessScore (legacy/incomplete)
      { _id: new mongoose.Types.ObjectId() } // Undefined readinessScore (legacy/incomplete)
    ];

    let statusCode = null;
    let jsonResp = null;
    const req = { user: { role: 'admin' } };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await platformController.getAdminAnalytics(req, res, (err) => {
      if (err) console.error('getAdminAnalytics error:', err);
    });
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);
    assert.ok(jsonResp.analytics.readinessDistribution, 'readinessDistribution must be present');
    // The 2 incomplete profiles safely defaulted to score 0, putting them in foundation (1 + 2 = 3)
    assert.strictEqual(jsonResp.analytics.readinessDistribution.foundation, 3);
    assert.strictEqual(jsonResp.analytics.readinessDistribution.developing, 1);
    assert.strictEqual(jsonResp.analytics.readinessDistribution.jobReady, 1);
    assert.strictEqual(jsonResp.analytics.readinessDistribution.highEdge, 1);

    CareerProfile.find = originalCPFind;
    User.countDocuments = originalUserCount;
    User.find = originalUserFind;
    Course.countDocuments = originalCourseCount;
    Session.countDocuments = originalSessionCount;
    JobApplication.countDocuments = originalAppCount;
    StudyPod.countDocuments = originalPodCount;
  });

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------
  console.log('\n=========================================');
  console.log(`PHASE 5 HARDENING TESTS FINISHED: ${passed} passed, ${failed} failed`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests();
