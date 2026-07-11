const express = require('express');
const router = express.Router();
const {
  recommendCourses,
  generateRoadmap,
  getUserRoadmaps,
  chatbotReply,
  analyzeUserResume,
  skillGapAnalysis,
  generateInterview,
  generateCourseQuiz,
  submitQuiz,
  predictPlacement
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All AI features are authenticated protected
router.use(protect);

router.post('/recommend', recommendCourses);
router.post('/roadmap', generateRoadmap);
router.get('/roadmaps', getUserRoadmaps);
router.post('/chat', chatbotReply);
router.post('/resume', upload.single('resume'), analyzeUserResume);
router.post('/gap-analysis', skillGapAnalysis);
router.post('/interview', generateInterview);
router.post('/quiz', generateCourseQuiz);
router.post('/quiz/:id/submit', submitQuiz);
router.get('/predict', predictPlacement);

module.exports = router;
