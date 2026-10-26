const mongoose = require('mongoose');

const CourseEnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed'],
    default: 'enrolled'
  },
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedModules: [
    {
      module: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  completedProjects: [
    {
      project: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    default: null
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure a student can only have one active enrollment per course
CourseEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseEnrollment', CourseEnrollmentSchema);
