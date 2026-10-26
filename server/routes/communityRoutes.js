const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const {
  getCommunities,
  createCommunity,
  getCommunity,
  updateCommunity,
  joinPublicCommunity,
  requestJoinPrivateCommunity,
  getJoinRequests,
  reviewJoinRequest,
  leaveCommunity,
  updateMemberRole,
  removeMember,
  getPosts,
  createPost,
  getPostReplies,
  createPostReply,
  updatePost,
  deletePost,
  togglePostLike,
  reportItem,
  getCommunityReports,
  reviewReport
} = require('../controllers/communityController');

// Community Discovery & Creation
router.route('/')
  .get(optionalProtect, getCommunities)
  .post(protect, createCommunity);

// Single Community Profile & Settings
router.route('/:idOrSlug')
  .get(optionalProtect, getCommunity);

router.route('/:id')
  .patch(protect, updateCommunity);

// Membership Actions
router.post('/:id/join', protect, joinPublicCommunity);
router.post('/:id/request-join', protect, requestJoinPrivateCommunity);
router.post('/:id/leave', protect, leaveCommunity);

// Private Community Join Requests Management (Owner/Mod/Admin)
router.get('/:id/requests', protect, getJoinRequests);
router.post('/:id/requests/:requestId/review', protect, reviewJoinRequest);

// Community Member & Role Management (Owner/Admin)
router.patch('/:id/members/:userId/role', protect, updateMemberRole);
router.delete('/:id/members/:userId', protect, removeMember);

// Community Posts & Threaded Discussions
router.route('/:id/posts')
  .get(optionalProtect, getPosts)
  .post(protect, createPost);

router.route('/:id/posts/:postId')
  .patch(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:id/posts/:postId/like', protect, togglePostLike);

// Threaded Replies
router.route('/:id/posts/:postId/replies')
  .get(optionalProtect, getPostReplies)
  .post(protect, createPostReply);

// Moderation & Reports
router.post('/:id/report', protect, reportItem);
router.get('/:id/reports', protect, getCommunityReports);
router.patch('/:id/reports/:reportId', protect, reviewReport);

module.exports = router;
