const mongoose = require('mongoose');

const SkillItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'AI/ML', 'Cloud', 'Mobile', 'Soft Skills', 'Other'],
    default: 'Other' 
  },
  proficiency: { type: Number, min: 0, max: 100, default: 50 },
  verifiedBy: [{ type: String, enum: ['self', 'quiz', 'challenge', 'github', 'mentor', 'certificate'] }],
  lastAssessed: { type: Date, default: Date.now }
}, { _id: false });

const NextActionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['course', 'quiz', 'coding', 'interview', 'resume', 'mentor', 'github', 'job'],
    default: 'course' 
  },
  link: { type: String, default: '/courses' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  reason: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const CareerProfileSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  targetRole: {
    type: String,
    default: 'Full Stack Software Engineer',
    trim: true
  },
  targetCompanies: [{ type: String, trim: true }],
  targetIndustry: { type: String, default: 'Technology & SaaS' },
  experienceLevel: { 
    type: String, 
    enum: ['Student/Fresher', 'Entry-Level (0-1 yr)', 'Associate (1-3 yrs)', 'Mid-Level (3-5 yrs)'],
    default: 'Student/Fresher' 
  },
  preferredWorkMode: {
    type: String,
    enum: ['Remote', 'Hybrid', 'On-Site', 'Any'],
    default: 'Any'
  },
  
  // Skills Graph
  skills: [SkillItemSchema],

  // 7-Factor Career Readiness Score Breakdown
  readinessScore: {
    overallReadiness: { type: Number, min: 0, max: 100, default: 45 },
    technicalSkills: { type: Number, min: 0, max: 100, default: 40 },
    codingAbility: { type: Number, min: 0, max: 100, default: 35 },
    projectStrength: { type: Number, min: 0, max: 100, default: 40 },
    resumeQuality: { type: Number, min: 0, max: 100, default: 50 },
    interviewReadiness: { type: Number, min: 0, max: 100, default: 40 },
    communication: { type: Number, min: 0, max: 100, default: 60 },
    certifications: { type: Number, min: 0, max: 100, default: 30 },
    ratingCategory: { 
      type: String, 
      enum: ['Foundation Phase', 'Developing Competency', 'Job Ready', 'High Competitive Edge'],
      default: 'Foundation Phase' 
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    criticalGaps: [{ type: String }],
    scoringRationale: { type: String, default: 'Initial profile evaluation based on enrolled track.' },
    lastCalculated: { type: Date, default: Date.now }
  },

  // Job Match & Analysis History
  jobMatchHistory: [{
    jobTitle: { type: String, required: true },
    company: { type: String, default: 'Target Company' },
    matchScore: { type: Number, required: true },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    analyzedAt: { type: Date, default: Date.now }
  }],

  // Actionable To-Do List Engine
  nextActions: [NextActionSchema],

  // GitHub Intelligence Sync
  githubData: {
    username: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    topLanguages: [{ language: String, count: Number }],
    projectComplexityScore: { type: Number, default: 0 }, // 0-100
    topRepositories: [{
      name: String,
      description: String,
      language: String,
      stars: Number,
      forks: Number,
      url: String,
      hasReadme: Boolean
    }],
    lastSynced: { type: Date, default: null }
  },

  // Public Career Passport & Portfolio Settings
  passportSettings: {
    isPublic: { type: Boolean, default: true },
    slug: { type: String, unique: true, sparse: true },
    customBio: { type: String, default: '' },
    featuredProjects: [{ type: String }],
    theme: { type: String, enum: ['modern-glass', 'minimal-dark', 'cyber-indigo', 'clean-slate'], default: 'modern-glass' },
    showContactInfo: { type: Boolean, default: false },
    showGpa: { type: Boolean, default: false }
  },

  // Voice Interview & Performance Log
  interviewEvaluations: [{
    technology: String,
    role: String,
    difficulty: String,
    overallScore: Number,
    technicalScore: Number,
    structureScore: Number,
    clarityScore: Number,
    confidenceScore: Number,
    feedback: String,
    improvements: [String],
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('CareerProfile', CareerProfileSchema);
