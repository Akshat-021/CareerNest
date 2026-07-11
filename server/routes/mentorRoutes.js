const express = require('express');
const router = express.Router();
const {
  getMentors,
  bookSession,
  getSessions,
  updateSessionStatus,
  rateSession
} = require('../controllers/mentorController');
const { protect } = require('../middleware/auth');

router.get('/', getMentors);
router.post('/book', protect, bookSession);
router.get('/sessions', protect, getSessions);
router.put('/sessions/:id', protect, updateSessionStatus);
router.post('/sessions/:id/review', protect, rateSession);

module.exports = router;
