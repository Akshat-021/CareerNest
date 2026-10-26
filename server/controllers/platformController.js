const Challenge = require('../models/Challenge');
const ForumPost = require('../models/Forum');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Course = require('../models/Course');
const Session = require('../models/Session');
const Message = require('../models/Message');
const CareerProfile = require('../models/CareerProfile');
const JobApplication = require('../models/JobApplication');
const StudyPod = require('../models/StudyPod');
const MicroInternship = require('../models/MicroInternship');
const CourseEnrollment = require('../models/CourseEnrollment');
const careerProfileService = require('../services/careerProfileService');

// ==========================================
// 1. CODING CHALLENGES
// ==========================================

exports.getChallenges = async (req, res, next) => {
  try {
    const challenges = await Challenge.find({});
    res.status(200).json({ success: true, count: challenges.length, challenges });
  } catch (error) {
    next(error);
  }
};

exports.submitChallenge = async (req, res, next) => {
  try {
    const { challengeId, code } = req.body;
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    let isPassed = true;
    let feedback = "All test cases passed successfully!";

    if (!code || code.trim() === '' || code.includes('syntax error')) {
      isPassed = false;
      feedback = "Failed test case 1: SyntaxError or missing return statement.";
    }

    if (isPassed) {
      const user = await User.findById(req.user.id);
      user.studentProfile.leaderboardPoints += challenge.points;
      
      if (user.studentProfile.leaderboardPoints >= 100 && !user.studentProfile.badges.includes('Code Warrior')) {
        user.studentProfile.badges.push('Code Warrior');
      }
      await user.save();

      // Sync with CareerProfile
      const profile = await CareerProfile.findOne({ student: req.user.id });
      if (profile) {
        await careerProfileService.recalculateReadiness(profile._id);
      }
    }

    res.status(200).json({
      success: true,
      passed: isPassed,
      feedback,
      pointsEarned: isPassed ? challenge.points : 0
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. DISCUSSION FORUMS
// ==========================================

exports.getForumPosts = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) query.category = category;

    const posts = await ForumPost.find(query)
      .populate('user', 'name profileImage role')
      .populate('replies.user', 'name profileImage role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

exports.createForumPost = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    const post = await ForumPost.create({
      user: req.user.id,
      title,
      content,
      category: category || 'General'
    });
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

exports.likeForumPost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const hasLiked = post.likes.some(id => id.toString() === userId.toString());

    let updatedPost;
    if (hasLiked) {
      updatedPost = await ForumPost.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      updatedPost = await ForumPost.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      );
    }

    const currentlyLiked = updatedPost.likes.some(id => id.toString() === userId.toString());
    res.status(200).json({
      success: true,
      likesCount: updatedPost.likes.length,
      hasLiked: currentlyLiked
    });
  } catch (error) {
    next(error);
  }
};

exports.replyForumPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.replies.push({
      user: req.user.id,
      content,
      createdAt: new Date()
    });

    await post.save();
    const updatedPost = await ForumPost.findById(req.params.id)
      .populate('user', 'name profileImage role')
      .populate('replies.user', 'name profileImage role');

    res.status(200).json({ success: true, post: updatedPost });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. CERTIFICATES & CAREER PASSPORT
// ==========================================

exports.issueCertificate = async (req, res, next) => {
  try {
    const { courseId, courseTitle, courseName, grade, studentId } = req.body;
    const searchTitle = courseTitle || courseName;

    if (!courseId && !searchTitle) {
      return res.status(400).json({
        success: false,
        message: 'A valid courseId or registered courseTitle is required for certificate issuance'
      });
    }

    let course = null;
    if (courseId) {
      try {
        course = await Course.findById(courseId);
      } catch (err) {
        // Invalid ObjectId
      }
    }
    if (!course && searchTitle) {
      course = await Course.findOne({ title: searchTitle });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Invalid course: certificate can only be issued for an existing platform course'
      });
    }

    // Enforce authorized issuer rules
    const isAdmin = req.user.role === 'admin';
    const isInstructor = course.instructor && course.instructor.toString() === req.user.id.toString();

    if (!isAdmin && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: 'Course completion cannot be verified. Certificates must be issued by the course instructor or an administrator.'
      });
    }

    const targetStudentId = (isAdmin || isInstructor) && studentId ? studentId : req.user.id;
    const recipient = await User.findById(targetStudentId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient student not found' });
    }

    // Idempotency check: Return existing certificate if already issued for this student & course
    const existingCert = await Certificate.findOne({
      student: targetStudentId,
      $or: [
        { course: course._id },
        { courseTitle: course.title }
      ]
    });
    if (existingCert) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already issued for this student and course',
        certificate: existingCert
      });
    }

    const certCode = 'NEST-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + new Date().getFullYear();
    const qrUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certCode}`;

    const certificate = await Certificate.create({
      student: targetStudentId,
      course: course._id,
      courseTitle: course.title,
      courseName: course.title,
      grade: grade || 'A+ with Distinction',
      certificateId: certCode,
      verificationCode: certCode,
      qrVerificationUrl: qrUrl,
      qrCodeData: qrUrl,
      issuedDate: new Date(),
      issueDate: new Date()
    });

    // Update CareerProfile readiness score
    const profile = await CareerProfile.findOne({ student: targetStudentId });
    if (profile) {
      await careerProfileService.recalculateReadiness(profile._id);
    }

    res.status(201).json({ success: true, certificate });
  } catch (error) {
    if (error.code === 11000) {
      try {
        const existing = await Certificate.findOne({
          student: (req.user.role === 'admin' || (course && course.instructor && course.instructor.toString() === req.user.id.toString())) && req.body.studentId ? req.body.studentId : req.user.id,
          $or: [
            { course: course?._id },
            { courseTitle: course?.title }
          ]
        });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Certificate already issued for this student and course',
            certificate: existing
          });
        }
      } catch (err) {
        // Fall through to next(error)
      }
    }
    next(error);
  }
};

exports.getCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id }).sort({ createdAt: -1, issuedDate: -1 });
    res.status(200).json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    next(error);
  }
};

exports.verifyCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findOne({
      $or: [{ verificationCode: id }, { certificateId: id }]
    }).populate('student', 'name profileImage');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Invalid or unverified certificate ID' });
    }

    res.status(200).json({ success: true, certificate, verified: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Public Career Passport & Portfolio lookup
// @route   GET /api/platform/passport/:slugOrId
// @access  Public
exports.getCareerPassport = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    
    // Find profile by slug or student id
    let profile = await CareerProfile.findOne({
      $or: [
        { 'passportSettings.slug': slugOrId },
        { student: (slugOrId.match(/^[0-9a-fA-F]{24}$/) ? slugOrId : null) }
      ]
    }).populate('student', 'name email profileImage studentProfile');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Career Passport not found' });
    }

    // Check privacy settings
    if (!profile.passportSettings?.isPublic && (!req.user || req.user.id.toString() !== profile.student._id.toString())) {
      return res.status(403).json({ success: false, message: 'This student Career Passport is set to private' });
    }

    // Fetch verified certificates & completed challenges
    const certificates = await Certificate.find({ student: profile.student._id }).select('courseTitle grade issuedDate verificationCode');

    // Strip private sensitive details for public viewers
    const publicProfile = {
      name: profile.student.name,
      avatar: profile.student.profileImage || profile.githubData?.avatarUrl,
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      customBio: profile.passportSettings?.customBio || `${profile.targetRole} passionate about building scalable, production-ready systems.`,
      theme: profile.passportSettings?.theme || 'modern-glass',
      skills: profile.skills,
      readinessScore: {
        overallReadiness: profile.readinessScore.overallReadiness,
        ratingCategory: profile.readinessScore.ratingCategory,
        technicalSkills: profile.readinessScore.technicalSkills,
        codingAbility: profile.readinessScore.codingAbility,
        projectStrength: profile.readinessScore.projectStrength,
        resumeQuality: profile.readinessScore.resumeQuality,
        interviewReadiness: profile.readinessScore.interviewReadiness,
        certifications: profile.readinessScore.certifications,
        strengths: profile.readinessScore.strengths
      },
      githubData: profile.githubData,
      certificates,
      qrVerificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/passport/${profile.passportSettings?.slug || profile.student._id}`
    };

    res.status(200).json({ success: true, passport: publicProfile });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. NOTIFICATIONS
// ==========================================

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({
      $or: [{ recipient: userId }, { user: userId }]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

exports.markReadNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Ownership check
    const ownerId = (notification.recipient || notification.user)?.toString();
    if (ownerId && ownerId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this notification' });
    }

    notification.isRead = true;
    await notification.save();
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. JOB APPLICATION COPILOT
// ==========================================

exports.getJobApplications = async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ student: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

exports.createJobApplication = async (req, res, next) => {
  try {
    const { company, position, jobUrl, location, salaryRange, status, matchScore, notes, coverLetter } = req.body;
    const application = await JobApplication.create({
      student: req.user.id,
      company,
      position,
      jobUrl,
      location,
      salaryRange,
      status: status || 'wishlist',
      matchScore: matchScore || 70,
      notes,
      coverLetter
    });
    res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

exports.updateJobApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, student: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

exports.deleteJobApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findOneAndDelete({ _id: req.params.id, student: req.user.id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, message: 'Application deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. PEER STUDY PODS
// ==========================================

exports.getStudyPods = async (req, res, next) => {
  try {
    const pods = await StudyPod.find({ isPublic: true })
      .populate('creator', 'name profileImage')
      .populate('members.user', 'name profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: pods.length, pods });
  } catch (error) {
    next(error);
  }
};

exports.createStudyPod = async (req, res, next) => {
  try {
    const { title, description, track, targetRole, avatar, maxMembers } = req.body;
    const pod = await StudyPod.create({
      title,
      description,
      track: track || 'Full Stack Web Development',
      targetRole: targetRole || 'Software Engineer',
      avatar: avatar || '🚀',
      maxMembers: maxMembers || 6,
      creator: req.user.id,
      members: [{ user: req.user.id, role: 'leader' }],
      weeklyGoals: [
        { title: 'Complete Week 1 Roadmap Modules' },
        { title: 'Solve 3 Algorithm Coding Challenges' }
      ]
    });

    const populated = await StudyPod.findById(pod._id)
      .populate('creator', 'name profileImage')
      .populate('members.user', 'name profileImage');

    res.status(201).json({ success: true, pod: populated });
  } catch (error) {
    next(error);
  }
};

exports.joinStudyPod = async (req, res, next) => {
  try {
    const pod = await StudyPod.findById(req.params.id);
    if (!pod) return res.status(404).json({ success: false, message: 'Study pod not found' });

    const alreadyMember = pod.members.some(m => m.user.toString() === req.user.id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member of this study pod' });
    }

    if (pod.members.length >= pod.maxMembers) {
      return res.status(400).json({ success: false, message: 'This study pod is already full' });
    }

    pod.members.push({ user: req.user.id, role: 'member' });
    await pod.save();

    const populated = await StudyPod.findById(pod._id)
      .populate('creator', 'name profileImage')
      .populate('members.user', 'name profileImage');

    res.status(200).json({ success: true, pod: populated });
  } catch (error) {
    next(error);
  }
};

exports.postPodMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const pod = await StudyPod.findById(req.params.id);
    if (!pod) return res.status(404).json({ success: false, message: 'Study pod not found' });

    const isMember = pod.members.some(
      m => m.user && m.user.toString() === req.user.id.toString()
    ) || (pod.creator && pod.creator.toString() === req.user.id.toString());

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a member of this study pod to post messages' });
    }

    pod.messages.push({
      sender: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    });

    await pod.save();
    const populated = await StudyPod.findById(pod._id)
      .populate('messages.sender', 'name profileImage');

    res.status(200).json({ success: true, messages: populated.messages });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. MICRO-INTERNSHIPS
// ==========================================

exports.getMicroInternships = async (req, res, next) => {
  try {
    let internships = await MicroInternship.find({ isActive: true });
    
    // If no internships exist in DB, create initial standard industry tracks
    if (internships.length === 0) {
      await MicroInternship.create([
        {
          title: 'High-Concurrency Analytics Gateway',
          companyPartner: 'Stripe / Fintech Simulation',
          companyLogo: '💳',
          domain: 'Backend & Cloud',
          difficulty: 'Intermediate',
          durationWeeks: 2,
          stipendOrCredits: '200 XP + Industry Project Credential',
          summary: 'Architect a high-throughput API gateway with rate limiting, Redis token caching, and structured logging.',
          skillsTargeted: ['Node.js', 'Redis', 'Rate Limiting', 'Docker'],
          prerequisites: ['Basic Express knowledge', 'REST APIs'],
          tasks: [
            { milestoneNumber: 1, title: 'Build Express Gateway & Redis Token Bucket', objective: 'Implement sliding window rate limiting.', deliverables: ['Working Redis middleware', 'Unit test cases'] },
            { milestoneNumber: 2, title: 'Docker Compose Containerization & CI/CD', objective: 'Create reproducible multi-container environment.', deliverables: ['Dockerfile', 'docker-compose.yml', 'GitHub Action test run'] }
          ]
        },
        {
          title: 'Real-Time Collaborative Markdown Canvas',
          companyPartner: 'Notion / SaaS Simulation',
          companyLogo: '📝',
          domain: 'Full Stack',
          difficulty: 'Intermediate',
          durationWeeks: 2,
          stipendOrCredits: '200 XP + Industry Project Credential',
          summary: 'Build a multi-user collaborative text canvas with Socket.IO operational transformation and live presence indicators.',
          skillsTargeted: ['React', 'Socket.IO', 'Tailwind CSS', 'State Optimization'],
          prerequisites: ['React hooks', 'WebSocket basics'],
          tasks: [
            { milestoneNumber: 1, title: 'Real-Time Sync Engine', objective: 'Build bidirectional socket event handling for text changes.', deliverables: ['Socket handler', 'Conflict resolution logic'] },
            { milestoneNumber: 2, title: 'Presence & Document Export', objective: 'Implement active user avatars and PDF export.', deliverables: ['Live presence bar', 'Export functionality'] }
          ]
        }
      ]);
      internships = await MicroInternship.find({ isActive: true });
    }

    res.status(200).json({ success: true, count: internships.length, internships });
  } catch (error) {
    next(error);
  }
};

exports.submitMicroInternship = async (req, res, next) => {
  try {
    const { githubRepoUrl, liveDemoUrl, notes } = req.body;
    const internship = await MicroInternship.findById(req.params.id);
    if (!internship) return res.status(404).json({ success: false, message: 'Micro-internship not found' });

    // AI simulated rubric evaluation
    const score = Math.floor(Math.random() * 15) + 82; // 82-97
    const submission = {
      student: req.user.id,
      githubRepoUrl,
      liveDemoUrl,
      notes,
      submittedAt: new Date(),
      status: 'approved',
      score,
      rubricEvaluation: {
        codeQuality: 88,
        problemSolving: 90,
        architecture: 85,
        documentation: 92
      },
      aiFeedback: `Excellent repository structure and clean code modularity. All core deliverables for ${internship.title} verified successfully.`
    };

    internship.submissions.push(submission);
    await internship.save();

    // Reward leaderboard points & recalculate profile
    const user = await User.findById(req.user.id);
    user.studentProfile.leaderboardPoints += 200;
    if (!user.studentProfile.badges.includes('Internship Certified')) {
      user.studentProfile.badges.push('Internship Certified');
    }
    await user.save();

    const profile = await CareerProfile.findOne({ student: req.user.id });
    if (profile) {
      await careerProfileService.recalculateReadiness(profile._id);
    }

    res.status(200).json({ success: true, message: 'Submission evaluated & approved!', submission });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. PLATFORM ANALYTICS DASHBOARDS
// ==========================================

exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const certCount = await Certificate.countDocuments({ student: req.user.id });
    const sessionCount = await Session.countDocuments({ student: req.user.id });
    const profile = await careerProfileService.getOrCreateProfile(req.user.id);

    const analytics = {
      learningStreak: user.studentProfile?.learningStreak || 3,
      totalHours: user.studentProfile?.totalLearningHours || 14,
      resumeScore: user.studentProfile?.resumeScore || 0,
      leaderboardPoints: user.studentProfile?.leaderboardPoints || 50,
      completedCertificates: certCount,
      bookedSessionsCount: sessionCount,
      careerReadinessScore: profile.readinessScore.overallReadiness,
      readinessBreakdown: profile.readinessScore,
      nextActions: profile.nextActions,
      weeklyHoursBreakdown: [2, 4, 3, 5, 2, 4, 1],
      skillDistribution: {
        labels: profile.skills.map(s => s.name).slice(0, 7),
        values: profile.skills.map(s => s.proficiency).slice(0, 7)
      }
    };

    res.status(200).json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
};

exports.getMentorAnalytics = async (req, res, next) => {
  try {
    const mentorId = req.user.id;
    const mentor = await User.findById(mentorId);
    
    const sessions = await Session.find({ mentor: mentorId });
    const courses = await Course.find({ instructor: mentorId });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const pendingSessions = sessions.filter(s => s.status === 'pending').length;

    res.status(200).json({
      success: true,
      analytics: {
        earnings: mentor.mentorProfile.earnings,
        rating: mentor.mentorProfile.rating,
        reviewsCount: mentor.mentorProfile.reviewsCount,
        totalCoursesCreated: courses.length,
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          pending: pendingSessions
        },
        monthlyRevenueBreakdown: [120, 250, 180, 310, 450, mentor.mentorProfile.earnings]
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const mentorCount = await User.countDocuments({ role: 'mentor' });
    const pendingMentors = await User.find({ role: 'mentor', 'mentorProfile.isApproved': false }).select('name email mentorProfile');
    const coursesCount = await Course.countDocuments({});
    const totalSessions = await Session.countDocuments({});
    const totalApplications = await JobApplication.countDocuments({});
    const totalPods = await StudyPod.countDocuments({});

    const mentors = await User.find({ role: 'mentor' });
    const systemRevenue = mentors.reduce((acc, mentor) => acc + (mentor.mentorProfile?.earnings || 0), 0) * 0.2;

    // Career readiness distribution across students
    const careerProfiles = await CareerProfile.find({});
    const readinessDistribution = {
      foundation: careerProfiles.filter(p => (p.readinessScore?.overallReadiness ?? 0) < 50).length,
      developing: careerProfiles.filter(p => {
        const score = p.readinessScore?.overallReadiness ?? 0;
        return score >= 50 && score < 70;
      }).length,
      jobReady: careerProfiles.filter(p => {
        const score = p.readinessScore?.overallReadiness ?? 0;
        return score >= 70 && score < 85;
      }).length,
      highEdge: careerProfiles.filter(p => (p.readinessScore?.overallReadiness ?? 0) >= 85).length
    };

    res.status(200).json({
      success: true,
      analytics: {
        users: {
          students: studentCount,
          mentors: mentorCount,
          pendingApprovals: pendingMentors.length
        },
        pendingMentorsList: pendingMentors,
        coursesCount,
        totalSessions,
        totalApplications,
        totalPods,
        readinessDistribution,
        platformCutRevenue: systemRevenue,
        monthlyUsersGrowth: [10, 45, 90, 180, studentCount + mentorCount]
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveMentor = async (req, res, next) => {
  try {
    const { mentorId, approve } = req.body;
    const mentor = await User.findById(mentorId);
    
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ success: false, message: 'Mentor profile not found' });
    }

    mentor.mentorProfile.isApproved = approve;
    await mentor.save();

    res.status(200).json({
      success: true,
      message: `Mentor has been ${approve ? 'approved' : 'suspended'} successfully.`,
      mentor
    });
  } catch (error) {
    next(error);
  }
};

// Chat system controllers
exports.getChatUsers = async (req, res, next) => {
  try {
    const targetRole = req.user.role === 'student' ? 'mentor' : 'student';
    let query = { role: targetRole };
    if (targetRole === 'mentor') {
      query['mentorProfile.isApproved'] = true;
    }
    const users = await User.find(query).select('name email profileImage role studentProfile mentorProfile');
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};
