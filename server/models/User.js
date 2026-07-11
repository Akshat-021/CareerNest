const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Exclude from queries by default for security
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: ''
  },
  
  // Student Profile fields
  studentProfile: {
    cgpa: { type: Number, default: 0 },
    branch: { type: String, default: '' },
    semester: { type: Number, default: 1 },
    skills: { type: [String], default: [] },
    learningStyle: { type: String, default: 'Visual' },
    careerGoal: { type: String, default: 'Full Stack Developer' },
    preferredTechnology: { type: String, default: 'React' },
    studyHours: { type: Number, default: 2 },
    budget: { type: Number, default: 0 },
    placementTarget: { type: String, default: 'Product-based' },
    learningStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    totalLearningHours: { type: Number, default: 0 },
    weeklyGoalHours: { type: Number, default: 10 },
    badges: { type: [String], default: [] },
    leaderboardPoints: { type: Number, default: 0 },
    resumeUrl: { type: String, default: '' },
    resumeScore: { type: Number, default: 0 }
  },

  // Mentor Profile fields
  mentorProfile: {
    expertise: { type: [String], default: [] },
    bio: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    certificationUrl: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
    earnings: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    reviewsCount: { type: Number, default: 0 },
    availableSlots: [{
      day: { type: String }, // e.g. "Monday", "Wednesday"
      time: { type: String } // e.g. "14:00 - 15:00"
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
