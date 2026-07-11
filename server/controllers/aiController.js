const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Quiz = require('../models/Quiz');
const aiService = require('../services/gemini');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Generate Course Recommendations
// @route   POST /api/ai/recommend
// @access  Private
exports.recommendCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = {
      currentSkills: user.studentProfile.skills,
      careerGoal: user.studentProfile.careerGoal,
      learningStyle: user.studentProfile.learningStyle,
      preferredTechnology: user.studentProfile.preferredTechnology,
      placementTarget: user.studentProfile.placementTarget,
      semester: user.studentProfile.semester,
      cgpa: user.studentProfile.cgpa,
      studyHours: user.studentProfile.studyHours,
      budget: user.studentProfile.budget
    };

    const recommendations = await aiService.generateRecommendations(profile);
    res.status(200).json({ success: true, ...recommendations });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Career Roadmap
// @route   POST /api/ai/roadmap
// @access  Private
exports.generateRoadmap = async (req, res, next) => {
  try {
    const { track } = req.body;
    if (!track) {
      return res.status(400).json({ success: false, message: 'Track is required' });
    }

    const roadmapData = await aiService.generateCareerRoadmap(track);
    
    // Save to DB
    const roadmap = await Roadmap.create({
      student: req.user.id,
      track: roadmapData.track,
      duration: roadmapData.duration,
      difficulty: roadmapData.difficulty,
      modules: roadmapData.modules
    });

    res.status(200).json({ success: true, roadmap });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user saved roadmaps
// @route   GET /api/ai/roadmaps
// @access  Private
exports.getUserRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ student: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, roadmaps });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Chatbot Response
// @route   POST /api/ai/chat
// @access  Private
exports.chatbotReply = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const reply = await aiService.getChatbotResponse(message, history);
    res.status(200).json({ success: true, ...reply });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze uploaded resume
// @route   POST /api/ai/resume
// @access  Private
exports.analyzeUserResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }

    // Save resume to Cloudinary/Disk
    const uploadResult = await uploadToCloudinary(req.file, 'resumes');
    
    // Simulate text content extraction based on file headers
    const mockResumeText = `Resume File Name: ${req.file.originalname}. Skills: ${req.user.studentProfile.skills.join(', ')}. Candidate: ${req.user.name}.`;

    const analysis = await aiService.analyzeResume(mockResumeText, req.user.studentProfile.careerGoal);
    
    // Update student resume credentials in database
    const user = await User.findById(req.user.id);
    user.studentProfile.resumeUrl = uploadResult.url;
    user.studentProfile.resumeScore = analysis.atsScore;
    await user.save();

    res.status(200).json({
      success: true,
      resumeUrl: uploadResult.url,
      analysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Skill Gap Analyzer
// @route   POST /api/ai/gap-analysis
// @access  Private
exports.skillGapAnalysis = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const analysis = await aiService.analyzeSkillGap(
      user.studentProfile.skills,
      user.studentProfile.careerGoal
    );
    res.status(200).json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Mock Interview Questions
// @route   POST /api/ai/interview
// @access  Private
exports.generateInterview = async (req, res, next) => {
  try {
    const { technology, experience, role, difficulty } = req.body;
    const interviewData = await aiService.generateMockInterview(
      technology || req.user.studentProfile.preferredTechnology || 'NodeJS',
      experience || 'Entry-Level',
      role || req.user.studentProfile.careerGoal || 'Software Engineer',
      difficulty || 'Medium'
    );
    res.status(200).json({ success: true, ...interviewData });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate dynamic course quiz
// @route   POST /api/ai/quiz
// @access  Private
exports.generateCourseQuiz = async (req, res, next) => {
  try {
    const { courseName, topic, difficulty } = req.body;
    const quizData = await aiService.generateQuiz(
      courseName || 'Fullstack Node',
      topic || 'API Security',
      difficulty || 'Medium'
    );

    // Save empty quiz shell to track student completion
    const quiz = await Quiz.create({
      student: req.user.id,
      courseName: courseName || 'Fullstack Node',
      topic: topic || 'API Security',
      difficulty: difficulty || 'Medium',
      quizTitle: quizData.quizTitle,
      questions: quizData.questions
    });

    res.status(200).json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz result and update leaderboard
// @route   POST /api/ai/quiz/:id/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { score } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    quiz.score = score;
    quiz.attempts += 1;
    quiz.completedAt = new Date();
    await quiz.save();

    // Reward points to student
    const user = await User.findById(req.user.id);
    user.studentProfile.leaderboardPoints += score * 10; // 10 points per correct answer
    
    // Add badge if score is perfect
    if (score === quiz.questions.length && !user.studentProfile.badges.includes('Quiz Master')) {
      user.studentProfile.badges.push('Quiz Master');
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      quiz,
      pointsEarned: score * 10
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Predict Placement Probability
// @route   GET /api/ai/predict
// @access  Private
exports.predictPlacement = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Aggregate data points
    const metrics = {
      cgpa: user.studentProfile.cgpa || 7.0,
      skillsCount: user.studentProfile.skills ? user.studentProfile.skills.length : 0,
      projectsCount: 2, // Default mock projects
      certificationsCount: user.studentProfile.badges ? user.studentProfile.badges.length : 0,
      mockInterviewScore: 75, // Default average
      resumeScore: user.studentProfile.resumeScore || 60,
      codingChallengesScore: user.studentProfile.leaderboardPoints || 0
    };

    const prediction = aiService.predictPlacementProbability(metrics);
    res.status(200).json({ success: true, ...prediction });
  } catch (error) {
    next(error);
  }
};
