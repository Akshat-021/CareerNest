const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'booking', 'chat', 'streak', 'course', 'system'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Synchronize user and recipient fields so queries matching either succeed seamlessly
NotificationSchema.pre('validate', function(next) {
  const targetUser = this.user || this.recipient;
  if (targetUser) {
    if (!this.user) this.user = targetUser;
    if (!this.recipient) this.recipient = targetUser;
  }
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
