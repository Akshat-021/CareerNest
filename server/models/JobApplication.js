const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Job position is required'],
    trim: true
  },
  jobUrl: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'Remote'
  },
  salaryRange: {
    type: String,
    default: 'Not specified'
  },
  status: {
    type: String,
    enum: ['wishlist', 'applied', 'interviewing', 'offered', 'rejected'],
    default: 'wishlist'
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  followUpDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  coverLetter: {
    type: String,
    default: ''
  },
  interviewPrepNotes: [{
    question: String,
    recommendedAnswer: String
  }],
  stages: [{
    name: { type: String, required: true }, // e.g., 'Initial Screening', 'Technical Round 1', 'System Design'
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['scheduled', 'completed', 'passed', 'failed'], default: 'scheduled' },
    notes: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
