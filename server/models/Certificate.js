const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    sparse: true,
    unique: true
  },
  verificationCode: {
    type: String,
    sparse: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
    index: true
  },
  courseName: {
    type: String
  },
  courseTitle: {
    type: String
  },
  grade: {
    type: String,
    default: 'A+ with Distinction'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  qrCodeData: {
    type: String
  },
  qrVerificationUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Enforce per-course issuance uniqueness across student and course for valid course-linked certificates
CertificateSchema.index(
  { student: 1, course: 1 },
  {
    unique: true,
    name: 'unique_student_course_partial',
    partialFilterExpression: {
      course: { $type: 'objectId' }
    }
  }
);

// Harmonize field aliases prior to validation so that both legacy and current shapes succeed
CertificateSchema.pre('validate', function(next) {
  // Sync ID/Code
  const idValue = this.certificateId || this.verificationCode;
  if (idValue) {
    if (!this.certificateId) this.certificateId = idValue;
    if (!this.verificationCode) this.verificationCode = idValue;
  }

  // Sync Course title/name
  const titleValue = this.courseName || this.courseTitle || 'CareerNest Certified Program';
  this.courseName = titleValue;
  this.courseTitle = titleValue;

  // Sync QR URL/Data
  const qrValue = this.qrCodeData || this.qrVerificationUrl || (idValue ? `https://careernest.app/verify-certificate/${idValue}` : '');
  this.qrCodeData = qrValue;
  this.qrVerificationUrl = qrValue;

  // Sync Date
  const dateValue = this.issueDate || this.issuedDate || new Date();
  this.issueDate = dateValue;
  this.issuedDate = dateValue;

  next();
});

module.exports = mongoose.model('Certificate', CertificateSchema);
