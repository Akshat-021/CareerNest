const mongoose = require('mongoose');

const MicroInternshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  companyPartner: {
    type: String,
    default: 'Aura Enterprise Labs'
  },
  companyLogo: {
    type: String,
    default: '⚡'
  },
  domain: {
    type: String,
    enum: ['Full Stack', 'Frontend', 'Backend & Cloud', 'AI/ML & Data', 'DevOps & SRE', 'Cybersecurity'],
    default: 'Full Stack'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  durationWeeks: {
    type: Number,
    default: 2
  },
  stipendOrCredits: {
    type: String,
    default: '150 Career XP + Certificate'
  },
  summary: {
    type: String,
    required: true
  },
  skillsTargeted: [{ type: String }],
  prerequisites: [{ type: String }],
  tasks: [{
    milestoneNumber: Number,
    title: String,
    objective: String,
    deliverables: [String],
    rubricCriteria: [String]
  }],
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    githubRepoUrl: { type: String, required: true },
    liveDemoUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'evaluating', 'approved', 'revisions_requested'], default: 'submitted' },
    score: { type: Number, min: 0, max: 100, default: 0 },
    rubricEvaluation: {
      codeQuality: Number,
      problemSolving: Number,
      architecture: Number,
      documentation: Number
    },
    aiFeedback: { type: String, default: '' }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MicroInternship', MicroInternshipSchema);
