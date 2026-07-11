require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Challenge = require('../models/Challenge');
const ForumPost = require('../models/Forum');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-portal');
    console.log('Connected to database for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Challenge.deleteMany({});
    await ForumPost.deleteMany({});
    console.log('Cleaned old records.');

    // 1. Seed Users
    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'Global Administrator',
      email: 'admin@portal.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    const mentor1 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'sarah@mentor.com',
      password: 'password123',
      role: 'mentor',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      mentorProfile: {
        expertise: ['React', 'NodeJS', 'System Design', 'Web Development'],
        bio: 'Sarah is an ex-Google Staff Engineer with 12+ years of experience building scalable applications and mentoring developers.',
        isApproved: true,
        availableSlots: [
          { day: 'Monday', time: '10:00 - 11:00' },
          { day: 'Wednesday', time: '14:00 - 15:00' }
        ]
      }
    });

    const mentor2 = await User.create({
      name: 'James Carter',
      email: 'james@mentor.com',
      password: 'password123',
      role: 'mentor',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      mentorProfile: {
        expertise: ['Machine Learning', 'Python', 'AI', 'Data Science'],
        bio: 'Research scientist focusing on neural network architectures and cloud orchestration deployments.',
        isApproved: false, // Pending approval
        availableSlots: [
          { day: 'Friday', time: '16:00 - 17:00' }
        ]
      }
    });

    const student = await User.create({
      name: 'Alex Rivera',
      email: 'alex@student.com',
      password: 'password123',
      role: 'student',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      studentProfile: {
        cgpa: 8.4,
        branch: 'Computer Science',
        semester: 6,
        skills: ['HTML', 'CSS', 'JavaScript'],
        learningStyle: 'Practical',
        careerGoal: 'Full Stack Developer',
        preferredTechnology: 'React',
        studyHours: 4,
        budget: 100,
        placementTarget: 'Product-based',
        learningStreak: 3,
        totalLearningHours: 18,
        leaderboardPoints: 50,
        badges: ['Quick Learner']
      }
    });

    console.log('Seeded Users successfully.');

    // 2. Seed Courses
    console.log('Seeding Courses...');
    const course1 = await Course.create({
      title: 'Modern Fullstack Web Development (MERN)',
      description: 'Learn to build and deploy robust client-server architectures with database management, real-time sync, and security optimizations.',
      category: 'Web Development',
      difficulty: 'Medium',
      duration: '8 weeks',
      prerequisites: ['HTML', 'CSS', 'JavaScript basic functions'],
      instructor: mentor1._id,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=500',
      modules: [
        { title: 'Module 1: Advanced Express Systems', description: 'Configure routing, error handling middleware, and rate limits.', duration: '1 week', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        { title: 'Module 2: Mongoose Schemas & Indexing', description: 'Structure compound indexing and schema validations.', duration: '2 weeks', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' }
      ],
      projects: [
        { title: 'Interactive Social Networking API', description: 'Create full backend structure with authentication.', difficulty: 'Medium' }
      ]
    });

    const course2 = await Course.create({
      title: 'Introduction to Machine Learning & Neural Networks',
      description: 'Master supervised algorithms, gradient descent optimization, and classification model tuning step by step.',
      category: 'AI & Machine Learning',
      difficulty: 'Hard',
      duration: '10 weeks',
      prerequisites: ['Python basics', 'Linear algebra equations'],
      instructor: mentor1._id,
      thumbnail: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&q=80&w=500',
      modules: [
        { title: 'Module 1: Regression Analysis', description: 'Understand linear and logistic regression operations.', duration: '2 weeks', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' }
      ],
      projects: [
        { title: 'Linear Pricing Predictor', description: 'Model real estate pricing values with high accuracy.', difficulty: 'Hard' }
      ]
    });

    console.log('Seeded Courses successfully.');

    // 3. Seed Coding Challenges
    console.log('Seeding Coding Challenges...');
    await Challenge.create([
      {
        title: 'Reverse a String',
        description: 'Write a JavaScript function `reverseString(str)` that accepts a string parameter and returns the characters in reverse order. E.g. reverseString("hello") returns "olleh".',
        difficulty: 'Easy',
        category: 'Algorithms',
        starterCode: 'function reverseString(str) {\n  // Write your code here\n  return "";\n}',
        testCases: [
          { input: 'hello', expectedOutput: 'olleh' },
          { input: 'world', expectedOutput: 'dlrow' }
        ],
        points: 10
      },
      {
        title: 'Find Prime Numbers',
        description: 'Write a JavaScript function `isPrime(num)` that determines if a number is prime. E.g. isPrime(7) returns true.',
        difficulty: 'Medium',
        category: 'Mathematics',
        starterCode: 'function isPrime(num) {\n  // Write your code here\n  return false;\n}',
        testCases: [
          { input: '7', expectedOutput: 'true' },
          { input: '4', expectedOutput: 'false' }
        ],
        points: 25
      }
    ]);
    console.log('Seeded Challenges successfully.');

    // 4. Seed Forum Posts
    console.log('Seeding Forums...');
    await ForumPost.create({
      user: student._id,
      title: 'How should I start learning System Design?',
      content: 'I want to build a real-time notification engine but am confused about how to structure cache layers (Redis) versus persistent DB mappings.',
      category: 'System Design',
      likes: [mentor1._id],
      replies: [
        {
          user: mentor1._id,
          content: 'Start with the System Design Primer repo on GitHub. Understand horizontal scaling, caching strategies (read-through vs write-through), and rate limiting. For messaging, look at Socket.io or Redis Pub/Sub.'
        }
      ]
    });
    console.log('Seeded Forums successfully.');

    console.log('\n=========================================');
    console.log('DATABASE SEEDING COMPLETED!');
    console.log('=========================================');
    console.log('Use the following logins to test roles:');
    console.log('Student: alex@student.com | password123');
    console.log('Mentor:  sarah@mentor.com | password123');
    console.log('Admin:   admin@portal.com | password123');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
