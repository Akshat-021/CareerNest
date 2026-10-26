const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Connect to isolated staging database for index compatibility verification
const STAGING_URI = process.env.STAGING_MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-staging';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(STAGING_URI);
  }
});

test.after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

test('Gate 1 & 2 Verification — Old Sparse Compound Index fails on multiple legacy certs per student', async (t) => {
  const colName = 'test_disposable_sparse_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  // Build the flawed Phase 7.1 sparse compound index
  await col.createIndex({ student: 1, course: 1 }, { unique: true, sparse: true });

  const studentA = new mongoose.Types.ObjectId();

  // Insert first legacy certificate (no course field)
  await col.insertOne({
    student: studentA,
    courseTitle: 'Legacy Web Development',
    certificateId: 'LEGACY-001'
  });

  // Inserting second legacy certificate for SAME student must fail with E11000
  let caughtError = null;
  try {
    await col.insertOne({
      student: studentA,
      courseTitle: 'Legacy Data Science',
      certificateId: 'LEGACY-002'
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError, 'Expected duplicate key error on second legacy cert for same student');
  assert.equal(caughtError.code, 11000, 'Error code must be 11000');
  assert.match(caughtError.message, /student_1_course_1 dup key: { student: ObjectId\(.*?\), course: null }/);
});

test('Gate 2 — Partial Unique Index Scenarios 1 & 1b: Multiple legacy certs for same student coexist', async (t) => {
  const colName = 'test_disposable_partial_s1_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  // Create partial unique index
  await col.createIndex(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );

  const studentA = new mongoose.Types.ObjectId();

  // Scenario 1: Multiple legacy certificates with NO course field
  const r1 = await col.insertOne({ student: studentA, courseTitle: 'Course 1 (no course field)' });
  const r2 = await col.insertOne({ student: studentA, courseTitle: 'Course 2 (no course field)' });
  assert.ok(r1.acknowledged && r2.acknowledged, 'Both legacy certs without course field must insert successfully');

  // Scenario 1b: Multiple legacy certificates with course: null
  const r3 = await col.insertOne({ student: studentA, course: null, courseTitle: 'Course 3 (course null)' });
  const r4 = await col.insertOne({ student: studentA, course: null, courseTitle: 'Course 4 (course null)' });
  assert.ok(r3.acknowledged && r4.acknowledged, 'Both legacy certs with course: null must insert successfully');

  const count = await col.countDocuments({ student: studentA });
  assert.equal(count, 4, 'Student A must have 4 legacy certificates coexisting without collision');
});

test('Gate 2 — Scenario 2: Legacy certs belonging to different students coexist', async (t) => {
  const colName = 'test_disposable_partial_s2_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  await col.createIndex(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );

  const student1 = new mongoose.Types.ObjectId();
  const student2 = new mongoose.Types.ObjectId();

  await col.insertOne({ student: student1, courseTitle: 'Legacy Course A' });
  await col.insertOne({ student: student2, courseTitle: 'Legacy Course B' });

  const total = await col.countDocuments({});
  assert.equal(total, 2, 'Certificates for different students must coexist cleanly');
});

test('Gate 2 — Scenario 3: New certificates with valid student & course succeed for distinct courses', async (t) => {
  const colName = 'test_disposable_partial_s3_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  await col.createIndex(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );

  const student = new mongoose.Types.ObjectId();
  const courseA = new mongoose.Types.ObjectId();
  const courseB = new mongoose.Types.ObjectId();

  const r1 = await col.insertOne({ student, course: courseA, courseTitle: 'Modern React' });
  const r2 = await col.insertOne({ student, course: courseB, courseTitle: 'Cloud Architecture' });

  assert.ok(r1.acknowledged && r2.acknowledged, 'Same student can earn certificates for distinct courses');
  const count = await col.countDocuments({ student });
  assert.equal(count, 2);
});

test('Gate 2 — Scenario 4: Repeated issuance for same student/course is rejected with E11000', async (t) => {
  const colName = 'test_disposable_partial_s4_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  await col.createIndex(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );

  const student = new mongoose.Types.ObjectId();
  const course = new mongoose.Types.ObjectId();

  await col.insertOne({ student, course, courseTitle: 'DevOps Mastery' });

  let dupError = null;
  try {
    await col.insertOne({ student, course, courseTitle: 'DevOps Mastery Duplicate' });
  } catch (err) {
    dupError = err;
  }

  assert.ok(dupError, 'Duplicate student-course pair must be rejected');
  assert.equal(dupError.code, 11000, 'Duplicate key error code must be 11000');
});

test('Gate 2 — Scenario 5: Concurrent issuance handling (idempotent duplicate catch)', async (t) => {
  const colName = 'test_disposable_partial_s5_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  await col.createIndex(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );

  const student = new mongoose.Types.ObjectId();
  const course = new mongoose.Types.ObjectId();

  // Helper simulating claim endpoint with atomic catch
  async function simulateClaim(certCode) {
    try {
      const doc = await col.insertOne({
        student,
        course,
        courseTitle: 'Concurrent Course',
        certificateId: certCode
      });
      return { status: 201, id: doc.insertedId, code: certCode };
    } catch (err) {
      if (err.code === 11000) {
        const existing = await col.findOne({ student, course });
        return { status: 200, id: existing._id, code: existing.certificateId, idempotent: true };
      }
      throw err;
    }
  }

  // Execute 5 concurrent claims in parallel
  const results = await Promise.all([
    simulateClaim('CERT-PAR-1'),
    simulateClaim('CERT-PAR-2'),
    simulateClaim('CERT-PAR-3'),
    simulateClaim('CERT-PAR-4'),
    simulateClaim('CERT-PAR-5')
  ]);

  const created = results.filter(r => r.status === 201);
  const idempotent = results.filter(r => r.status === 200);

  assert.equal(created.length, 1, 'Exactly one concurrent request must create the certificate');
  assert.equal(idempotent.length, 4, 'Remaining 4 concurrent requests must return existing certificate');
  
  // Verify database only has 1 record
  const count = await col.countDocuments({ student, course });
  assert.equal(count, 1, 'Database must contain exactly 1 certificate document');
});

test('Gate 2 — Scenario 6: Certificates with absent, null, or invalid course reference bypass partial index', async (t) => {
  const colName = 'test_disposable_partial_s6_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  await col.createIndex(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );

  const student = new mongoose.Types.ObjectId();

  // Absent course
  await col.insertOne({ student, courseTitle: 'Absent Course' });
  // Null course
  await col.insertOne({ student, course: null, courseTitle: 'Null Course' });
  // Invalid string course
  await col.insertOne({ student, course: 'not-an-objectid', courseTitle: 'String Course' });
  // Numeric course
  await col.insertOne({ student, course: 12345, courseTitle: 'Numeric Course' });

  const docs = await col.find({ student }).toArray();
  assert.equal(docs.length, 4, 'All 4 non-ObjectId course documents must coexist without collision');
});

test('Gate 3 — Safe Rollout on Pre-Existing Legacy Data: Index creation succeeds on populated collection', async (t) => {
  const colName = 'test_pre_existing_legacy_' + Date.now();
  const col = mongoose.connection.collection(colName);
  t.after(async () => {
    await mongoose.connection.dropCollection(colName).catch(() => {});
  });

  const student1 = new mongoose.Types.ObjectId();
  const student2 = new mongoose.Types.ObjectId();

  // Populate collection with multiple legacy records per student BEFORE index exists
  await col.insertMany([
    { student: student1, courseTitle: 'Old Course 1' },
    { student: student1, course: null, courseTitle: 'Old Course 2' },
    { student: student1, course: null, courseTitle: 'Old Course 3' },
    { student: student2, courseTitle: 'Old Course 4' },
    { student: student2, courseTitle: 'Old Course 5' }
  ]);

  // Build partial index — must succeed without E11000
  let indexBuildError = null;
  try {
    await col.createIndex(
      { student: 1, course: 1 },
      {
        unique: true,
        name: 'unique_student_course_partial',
        partialFilterExpression: { course: { $type: 'objectId' } }
      }
    );
  } catch (err) {
    indexBuildError = err;
  }

  assert.equal(indexBuildError, null, 'Partial index build on pre-existing legacy data must succeed without error');

  const indexes = await col.indexes();
  const createdIndex = indexes.find(i => i.name === 'unique_student_course_partial');
  assert.ok(createdIndex, 'unique_student_course_partial index must exist in collection');
});
