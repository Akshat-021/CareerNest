const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  track: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: '8-12 weeks'
  },
  difficulty: {
    type: String,
    default: 'Beginner'
  },
  modules: [{
    title: { type: String, required: true },
    timeline: { type: String },
    topics: [{ type: String }],
    projects: [{ type: String }],
    resources: [{ type: String }],
    milestones: [{ type: String }],
    weeklyTasks: [{ type: String }],
    mockInterviews: [{ type: String }],
    practiceProblems: [{ type: String }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
