const mongoose = require('mongoose');

const StudyPodSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Pod title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  track: {
    type: String,
    required: true,
    default: 'Full Stack Web Development'
  },
  targetRole: {
    type: String,
    default: 'Software Engineer'
  },
  avatar: {
    type: String,
    default: '🚀'
  },
  maxMembers: {
    type: Number,
    default: 6
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['leader', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    contributionPoints: { type: Number, default: 0 }
  }],
  weeklyGoals: [{
    title: { type: String, required: true },
    targetDate: { type: Date },
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    attachments: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyPod', StudyPodSchema);
