const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  addReview,
  getCategories
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/:id', getCourseById);

// Protected course modification
router.post('/', protect, authorize('mentor', 'admin'), upload.single('thumbnail'), createCourse);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
