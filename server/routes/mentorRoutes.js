const express = require('express');
const router = express.Router();
const {
  getMentors,
  bookSession,
  getSessions,
  getSessionById,
  updateSessionStatus,
  rateSession
} = require('../controllers/mentorController');
const { protect, optionalProtect } = require('../middleware/auth');

router.get('/', optionalProtect, getMentors);
router.post('/book', protect, bookSession);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSessionById);
router.put('/sessions/:id', protect, updateSessionStatus);
router.post('/sessions/:id/review', protect, rateSession);

module.exports = router;
