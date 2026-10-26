/**
 * Regression Tests: Phase 6 Mentorship Room Authorization & Session Security
 * Covers:
 * 1. Invalid and non-existent session rejection (HTTP 404)
 * 2. Unauthorized third-party user rejection (HTTP 403 BOLA prevention)
 * 3. Rejected session access prevention (HTTP 403)
 * 4. Completed session room closure (HTTP 410)
 * 5. Assigned student authorization (HTTP 200)
 * 6. Assigned mentor authorization (HTTP 200)
 * 7. System administrator authorization (HTTP 200)
 */

const assert = require('assert');
const mongoose = require('mongoose');

console.log('\n=========================================');
console.log('CAREERNEST: PHASE 6 MENTORSHIP ROOM ACCESS TESTS');
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

async function runPhase6Tests() {
  const mentorController = require('../controllers/mentorController');
  const Session = require('../models/Session');

  await test('getSessionById rejects invalid session ObjectId with 404', async () => {
    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: 'invalid-id-string' },
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 404);
    assert.strictEqual(jsonResp.success, false);
    assert.match(jsonResp.message, /not found/i);
  });

  await test('getSessionById returns 404 when session does not exist in database', async () => {
    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => null
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 404);
    assert.strictEqual(jsonResp.success, false);

    Session.findById = originalFindById;
  });

  await test('getSessionById rejects unauthorized third party with HTTP 403', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const outsiderId = new mongoose.Types.ObjectId();

    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: new mongoose.Types.ObjectId(),
          mentor: { _id: mentorId, name: 'Dr. Sarah' },
          student: { _id: studentId, name: 'Alex' },
          status: 'approved'
        })
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: outsiderId.toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 403, 'Must reject unauthorized third-party user with 403');
    assert.strictEqual(jsonResp.success, false);
    assert.match(jsonResp.message, /not authorized/i);

    Session.findById = originalFindById;
  });

  await test('getSessionById rejects rejected session room access with HTTP 403', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();

    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: new mongoose.Types.ObjectId(),
          mentor: { _id: mentorId, name: 'Dr. Sarah' },
          student: { _id: studentId, name: 'Alex' },
          status: 'rejected'
        })
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: studentId.toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResp.success, false);
    assert.match(jsonResp.message, /rejected/i);

    Session.findById = originalFindById;
  });

  await test('getSessionById rejects completed session room access with HTTP 410 (Gone)', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();

    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: new mongoose.Types.ObjectId(),
          mentor: { _id: mentorId, name: 'Dr. Sarah' },
          student: { _id: studentId, name: 'Alex' },
          status: 'completed'
        })
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: studentId.toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 410, 'Completed session should return 410 Gone');
    assert.strictEqual(jsonResp.success, false);
    assert.match(jsonResp.message, /completed/i);

    Session.findById = originalFindById;
  });

  await test('getSessionById authorizes assigned student with HTTP 200', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();

    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: new mongoose.Types.ObjectId(),
          mentor: { _id: mentorId, name: 'Dr. Sarah' },
          student: { _id: studentId, name: 'Alex' },
          status: 'approved',
          time: '14:00 - 15:00'
        })
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: studentId.toString(), role: 'student' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);
    assert.strictEqual(jsonResp.session.mentor.name, 'Dr. Sarah');

    Session.findById = originalFindById;
  });

  await test('getSessionById authorizes assigned mentor with HTTP 200', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();

    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: new mongoose.Types.ObjectId(),
          mentor: { _id: mentorId, name: 'Dr. Sarah' },
          student: { _id: studentId, name: 'Alex' },
          status: 'approved',
          time: '14:00 - 15:00'
        })
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: mentorId.toString(), role: 'mentor' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);

    Session.findById = originalFindById;
  });

  await test('getSessionById authorizes platform admin with HTTP 200', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    const originalFindById = Session.findById;
    Session.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: new mongoose.Types.ObjectId(),
          mentor: { _id: mentorId, name: 'Dr. Sarah' },
          student: { _id: studentId, name: 'Alex' },
          status: 'approved',
          time: '14:00 - 15:00'
        })
      })
    });

    let statusCode = null;
    let jsonResp = null;
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      user: { id: adminId.toString(), role: 'admin' }
    };
    const res = {
      status: (c) => { statusCode = c; return { json: (d) => { jsonResp = d; } }; }
    };

    await mentorController.getSessionById(req, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(jsonResp.success, true);

    Session.findById = originalFindById;
  });

  console.log('\n=========================================');
  console.log(`PHASE 6 MENTORSHIP TESTS FINISHED: ${passed} passed, ${failed} failed`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests();
