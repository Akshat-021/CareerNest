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
  getCareerPassport,
  getNotifications,
  markReadNotification,
  getStudentAnalytics,
  getMentorAnalytics,
  getAdminAnalytics,
  approveMentor,
  getChatUsers,
  getMessages,
  getJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getStudyPods,
  createStudyPod,
  joinStudyPod,
  postPodMessage,
  getMicroInternships,
  submitMicroInternship
} = require('../controllers/platformController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// Public lookups
router.get('/certificates/verify/:id', verifyCertificate);
router.get('/passport/:slugOrId', optionalProtect, getCareerPassport);

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

// Job Application Copilot
router.get('/job-applications', getJobApplications);
router.post('/job-applications', createJobApplication);
router.put('/job-applications/:id', updateJobApplication);
router.delete('/job-applications/:id', deleteJobApplication);

// Peer Study Pods
router.get('/study-pods', getStudyPods);
router.post('/study-pods', createStudyPod);
router.post('/study-pods/:id/join', joinStudyPod);
router.post('/study-pods/:id/messages', postPodMessage);

// AI Micro-Internships
router.get('/micro-internships', getMicroInternships);
router.post('/micro-internships/:id/submit', submitMicroInternship);

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
