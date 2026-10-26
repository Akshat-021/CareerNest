const express = require('express');
const router = express.Router();
const {
  getCareerProfile,
  updateCareerProfile,
  analyzeJobDescription,
  recommendCourses,
  generateRoadmap,
  getUserRoadmaps,
  chatbotReply,
  analyzeUserResume,
  skillGapAnalysis,
  generateInterview,
  evaluateInterviewAnswer,
  generateCourseQuiz,
  submitQuiz,
  syncGitHub,
  generateCoverLetter
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All AI features require authentication
router.use(protect);

// Central Career Intelligence Profile
router.get('/career-profile', getCareerProfile);
router.put('/career-profile', updateCareerProfile);

// Job Description Intelligence & Matcher
router.post('/analyze-job', analyzeJobDescription);

// Course Recommendations & Roadmaps
router.post('/recommend', recommendCourses);
router.post('/roadmap', generateRoadmap);
router.get('/roadmaps', getUserRoadmaps);

// Context-Aware Aura Copilot
router.post('/chat', chatbotReply);

// Resume ATS Scanner & Skill Gaps
router.post('/resume', upload.single('resume'), analyzeUserResume);
router.post('/gap-analysis', skillGapAnalysis);

// Voice/Text AI Mock Interview & Evaluation
router.post('/interview', generateInterview);
router.post('/interview/evaluate', evaluateInterviewAnswer);

// Quizzes & Leaderboard
router.post('/quiz', generateCourseQuiz);
router.post('/quiz/:id/submit', submitQuiz);

// GitHub Intelligence & Application Copilot
router.post('/github-sync', syncGitHub);
router.post('/cover-letter', generateCoverLetter);

module.exports = router;
