const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendMail } = require('../config/mailer');
const { uploadToCloudinary } = require('../config/cloudinary');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforauthentication123!', {
    expiresIn: '1d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeyforauthentication456!', {
    expiresIn: '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      otp,
      otpExpires
    });

    // Send OTP Email
    const mailInfo = await sendMail({
      to: user.email,
      subject: 'Verify your AI Mentor Account',
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `<h3>Account Verification</h3><p>Your OTP code is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to your email.',
      ...(mailInfo && mailInfo.mock ? { devOtp: otp } : {})
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP / Email
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        studentProfile: user.studentProfile,
        mentorProfile: user.mentorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const mailInfo = await sendMail({
      to: user.email,
      subject: 'Verify your AI Mentor Account (Resend)',
      text: `Your new OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `<h3>Account Verification</h3><p>Your new OTP code is: <b>${otp}</b></p>`
    });

    res.status(200).json({
      success: true,
      message: 'New OTP sent to email',
      ...(mailInfo && mailInfo.mock ? { devOtp: otp } : {})
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify email first.',
        isVerified: false
      });
    }

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    
    // Update learning streak if student
    if (user.role === 'student') {
      const today = new Date().toDateString();
      const lastActive = user.studentProfile.lastActiveDate ? user.studentProfile.lastActiveDate.toDateString() : '';
      
      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toDateString()) {
          user.studentProfile.learningStreak += 1;
        } else if (lastActive !== today) {
          user.studentProfile.learningStreak = 1;
        }
        user.studentProfile.lastActiveDate = new Date();
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        studentProfile: user.studentProfile,
        mentorProfile: user.mentorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeyforauthentication456!');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired, login again' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendMail({
      to: user.email,
      subject: 'Reset your AI Mentor Account Password',
      text: `Use this OTP to reset your password: ${otp}. It expires in 10 minutes.`,
      html: `<h3>Reset Password Request</h3><p>Your OTP to reset password is: <b>${otp}</b></p>`
    });

    res.status(200).json({ success: true, message: 'Password reset OTP sent to email' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. Log in now.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, studentProfile, mentorProfile } = req.body;

    if (name) user.name = name;

    // Handle Profile Image Upload
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file, 'profiles');
      user.profileImage = uploadResult.url;
    }

    // Handle student profiles properties updates
    if (user.role === 'student' && studentProfile) {
      const parsedProfile = typeof studentProfile === 'string' ? JSON.parse(studentProfile) : studentProfile;
      user.studentProfile = {
        ...user.studentProfile.toObject(),
        ...parsedProfile
      };
    }

    // Handle mentor profile properties updates
    if (user.role === 'mentor' && mentorProfile) {
      const parsedProfile = typeof mentorProfile === 'string' ? JSON.parse(mentorProfile) : mentorProfile;
      user.mentorProfile = {
        ...user.mentorProfile.toObject(),
        ...parsedProfile
      };
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
