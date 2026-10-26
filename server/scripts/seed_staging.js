/**
 * CareerNest Staging Environment Synthetic Seed Script
 * STRICT ISOLATION SAFEGUARDS:
 * - Only seeds synthetic non-PII test accounts into the dedicated staging DB.
 * - Refuses execution if MONGO_URI points to production or Atlas.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const Community = require('../models/Community');
const ForumPost = require('../models/Forum');
const CareerProfile = require('../models/CareerProfile');

const STAGING_URI = process.env.STAGING_MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-staging';

async function seedStaging() {
  // Guard check: Reject non-staging or remote URIs
  if (STAGING_URI.includes('mongodb.net') || process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ABORT: seed_staging cannot be executed against production or Atlas clusters.');
    process.exit(1);
  }

  console.log('[Staging Seed] Connecting to isolated staging database...');
  await mongoose.connect(STAGING_URI);
  console.log('[Staging Seed] Connected successfully. Preparing synthetic records...');

  // Clear staging collections safely
  await User.deleteMany({});
  await Course.deleteMany({});
  await Community.deleteMany({});
  await ForumPost.deleteMany({});
  await CareerProfile.deleteMany({});

  // 1. Synthetic Student
  const student = await User.create({
    name: 'Synthetic Staging Student',
    email: 'student.staging@careernest.org',
    password: 'StagingTestPass123!',
    role: 'student',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  });

  // 2. Synthetic Approved Mentor
  const mentor = await User.create({
    name: 'Synthetic Staging Mentor',
    email: 'mentor.staging@careernest.org',
    password: 'StagingTestPass123!',
    role: 'mentor',
    isVerified: true,
    mentorProfile: {
      title: 'Principal Systems Architect',
      company: 'Staging Labs Tech',
      bio: 'Synthetic mentor verifying staging infrastructure and booking workflows.',
      skills: ['Distributed Systems', 'Node.js', 'System Design'],
      hourlyRate: 75,
      isApproved: true
    }
  });

  // 3. Synthetic Administrator
  const admin = await User.create({
    name: 'Synthetic Staging Admin',
    email: 'admin.staging@careernest.org',
    password: 'StagingTestPass123!',
    role: 'admin',
    isVerified: true
  });

  // 4. Synthetic Course
  const course = await Course.create({
    title: 'Cloud Native Microservices Architecture',
    description: 'A comprehensive curriculum on resilient microservices, containers, and serverless architectures.',
    category: 'Cloud Engineering',
    instructor: mentor._id,
    difficulty: 'Medium',
    duration: '4 weeks',
    prerequisites: ['Docker', 'JavaScript'],
    modules: [
      {
        title: 'Module 1: Domain-Driven Service Decomposition',
        description: 'Decompose monolithic architectures into isolated domain microservices.',
        duration: '45 mins',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      },
      {
        title: 'Module 2: Resilient Event-Driven Messaging',
        description: 'Implement message brokers, outbox patterns, and idempotency.',
        duration: '60 mins',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      }
    ],
    projects: [
      {
        title: 'Capstone: High-Throughput Notification Engine',
        description: 'Build a distributed notification system with dead-letter queue recovery.',
        difficulty: 'Medium'
      }
    ]
  });

  // 5. Synthetic Community
  const community = await Community.create({
    name: 'Staging Cloud Engineers',
    slug: 'staging-cloud-engineers',
    description: 'Dedicated synthetic community for testing discussions, moderation, and approvals.',
    category: 'Engineering',
    creator: mentor._id,
    isMentorLed: true,
    isPrivate: false,
    members: [
      { user: mentor._id, role: 'owner' },
      { user: student._id, role: 'member' }
    ]
  });

  // 6. Synthetic CareerProfile
  await CareerProfile.create({
    student: student._id,
    targetRole: 'Full-Stack Cloud Engineer',
    currentSkills: [
      { name: 'JavaScript', level: 'Intermediate', verified: true },
      { name: 'Node.js', level: 'Intermediate', verified: true }
    ],
    skillGaps: [
      { skill: 'Kubernetes', priority: 'High', recommendedCourses: ['Cloud Native Microservices Architecture'] }
    ],
    readinessScore: 65,
    milestones: []
  });

  console.log('[Staging Seed] Successfully seeded:');
  console.log(' - Synthetic Student: student.staging@careernest.test');
  console.log(' - Synthetic Mentor:  mentor.staging@careernest.test');
  console.log(' - Synthetic Admin:   admin.staging@careernest.test');
  console.log(' - Synthetic Course:  Cloud Native Microservices Architecture');
  console.log(' - Synthetic Community: Staging Cloud Engineers');

  await mongoose.disconnect();
  console.log('[Staging Seed] Disconnected. Staging database is ready.');
}

if (require.main === module) {
  seedStaging().catch((err) => {
    console.error('[Staging Seed] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = seedStaging;
