const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const CareerProfile = require('../models/CareerProfile');
const { sendRealTimeNotification } = require('../config/socket');
const { sendMail } = require('../config/mailer');
const aiService = require('../services/gemini');

// @desc    Get all approved mentors with AI compatibility match calculations
// @route   GET /api/mentors
// @access  Public / Authenticated
exports.getMentors = async (req, res, next) => {
  try {
    const { expertise, search } = req.query;
    let query = { role: 'mentor', 'mentorProfile.isApproved': true };

    if (expertise) {
      query['mentorProfile.expertise'] = { $in: [expertise] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'mentorProfile.bio': { $regex: search, $options: 'i' } }
      ];
    }

    let mentors = await User.find(query).select('-password -refreshToken').lean();

    // If user is authenticated as student, compute AI compatibility scores
    if (req.user && req.user.role === 'student') {
      const profile = await CareerProfile.findOne({ student: req.user.id }).lean();
      const studentProfile = profile || { targetRole: req.user.studentProfile?.careerGoal || 'Software Engineer', skills: req.user.studentProfile?.skills || [] };

      mentors = mentors.map(m => {
        const matchData = aiService.calculateMentorMatch(m, studentProfile);
        return {
          ...m,
          aiMatchScore: matchData.matchScore,
          aiMatchReason: matchData.matchReason
        };
      });

      // Sort by match score descending
      mentors.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
    }

    res.status(200).json({ success: true, count: mentors.length, mentors });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a mentorship session
// @route   POST /api/mentors/book
// @access  Private
exports.bookSession = async (req, res, next) => {
  try {
    const { mentorId, date, time, notes } = req.body;

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const session = await Session.create({
      mentor: mentorId,
      student: req.user.id,
      date,
      time,
      notes,
      status: 'pending'
    });

    // Notify mentor in real-time
    sendRealTimeNotification(mentorId, {
      title: 'New Session Booking Request',
      message: `${req.user.name} has requested a session on ${new Date(date).toDateString()} at ${time}`,
      type: 'booking'
    });

    // Send email notification to mentor
    await sendMail({
      to: mentor.email,
      subject: 'New Mentorship Session Requested',
      text: `${req.user.name} has requested a mentorship booking on ${new Date(date).toDateString()} at ${time}. Log in to review it.`,
      html: `<h3>Session Request</h3><p><b>Student:</b> ${req.user.name}</p><p><b>Time:</b> ${new Date(date).toDateString()} at ${time}</p><p><b>Notes:</b> ${notes}</p>`
    });

    res.status(201).json({ success: true, message: 'Booking request sent successfully', session });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's sessions (Student or Mentor)
// @route   GET /api/mentors/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'mentor') {
      query.mentor = req.user.id;
    }

    const sessions = await Session.find(query)
      .populate('mentor', 'name email profileImage mentorProfile')
      .populate('student', 'name email profileImage studentProfile')
      .sort({ date: 1 });

    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session status (Approve, Reject, Reschedule, Complete)
// @route   PUT /api/mentors/sessions/:id
// @access  Private (Mentor or Student)
exports.updateSessionStatus = async (req, res, next) => {
  try {
    const { status, meetingLink, notes, date, time } = req.body;
    const session = await Session.findById(req.params.id)
      .populate('mentor', 'name email')
      .populate('student', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const mentorId = (session.mentor && session.mentor._id) ? session.mentor._id.toString() : session.mentor.toString();
    const studentId = (session.student && session.student._id) ? session.student._id.toString() : session.student.toString();
    const userId = req.user.id.toString();
    const isMentor = userId === mentorId;
    const isStudent = userId === studentId;
    const isAdmin = req.user.role === 'admin';

    // Strict resource ownership check (BOLA prevention)
    if (!isMentor && !isStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this mentorship session'
      });
    }

    // Role-specific action constraints
    if (isStudent && !isMentor && !isAdmin) {
      if (status === 'approved' || status === 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned mentor or an administrator can approve or complete sessions'
        });
      }
    }

    if (status) session.status = status;
    if (meetingLink && (isMentor || isAdmin)) session.meetingLink = meetingLink;
    if (notes) session.notes = notes;
    if (date) session.date = date;
    if (time) session.time = time;

    // Auto-generate video link on approval if not provided
    if (status === 'approved' && !session.meetingLink) {
      session.meetingLink = `/mentorship-room/${session._id}`;
    }

    // Track earnings if session completed
    if (status === 'completed' && (isMentor || req.user.role === 'mentor')) {
      const mentorUser = await User.findById(mentorId);
      if (mentorUser && mentorUser.mentorProfile) {
        mentorUser.mentorProfile.earnings = (mentorUser.mentorProfile.earnings || 0) + 50;
        await mentorUser.save();
      }
    }

    await session.save();

    // Notify student/mentor
    const recipientId = isMentor ? studentId : mentorId;
    const targetName = isMentor ? (session.student?.name || 'Student') : (session.mentor?.name || 'Mentor');
    const targetEmail = isMentor ? (session.student?.email || '') : (session.mentor?.email || '');

    sendRealTimeNotification(recipientId, {
      title: `Session ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your mentorship session has been updated to: ${status}.`,
      type: 'booking'
    });

    if (targetEmail) {
      await sendMail({
        to: targetEmail,
        subject: `Mentorship Session Update: ${status.toUpperCase()}`,
        text: `Hello ${targetName}, your scheduled session with ${req.user.name} was updated to status: ${status}. Meeting: ${session.meetingLink || 'N/A'}. Date: ${new Date(session.date).toDateString()}, Time: ${session.time}.`,
        html: `<h3>Session Update Notification</h3><p><b>Status:</b> ${status.toUpperCase()}</p><p><b>With:</b> ${req.user.name}</p><p><b>Scheduled Date:</b> ${new Date(session.date).toDateString()}</p><p><b>Scheduled Time:</b> ${session.time}</p><p><b>Meeting Link:</b> <a href="${session.meetingLink}">${session.meetingLink || 'N/A'}</a></p>`
      });
    }

    res.status(200).json({ success: true, message: `Session status updated to ${status}`, session });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate/review completed session
// @route   POST /api/mentors/sessions/:id/review
// @access  Private (Student only)
exports.rateSession = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.student.toString() !== req.user.id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to rate this session' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed sessions' });
    }

    session.rating = rating;
    session.review = review;
    await session.save();

    // Re-calculate mentor averages
    const mentor = await User.findById(session.mentor);
    const allMentorSessions = await Session.find({ mentor: mentor._id, rating: { $ne: null } });
    
    mentor.mentorProfile.reviewsCount = allMentorSessions.length;
    mentor.mentorProfile.rating = allMentorSessions.reduce((acc, item) => item.rating + acc, 0) / allMentorSessions.length;
    
    await mentor.save();

    res.status(200).json({ success: true, message: 'Mentor review saved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single session details and verify authorization for room access
// @route   GET /api/mentors/sessions/:id
// @access  Private (Assigned Mentor, Student, or Admin)
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Mentorship session not found' });
    }

    const session = await Session.findById(id)
      .populate('mentor', 'name email profileImage mentorProfile')
      .populate('student', 'name email profileImage studentProfile');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Mentorship session not found' });
    }

    const mentorId = (session.mentor && session.mentor._id) ? session.mentor._id.toString() : session.mentor.toString();
    const studentId = (session.student && session.student._id) ? session.student._id.toString() : session.student.toString();
    const userId = req.user.id.toString();

    const isMentor = userId === mentorId;
    const isStudent = userId === studentId;
    const isAdmin = req.user.role === 'admin';

    // Strict ownership verification (BOLA prevention)
    if (!isMentor && !isStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this mentorship session room'
      });
    }

    if (session.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'This mentorship session request was rejected and cannot be joined.',
        status: session.status
      });
    }

    if (session.status === 'completed') {
      return res.status(410).json({
        success: false,
        message: 'This mentorship session has already been completed.',
        status: session.status
      });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

