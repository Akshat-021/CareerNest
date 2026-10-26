const mongoose = require('mongoose');

const CommunityMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const JoinRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    default: '',
    maxlength: 500
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
});

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    minlength: [3, 'Community name must be at least 3 characters'],
    maxlength: [80, 'Community name cannot exceed 80 characters']
  },
  slug: {
    type: String,
    required: [true, 'Community slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric words separated by hyphens']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Engineering', 'Data & AI', 'Design', 'Product', 'Career & Placements', 'General'],
    default: 'General'
  },
  avatar: {
    type: String,
    default: '🌐'
  },
  coverImage: {
    type: String,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isMentorLed: {
    type: Boolean,
    default: false
  },
  members: [CommunityMemberSchema],
  joinRequests: [JoinRequestSchema],
  rules: [{
    type: String,
    maxlength: 300
  }],
  memberCount: {
    type: Number,
    default: 1
  },
  postCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for high performance lookup, category filtering, and membership checks
CommunitySchema.index({ category: 1 });
CommunitySchema.index({ isPrivate: 1 });
CommunitySchema.index({ 'members.user': 1 });
CommunitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Community', CommunitySchema);
