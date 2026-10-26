const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter reference is required'],
    index: true
  },
  targetType: {
    type: String,
    enum: ['Community', 'CommunityPost', 'User'],
    required: [true, 'Target type is required']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Target ID is required'],
    index: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
    index: true
  },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate_content', 'hate_speech', 'misinformation', 'other'],
    required: [true, 'Reason is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  moderationAction: {
    type: String,
    enum: ['none', 'content_removed', 'member_warned', 'member_banned', 'dismissed'],
    default: 'none'
  },
  moderationNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

ReportSchema.index({ community: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
