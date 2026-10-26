const Course = require('../models/Course');
const User = require('../models/User');
const CourseEnrollment = require('../models/CourseEnrollment');
const Certificate = require('../models/Certificate');
const CareerProfile = require('../models/CareerProfile');
const careerProfileService = require('../services/careerProfileService');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all courses with filters
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const { category, difficulty, search, rating } = req.query;
    let query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (rating) query.rating = { $gte: parseFloat(rating) };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query).populate('instructor', 'name profileImage');
    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name profileImage bio mentorProfile')
      .populate('reviews.student', 'name profileImage');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course (Approved Mentor or Admin)
// @route   POST /api/courses
// @access  Private (Approved Mentor, Admin)
exports.createCourse = async (req, res, next) => {
  try {
    // Verify server-side authorization using trusted database state
    const trustedUser = await User.findById(req.user.id);
    if (!trustedUser) {
      return res.status(401).json({ success: false, message: 'Authenticated user not found' });
    }

    if (trustedUser.role === 'admin') {
      // Admins are authorized
    } else if (trustedUser.role === 'mentor') {
      if (!trustedUser.mentorProfile || trustedUser.mentorProfile.isApproved !== true) {
        return res.status(403).json({
          success: false,
          message: 'Mentor profile is pending administrator approval. Only approved mentors can create courses.'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only approved mentors or administrators can create courses'
      });
    }

    const { title, description, category, difficulty, duration, prerequisites, modules, projects } = req.body;

    let thumbnail = '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file, 'courses');
      thumbnail = uploadResult.url;
    }

    const parsedModules = typeof modules === 'string' ? JSON.parse(modules) : modules;
    const parsedProjects = typeof projects === 'string' ? JSON.parse(projects) : projects;

    const course = await Course.create({
      title,
      description,
      category,
      difficulty,
      duration,
      prerequisites: typeof prerequisites === 'string' ? JSON.parse(prerequisites) : prerequisites,
      modules: parsedModules,
      projects: parsedProjects,
      thumbnail,
      instructor: req.user.id
    });

    res.status(201).json({ success: true, message: 'Course created successfully', course });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review/rating to course
// @route   POST /api/courses/:id/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = course.reviews.find(
      (r) => r.student.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'Course already reviewed' });
    }

    const review = {
      student: req.user.id,
      rating: Number(rating),
      comment
    };

    course.reviews.push(review);

    // Re-calculate course rating
    course.rating =
      course.reviews.reduce((acc, item) => item.rating + acc, 0) /
      course.reviews.length;

    await course.save();
    res.status(201).json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique course categories
// @route   GET /api/courses/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Course.distinct('category');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll authenticated student in a course
// @route   POST /api/courses/:id/enroll
// @access  Private
exports.enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingEnrollment = await CourseEnrollment.findOne({
      student: req.user.id,
      course: course._id
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course',
        enrollment: existingEnrollment
      });
    }

    const enrollment = await CourseEnrollment.create({
      student: req.user.id,
      course: course._id,
      status: 'enrolled',
      progressPercent: 0,
      completedModules: []
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }
    next(error);
  }
};

// @desc    Get enrollment & progress for current user
// @route   GET /api/courses/:id/enrollment
// @access  Private
exports.getCourseEnrollment = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollment = await CourseEnrollment.findOne({
      student: req.user.id,
      course: course._id
    }).populate('certificate');

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        enrolled: false,
        enrollment: null
      });
    }

    res.status(200).json({
      success: true,
      enrolled: true,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a curriculum module with server-side validation
// @route   POST /api/courses/:id/modules/:moduleId/complete
// @access  Private
exports.completeCourseModule = async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollment = await CourseEnrollment.findOne({
      student: req.user.id,
      course: course._id
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Student must be enrolled in the course to complete modules'
      });
    }

    if (!course.modules || course.modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course curriculum is empty. There are no modules to complete.'
      });
    }

    // Server-side validation: Verify module exists in course embedded modules
    const moduleItem = course.modules.find(
      (m) => m._id.toString() === moduleId.toString()
    );

    if (!moduleItem) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module reference: module does not belong to this course'
      });
    }

    // Add to completedModules if not already recorded
    const alreadyCompleted = enrollment.completedModules.some(
      (cm) => cm.module.toString() === moduleId.toString()
    );

    if (!alreadyCompleted) {
      enrollment.completedModules.push({
        module: moduleItem._id,
        completedAt: new Date()
      });
    }

    // Calculate verified progress
    const totalModules = course.modules.length;
    const completedCount = enrollment.completedModules.length;
    enrollment.progressPercent = totalModules > 0 ? Math.min(100, Math.round((completedCount / totalModules) * 100)) : 100;

    if (enrollment.progressPercent === 100) {
      enrollment.status = 'completed';
      if (!enrollment.completedAt) enrollment.completedAt = new Date();
    } else {
      enrollment.status = 'in-progress';
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Module completion recorded successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim certificate upon 100% server-verified course completion
// @route   POST /api/courses/:id/claim-certificate
// @access  Private
exports.claimCourseCertificate = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!course.modules || course.modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course curriculum is empty. Certificates cannot be issued for courses without curriculum modules.'
      });
    }

    const enrollment = await CourseEnrollment.findOne({
      student: req.user.id,
      course: course._id
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Student must be enrolled in the course to claim a certificate'
      });
    }

    const totalModules = course.modules.length;
    const completedCount = enrollment.completedModules ? enrollment.completedModules.length : 0;

    if (enrollment.status !== 'completed' || completedCount < totalModules || completedCount === 0) {
      return res.status(400).json({
        success: false,
        message: `Course completion requirements not satisfied (${completedCount}/${totalModules} modules completed). All modules must be completed before certificate issuance.`
      });
    }

    // Idempotency check: Return existing certificate if already issued
    const existingCert = await Certificate.findOne({
      student: req.user.id,
      $or: [
        { course: course._id },
        { courseTitle: course.title },
        { courseName: course.title }
      ]
    });

    if (existingCert) {
      if (!enrollment.certificate) {
        enrollment.certificate = existingCert._id;
        await enrollment.save();
      }
      return res.status(200).json({
        success: true,
        message: 'Certificate already claimed',
        certificate: existingCert
      });
    }

    // Generate new verifiable certificate
    const certCode = 'NEST-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + new Date().getFullYear();
    const qrUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certCode}`;

    const certificate = await Certificate.create({
      student: req.user.id,
      course: course._id,
      courseTitle: course.title,
      courseName: course.title,
      grade: 'A+ with Distinction',
      certificateId: certCode,
      verificationCode: certCode,
      qrVerificationUrl: qrUrl,
      qrCodeData: qrUrl,
      issuedDate: new Date(),
      issueDate: new Date()
    });

    enrollment.certificate = certificate._id;
    await enrollment.save();

    // Recalculate CareerProfile readiness score
    const profile = await CareerProfile.findOne({ student: req.user.id });
    if (profile) {
      await careerProfileService.recalculateReadiness(profile._id);
    }

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      certificate
    });
  } catch (error) {
    if (error.code === 11000) {
      // Concurrent claim race condition: fetch and return existing certificate idempotently
      try {
        const existing = await Certificate.findOne({
          student: req.user.id,
          $or: [
            { course: req.params.id },
            { certificateId: req.body?.certificateId }
          ]
        });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Certificate already claimed',
            certificate: existing
          });
        }
      } catch (err) {
        // Fall through to error handler
      }
    }
    next(error);
  }
};
