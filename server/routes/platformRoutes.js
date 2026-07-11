const express = require('express');
const router = express.Router();
const {
  getChallenges,
  submitChallenge,
  getForumPosts,
  createForumPost,
  likeForumPost,
  replyForumPost,
  issueCertificate,
  getCertificates,
  verifyCertificate,
  getNotifications,
  markReadNotification,
  getStudentAnalytics,
  getMentorAnalytics,
  getAdminAnalytics,
  approveMentor,
  getChatUsers,
  getMessages
} = require('../controllers/platformController');
const { protect, authorize } = require('../middleware/auth');

// Public certificate validation lookup
router.get('/certificates/verify/:id', verifyCertificate);

// Protected routes
router.use(protect);

// Coding Challenges
router.get('/challenges', getChallenges);
router.post('/challenges/submit', submitChallenge);

// Discussion Forums
router.get('/forum', getForumPosts);
router.post('/forum', createForumPost);
router.put('/forum/:id/like', likeForumPost);
router.post('/forum/:id/reply', replyForumPost);

// Certificates
router.post('/certificates', issueCertificate);
router.get('/certificates', getCertificates);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markReadNotification);

// Role-Based Analytics
router.get('/analytics/student', authorize('student'), getStudentAnalytics);
router.get('/analytics/mentor', authorize('mentor'), getMentorAnalytics);
router.get('/analytics/admin', authorize('admin'), getAdminAnalytics);

// Admin Controls
router.post('/admin/approve-mentor', authorize('admin'), approveMentor);

// Real-Time Chat Helper endpoints
router.get('/chat/users', getChatUsers);
router.get('/chat/messages/:userId', getMessages);

module.exports = router;
