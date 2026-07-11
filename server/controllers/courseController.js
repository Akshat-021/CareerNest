const Course = require('../models/Course');
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

// @desc    Create new course (Mentor or Admin)
// @route   POST /api/courses
// @access  Private (Mentor, Admin)
exports.createCourse = async (req, res, next) => {
  try {
    // Check role is mentor or admin
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Only mentors or admins can create courses' });
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
