/**
 * Comprehensive Automated Tests: Phase 4 Milestone 4 Community Backend & Security
 * Covers:
 * 1. Public community creation and direct joining
 * 2. Unapproved mentor creating mentor-led community rejection (Rule 6)
 * 3. Approved mentor / student community creation
 * 4. Private community access control & join-request flow
 * 5. Private community join-request review & role boundaries
 * 6. Post creation, editing, deletion permissions
 * 7. Threaded replies & cross-community IDOR attempt rejection
 * 8. Member role management & moderator scope limits
 * 9. Content reporting & report moderation resolution
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const Report = require('../models/Report');
const communityController = require('../controllers/communityController');

console.log('\n=========================================');
console.log('CAREERNEST: PHASE 4 MILESTONE 4 COMMUNITY TESTS');
console.log('=========================================\n');

let passedCount = 0;
let failedCount = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${name}`);
    console.error(`  Reason: ${err.message}`);
    failedCount++;
  }
}

function mockRes() {
  let statusCode = 200;
  let jsonResponse = null;
  return {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => { jsonResponse = data; }
      };
    },
    json: (data) => { jsonResponse = data; },
    getStatus: () => statusCode,
    getData: () => jsonResponse
  };
}

async function runAllCommunityTests() {
  const studentUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Alice Student',
    role: 'student',
    isVerified: true
  };

  const studentUser2 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Bob Student',
    role: 'student',
    isVerified: true
  };

  const unapprovedMentor = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Charlie Unapproved',
    role: 'mentor',
    mentorProfile: { isApproved: false }
  };

  const approvedMentor = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Dr. Evelyn Mentor',
    role: 'mentor',
    mentorProfile: { isApproved: true }
  };

  // ---------------------------------------------------------
  // 1. Mentor Approval Requirement (Rule 6)
  // ---------------------------------------------------------
  await test('communityController.createCommunity rejects unapproved mentor creating mentor-led community with 403', async () => {
    const req = {
      user: unapprovedMentor,
      body: {
        name: 'Official AI Mentorship Circle',
        description: 'Advanced deep learning weekly mentorship cohort',
        isMentorLed: true
      }
    };
    const res = mockRes();
    const next = (err) => { throw err; };

    await communityController.createCommunity(req, res, next);

    assert.strictEqual(res.getStatus(), 403);
    assert.strictEqual(res.getData().success, false);
    assert.match(res.getData().message, /approved by an administrator/i);
  });

  await test('communityController.createCommunity rejects student claiming isMentorLed with 403', async () => {
    const req = {
      user: studentUser,
      body: {
        name: 'Student Cohort Claiming Mentor Status',
        description: 'Unauthorized claim of mentor leadership',
        isMentorLed: true
      }
    };
    const res = mockRes();
    const next = (err) => { throw err; };

    await communityController.createCommunity(req, res, next);

    assert.strictEqual(res.getStatus(), 403);
    assert.strictEqual(res.getData().success, false);
    assert.match(res.getData().message, /Only approved mentors/i);
  });

  // ---------------------------------------------------------
  // 2. Public Community Creation & Creator Role Assignment
  // ---------------------------------------------------------
  let createdCommunityDoc = null;
  await test('communityController.createCommunity allows verified student to create community as owner', async () => {
    const originalCreate = Community.create;
    const originalFindOne = Community.findOne;

    Community.findOne = async () => null; // No slug collision
    Community.create = async (doc) => {
      createdCommunityDoc = {
        ...doc,
        _id: new mongoose.Types.ObjectId(),
        save: async function() { return this; }
      };
      return createdCommunityDoc;
    };

    const req = {
      user: studentUser,
      body: {
        name: 'Web Dev Mastery',
        description: 'Cohort studying full-stack React and Node architecture',
        category: 'Engineering',
        isPrivate: false
      }
    };
    const res = mockRes();
    const next = (err) => { throw err; };

    await communityController.createCommunity(req, res, next);

    Community.create = originalCreate;
    Community.findOne = originalFindOne;

    assert.strictEqual(res.getStatus(), 201);
    assert.strictEqual(res.getData().success, true);
    assert.strictEqual(res.getData().community.slug, 'web-dev-mastery');
    assert.strictEqual(res.getData().community.members[0].role, 'owner');
    assert.strictEqual(res.getData().community.members[0].user.toString(), studentUser._id.toString());
  });

  // ---------------------------------------------------------
  // 3. Joining Public Community Directly
  // ---------------------------------------------------------
  await test('communityController.joinPublicCommunity adds user directly and rejects duplicates', async () => {
    const originalFindById = Community.findById;

    const mockCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Cloud Computing Cohort',
      isPrivate: false,
      members: [{ user: studentUser._id, role: 'owner', joinedAt: new Date() }],
      memberCount: 1,
      save: async function() { return this; }
    };

    Community.findById = async () => mockCommunity;

    // Bob joins
    const req1 = {
      user: studentUser2,
      params: { id: mockCommunity._id.toString() }
    };
    const res1 = mockRes();
    await communityController.joinPublicCommunity(req1, res1, () => {});

    assert.strictEqual(res1.getStatus(), 200);
    assert.strictEqual(res1.getData().success, true);
    assert.strictEqual(mockCommunity.members.length, 2);

    // Bob joins again (duplicate rejection)
    const res2 = mockRes();
    await communityController.joinPublicCommunity(req1, res2, () => {});

    assert.strictEqual(res2.getStatus(), 400);
    assert.match(res2.getData().message, /already a member/i);

    Community.findById = originalFindById;
  });

  // ---------------------------------------------------------
  // 4. Private Community: Join Request & Unauthorized Restriction
  // ---------------------------------------------------------
  await test('communityController.requestJoinPrivateCommunity queues pending request and restricts posts to non-members', async () => {
    const originalFindById = Community.findById;

    const mockPrivateCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Invite-Only System Design Experts',
      isPrivate: true,
      members: [{ user: studentUser._id, role: 'owner', joinedAt: new Date() }],
      joinRequests: [],
      save: async function() { return this; }
    };

    Community.findById = async () => mockPrivateCommunity;

    // Bob requests to join
    const req = {
      user: studentUser2,
      params: { id: mockPrivateCommunity._id.toString() },
      body: { requestMessage: 'Senior engineer wanting to discuss scalable patterns' }
    };
    const res = mockRes();
    await communityController.requestJoinPrivateCommunity(req, res, () => {});

    assert.strictEqual(res.getStatus(), 200);
    assert.strictEqual(res.getData().success, true);
    assert.strictEqual(mockPrivateCommunity.joinRequests.length, 1);
    assert.strictEqual(mockPrivateCommunity.joinRequests[0].status, 'pending');

    // Bob tries to view posts before approval: must receive 403
    const postReq = {
      user: studentUser2,
      params: { id: mockPrivateCommunity._id.toString() },
      query: {}
    };
    const postRes = mockRes();
    await communityController.getPosts(postReq, postRes, () => {});

    assert.strictEqual(postRes.getStatus(), 403);
    assert.match(postRes.getData().message, /must be a member/i);

    Community.findById = originalFindById;
  });

  // ---------------------------------------------------------
  // 5. Join Request Review: Only Staff Can Review
  // ---------------------------------------------------------
  await test('communityController.reviewJoinRequest rejects non-staff with 403 and admits member on approval', async () => {
    const originalFindById = Community.findById;

    const applicantId = new mongoose.Types.ObjectId();
    const requestId = new mongoose.Types.ObjectId();

    const mockReqItem = {
      _id: requestId,
      user: applicantId,
      status: 'pending'
    };

    const mockCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Private AI Lab',
      members: [{ user: studentUser._id, role: 'owner' }],
      joinRequests: {
        id: (id) => (id.toString() === requestId.toString() ? mockReqItem : null)
      },
      save: async function() { return this; }
    };

    Community.findById = async () => mockCommunity;

    // Unauthorized non-staff student2 attempts to approve
    const unauthReq = {
      user: studentUser2,
      params: { id: mockCommunity._id.toString(), requestId: requestId.toString() },
      body: { action: 'approve' }
    };
    const unauthRes = mockRes();
    await communityController.reviewJoinRequest(unauthReq, unauthRes, () => {});

    assert.strictEqual(unauthRes.getStatus(), 403);
    assert.match(unauthRes.getData().message, /moderator or owner privileges required/i);

    // Authorized owner approves
    const authReq = {
      user: studentUser,
      params: { id: mockCommunity._id.toString(), requestId: requestId.toString() },
      body: { action: 'approve' }
    };
    const authRes = mockRes();
    await communityController.reviewJoinRequest(authReq, authRes, () => {});

    assert.strictEqual(authRes.getStatus(), 200);
    assert.strictEqual(mockReqItem.status, 'approved');
    assert.strictEqual(mockCommunity.members.length, 2);
    assert.strictEqual(mockCommunity.members[1].user.toString(), applicantId.toString());

    Community.findById = originalFindById;
  });

  // ---------------------------------------------------------
  // 6. Post Creation & Author Permissions
  // ---------------------------------------------------------
  await test('communityController.createPost requires membership and saves post with author reference', async () => {
    const originalFindById = Community.findById;
    const originalPostCreate = CommunityPost.create;

    const mockCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Full Stack Cohort',
      members: [{ user: studentUser._id, role: 'owner' }],
      postCount: 0,
      save: async function() { return this; }
    };
    Community.findById = async () => mockCommunity;

    let savedPost = null;
    CommunityPost.create = async (doc) => {
      savedPost = {
        ...doc,
        _id: new mongoose.Types.ObjectId(),
        populate: async function() { return this; }
      };
      return savedPost;
    };

    // Non-member student2 attempts to post: 403
    const nonMemberReq = {
      user: studentUser2,
      params: { id: mockCommunity._id.toString() },
      body: { content: 'Hello cohort!' }
    };
    const nonMemberRes = mockRes();
    await communityController.createPost(nonMemberReq, nonMemberRes, () => {});
    assert.strictEqual(nonMemberRes.getStatus(), 403);

    // Member student1 posts: 201
    const memberReq = {
      user: studentUser,
      params: { id: mockCommunity._id.toString() },
      body: { title: 'First Module Discussion', content: 'Here are the key takeaways from Module 1.' }
    };
    const memberRes = mockRes();
    await communityController.createPost(memberReq, memberRes, () => {});

    assert.strictEqual(memberRes.getStatus(), 201);
    assert.strictEqual(savedPost.content, 'Here are the key takeaways from Module 1.');
    assert.strictEqual(savedPost.author.toString(), studentUser._id.toString());
    assert.strictEqual(mockCommunity.postCount, 1);

    Community.findById = originalFindById;
    CommunityPost.create = originalPostCreate;
  });

  // ---------------------------------------------------------
  // 7. Cross-Community IDOR Prevention in Nested Replies
  // ---------------------------------------------------------
  await test('communityController.createPostReply rejects cross-community reply with 400 (IDOR prevention)', async () => {
    const originalFindByIdComm = Community.findById;
    const originalFindByIdPost = CommunityPost.findById;

    const communityA = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Community A',
      members: [{ user: studentUser._id, role: 'owner' }],
      save: async function() { return this; }
    };
    const communityBId = new mongoose.Types.ObjectId();

    // Parent post belongs to Community B
    const postInCommunityB = {
      _id: new mongoose.Types.ObjectId(),
      community: communityBId,
      content: 'Discussion in Community B'
    };

    Community.findById = async () => communityA;
    CommunityPost.findById = async () => postInCommunityB;

    // Attacker tries to post reply in Community A referencing Post from Community B
    const req = {
      user: studentUser,
      params: { id: communityA._id.toString(), postId: postInCommunityB._id.toString() },
      body: { content: 'Malicious cross-community injected reply' }
    };
    const res = mockRes();
    await communityController.createPostReply(req, res, () => {});

    assert.strictEqual(res.getStatus(), 400);
    assert.match(res.getData().message, /cross-community reply rejected/i);

    Community.findById = originalFindByIdComm;
    CommunityPost.findById = originalFindByIdPost;
  });

  // ---------------------------------------------------------
  // 8. Post Editing & Deletion: Only Author or Authorized Staff
  // ---------------------------------------------------------
  await test('communityController.updatePost allows only author and rejects unauthorized modification with 403', async () => {
    const originalFindByIdComm = Community.findById;
    const originalFindByIdPost = CommunityPost.findById;

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      members: [{ user: studentUser._id, role: 'member' }, { user: studentUser2._id, role: 'member' }]
    };

    const postByAlice = {
      _id: new mongoose.Types.ObjectId(),
      community: comm._id,
      author: studentUser._id,
      title: 'Original Title',
      content: 'Original Content',
      save: async function() { return this; }
    };

    Community.findById = async () => comm;
    CommunityPost.findById = async () => postByAlice;

    // Bob tries to edit Alice's post: 403
    const bobReq = {
      user: studentUser2,
      params: { id: comm._id.toString(), postId: postByAlice._id.toString() },
      body: { content: 'Tampered content' }
    };
    const bobRes = mockRes();
    await communityController.updatePost(bobReq, bobRes, () => {});

    assert.strictEqual(bobRes.getStatus(), 403);
    assert.match(bobRes.getData().message, /only edit your own posts/i);

    // Alice edits her own post: 200
    const aliceReq = {
      user: studentUser,
      params: { id: comm._id.toString(), postId: postByAlice._id.toString() },
      body: { content: 'Updated content by author' }
    };
    const aliceRes = mockRes();
    await communityController.updatePost(aliceReq, aliceRes, () => {});

    assert.strictEqual(aliceRes.getStatus(), 200);
    assert.strictEqual(postByAlice.content, 'Updated content by author');
    assert.strictEqual(postByAlice.isEdited, true);

    Community.findById = originalFindByIdComm;
    CommunityPost.findById = originalFindByIdPost;
  });

  // ---------------------------------------------------------
  // 9. Member Role Management: Owner / Admin Privilege Boundaries
  // ---------------------------------------------------------
  await test('communityController.updateMemberRole allows owner and rejects unauthorized moderator/member with 403', async () => {
    const originalFindById = Community.findById;

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      members: [
        { user: studentUser._id, role: 'owner' },
        { user: studentUser2._id, role: 'moderator' },
        { user: unapprovedMentor._id, role: 'member' }
      ],
      save: async function() { return this; }
    };

    Community.findById = async () => comm;

    // Moderator student2 tries to promote member to moderator: 403
    const modReq = {
      user: studentUser2,
      params: { id: comm._id.toString(), userId: unapprovedMentor._id.toString() },
      body: { role: 'moderator' }
    };
    const modRes = mockRes();
    await communityController.updateMemberRole(modReq, modRes, () => {});
    assert.strictEqual(modRes.getStatus(), 403);
    assert.match(modRes.getData().message, /owner or an administrator/i);

    // Owner promotes member to moderator: 200
    const ownerReq = {
      user: studentUser,
      params: { id: comm._id.toString(), userId: unapprovedMentor._id.toString() },
      body: { role: 'moderator' }
    };
    const ownerRes = mockRes();
    await communityController.updateMemberRole(ownerReq, ownerRes, () => {});
    assert.strictEqual(ownerRes.getStatus(), 200);
    assert.strictEqual(comm.members[2].role, 'moderator');

    Community.findById = originalFindById;
  });

  // ---------------------------------------------------------
  // 10. Content Reporting & Report Resolution
  // ---------------------------------------------------------
  await test('communityController.reportItem logs report and reviewReport applies content removal action', async () => {
    const originalFindByIdComm = Community.findById;
    const originalReportCreate = Report.create;
    const originalReportFindById = Report.findById;
    const originalPostFindById = CommunityPost.findById;

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      members: [{ user: studentUser._id, role: 'owner' }],
      postCount: 1,
      save: async function() { return this; }
    };

    let savedReport = null;
    Report.create = async (doc) => {
      savedReport = {
        ...doc,
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        moderationAction: 'none',
        save: async function() { return this; }
      };
      return savedReport;
    };

    Community.findById = async () => comm;

    const targetPostId = new mongoose.Types.ObjectId();
    const offendingPost = {
      _id: targetPostId,
      community: comm._id,
      isDeleted: false,
      save: async function() { return this; }
    };
    CommunityPost.findById = async () => offendingPost;

    // Student 2 reports offending post
    const reportReq = {
      user: studentUser2,
      params: { id: comm._id.toString() },
      body: {
        targetType: 'CommunityPost',
        targetId: targetPostId.toString(),
        reason: 'spam',
        description: 'Contains repeated crypto advertisements'
      }
    };
    const reportRes = mockRes();
    await communityController.reportItem(reportReq, reportRes, () => {});

    assert.strictEqual(reportRes.getStatus(), 201);
    assert.strictEqual(savedReport.reason, 'spam');

    // Owner reviews report and resolves with content_removed
    Report.findById = async () => savedReport;

    const reviewReq = {
      user: studentUser,
      params: { id: comm._id.toString(), reportId: savedReport._id.toString() },
      body: {
        status: 'resolved',
        moderationAction: 'content_removed',
        moderationNotes: 'Spam confirmed and removed.'
      }
    };
    const reviewRes = mockRes();
    await communityController.reviewReport(reviewReq, reviewRes, () => {});

    assert.strictEqual(reviewRes.getStatus(), 200);
    assert.strictEqual(savedReport.status, 'resolved');
    assert.strictEqual(offendingPost.isDeleted, true);

    Community.findById = originalFindByIdComm;
    Report.create = originalReportCreate;
    Report.findById = originalReportFindById;
    CommunityPost.findById = originalPostFindById;
  });

  // ---------------------------------------------------------
  // 11. Cross-Community Report Isolation
  // ---------------------------------------------------------
  await test('communityController.reportItem rejects reporting a post belonging to another community with 400', async () => {
    const originalFindByIdComm = Community.findById;
    const originalPostFindById = CommunityPost.findById;

    const commA = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Community A'
    };
    const otherCommId = new mongoose.Types.ObjectId();
    const alienPost = {
      _id: new mongoose.Types.ObjectId(),
      community: otherCommId,
      content: 'Post in another community'
    };

    Community.findById = async () => commA;
    CommunityPost.findById = async () => alienPost;

    const req = {
      user: studentUser2,
      params: { id: commA._id.toString() },
      body: {
        targetType: 'CommunityPost',
        targetId: alienPost._id.toString(),
        reason: 'spam'
      }
    };
    const res = mockRes();
    await communityController.reportItem(req, res, () => {});

    assert.strictEqual(res.getStatus(), 400);
    assert.match(res.getData().message, /does not belong to this community/i);

    Community.findById = originalFindByIdComm;
    CommunityPost.findById = originalPostFindById;
  });

  // ---------------------------------------------------------
  // 12. Moderation Authority: Cannot Remove Owner or Peer Moderator
  // ---------------------------------------------------------
  await test('communityController.removeMember rejects moderator attempting to remove owner or peer moderator with 403', async () => {
    const originalFindById = Community.findById;

    const moderator1 = { _id: new mongoose.Types.ObjectId(), role: 'moderator' };
    const moderator2 = { _id: new mongoose.Types.ObjectId(), role: 'moderator' };
    const owner = { _id: studentUser._id, role: 'owner' };

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      members: [
        { user: owner._id, role: 'owner' },
        { user: moderator1._id, role: 'moderator' },
        { user: moderator2._id, role: 'moderator' }
      ],
      memberCount: 3,
      save: async function() { return this; }
    };

    Community.findById = async () => comm;

    // Moderator 1 attempts to remove Owner: 403
    const req1 = {
      user: { _id: moderator1._id, role: 'student' },
      params: { id: comm._id.toString(), userId: owner._id.toString() }
    };
    const res1 = mockRes();
    await communityController.removeMember(req1, res1, () => {});
    assert.strictEqual(res1.getStatus(), 403);
    assert.match(res1.getData().message, /cannot remove community owners or other moderators/i);

    // Moderator 1 attempts to remove Moderator 2: 403
    const req2 = {
      user: { _id: moderator1._id, role: 'student' },
      params: { id: comm._id.toString(), userId: moderator2._id.toString() }
    };
    const res2 = mockRes();
    await communityController.removeMember(req2, res2, () => {});
    assert.strictEqual(res2.getStatus(), 403);
    assert.match(res2.getData().message, /cannot remove community owners or other moderators/i);

    Community.findById = originalFindById;
  });

  // ---------------------------------------------------------
  // 13. Owner Leaving Restriction
  // ---------------------------------------------------------
  await test('communityController.leaveCommunity prevents owner from abandoning community when members remain', async () => {
    const originalFindById = Community.findById;

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Owner Protected Community',
      members: [
        { user: studentUser._id, role: 'owner' },
        { user: studentUser2._id, role: 'member' }
      ],
      memberCount: 2,
      save: async function() { return this; }
    };

    Community.findById = async () => comm;

    const req = {
      user: studentUser,
      params: { id: comm._id.toString() }
    };
    const res = mockRes();
    await communityController.leaveCommunity(req, res, () => {});

    assert.strictEqual(res.getStatus(), 400);
    assert.match(res.getData().message, /cannot leave without transferring ownership/i);

    Community.findById = originalFindById;
  });

  // ---------------------------------------------------------
  // 14. Nested Reply Deletion & ReplyCount Decrement
  // ---------------------------------------------------------
  await test('communityController.deletePost decrements parent replyCount when a nested reply is deleted', async () => {
    const originalFindByIdComm = Community.findById;
    const originalFindByIdPost = CommunityPost.findById;

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      postCount: 5,
      members: [{ user: studentUser._id, role: 'owner' }],
      save: async function() { return this; }
    };

    const parentPost = {
      _id: new mongoose.Types.ObjectId(),
      community: comm._id,
      replyCount: 3,
      save: async function() { return this; }
    };

    const replyPost = {
      _id: new mongoose.Types.ObjectId(),
      community: comm._id,
      parentPost: parentPost._id,
      author: studentUser2._id,
      isDeleted: false,
      save: async function() { return this; }
    };

    Community.findById = async () => comm;
    CommunityPost.findById = async (id) => {
      if (id.toString() === replyPost._id.toString()) return replyPost;
      if (id.toString() === parentPost._id.toString()) return parentPost;
      return null;
    };

    const req = {
      user: studentUser2,
      params: { id: comm._id.toString(), postId: replyPost._id.toString() }
    };
    const res = mockRes();
    await communityController.deletePost(req, res, () => {});

    assert.strictEqual(res.getStatus(), 200);
    assert.strictEqual(replyPost.isDeleted, true);
    assert.strictEqual(parentPost.replyCount, 2);
    assert.strictEqual(comm.postCount, 4);

    Community.findById = originalFindByIdComm;
    CommunityPost.findById = originalFindByIdPost;
  });

  // ---------------------------------------------------------
  // 15. Toggle Like Consistency & Duplicate Immunity
  // ---------------------------------------------------------
  await test('communityController.togglePostLike correctly adds and removes like without duplicates or negative counts', async () => {
    const originalFindByIdComm = Community.findById;
    const originalFindByIdPost = CommunityPost.findById;

    const comm = {
      _id: new mongoose.Types.ObjectId(),
      isPrivate: false,
      members: [{ user: studentUser._id, role: 'owner' }]
    };

    const post = {
      _id: new mongoose.Types.ObjectId(),
      community: comm._id,
      likes: [],
      save: async function() { return this; }
    };

    Community.findById = async () => comm;
    CommunityPost.findById = async () => post;

    const req = {
      user: studentUser2,
      params: { id: comm._id.toString(), postId: post._id.toString() }
    };

    // First toggle: like added
    const res1 = mockRes();
    await communityController.togglePostLike(req, res1, () => {});
    assert.strictEqual(res1.getStatus(), 200);
    assert.strictEqual(res1.getData().hasLiked, true);
    assert.strictEqual(res1.getData().likeCount, 1);
    assert.strictEqual(post.likes.length, 1);

    // Second toggle: like removed
    const res2 = mockRes();
    await communityController.togglePostLike(req, res2, () => {});
    assert.strictEqual(res2.getStatus(), 200);
    assert.strictEqual(res2.getData().hasLiked, false);
    assert.strictEqual(res2.getData().likeCount, 0);
    assert.strictEqual(post.likes.length, 0);

    Community.findById = originalFindByIdComm;
    CommunityPost.findById = originalFindByIdPost;
  });

  console.log('\n=========================================');
  console.log(`COMMUNITY TESTS FINISHED: ${passedCount} passed, ${failedCount} failed`);
  console.log('=========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllCommunityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
