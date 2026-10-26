const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community reference is required'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author reference is required'],
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: ''
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [5000, 'Post content cannot exceed 5000 characters']
  },
  attachments: [{
    type: String
  }],
  parentPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
    default: null,
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for feed retrieval and threaded replies
CommunityPostSchema.index({ community: 1, parentPost: 1, createdAt: -1 });
CommunityPostSchema.index({ community: 1, isPinned: -1, createdAt: -1 });
CommunityPostSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
