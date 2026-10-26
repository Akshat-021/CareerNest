const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  addReview,
  getCategories,
  enrollInCourse,
  getCourseEnrollment,
  completeCourseModule,
  claimCourseCertificate
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/:id', getCourseById);

// Protected student enrollment & verified progress
router.post('/:id/enroll', protect, enrollInCourse);
router.get('/:id/enrollment', protect, getCourseEnrollment);
router.post('/:id/modules/:moduleId/complete', protect, completeCourseModule);
router.post('/:id/claim-certificate', protect, claimCourseCertificate);

// Protected course modification
router.post('/', protect, authorize('mentor', 'admin'), upload.single('thumbnail'), createCourse);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
