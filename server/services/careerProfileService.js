const CareerProfile = require('../models/CareerProfile');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Challenge = require('../models/Challenge');
const Roadmap = require('../models/Roadmap');
const Certificate = require('../models/Certificate');

/**
 * 1. Get or initialize a student's CareerProfile
 */
exports.getOrCreateProfile = async (userId) => {
  let profile = await CareerProfile.findOne({ student: userId });
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!profile) {
    // Generate initial skills list from student profile
    const initialSkills = (user.studentProfile?.skills || ['JavaScript', 'HTML/CSS', 'React']).map(s => ({
      name: s,
      category: categorizeSkill(s),
      proficiency: 55,
      verifiedBy: ['self'],
      lastAssessed: new Date()
    }));

    const slug = user.email ? user.email.split('@')[0] + '-' + Math.floor(1000 + Math.random() * 9000) : 'student-' + userId;

    try {
      profile = await CareerProfile.findOneAndUpdate(
        { student: userId },
        {
          $setOnInsert: {
            student: userId,
            targetRole: user.studentProfile?.careerGoal || 'Full Stack Software Engineer',
            skills: initialSkills,
            passportSettings: {
              isPublic: true,
              slug
            }
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (err.code === 11000) {
        profile = await CareerProfile.findOne({ student: userId });
      } else {
        throw err;
      }
    }
  }

  // Calculate & update readiness score atomically
  await exports.recalculateReadiness(profile._id);

  return CareerProfile.findById(profile._id).populate('student', 'name email profileImage studentProfile');
};

/**
 * Helper to categorize skills automatically
 */
function categorizeSkill(skillName) {
  const s = skillName.toLowerCase();
  if (['react', 'vue', 'angular', 'html', 'css', 'tailwind', 'javascript', 'typescript', 'nextjs'].some(k => s.includes(k))) return 'Frontend';
  if (['node', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'golang', 'rust', 'c++', 'c#'].some(k => s.includes(k))) return 'Backend';
  if (['mongodb', 'postgres', 'sql', 'mysql', 'redis', 'prisma', 'mongoose'].some(k => s.includes(k))) return 'Database';
  if (['docker', 'kubernetes', 'aws', 'gcp', 'ci/cd', 'github actions', 'terraform', 'nginx'].some(k => s.includes(k))) return 'DevOps';
  if (['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'ai', 'langchain'].some(k => s.includes(k))) return 'AI/ML';
  return 'Other';
}

/**
 * 2. Recalculate 7-Factor Explainable Career Readiness Score
 */
exports.recalculateReadiness = async (careerProfileId) => {
  const profile = await CareerProfile.findById(careerProfileId);
  if (!profile) return null;

  const user = await User.findById(profile.student);
  if (!user) return null;

  // Retrieve user evidence from database
  const [quizzes, certificates, roadmaps] = await Promise.all([
    Quiz.find({ student: user._id }),
    Certificate.find({ student: user._id }),
    Roadmap.find({ student: user._id })
  ]);

  // 1. Technical Skills Score (0-100)
  const skillsCount = profile.skills.length;
  let avgProficiency = skillsCount > 0 
    ? profile.skills.reduce((acc, s) => acc + s.proficiency, 0) / skillsCount
    : 40;
  
  // Bonus for verified skills
  const verifiedCount = profile.skills.filter(s => s.verifiedBy && s.verifiedBy.length > 1).length;
  let technicalScore = Math.min(Math.round(avgProficiency + (verifiedCount * 3)), 100);

  // 2. Coding Ability Score (0-100)
  let codingScore = 40;
  const completedQuizzes = quizzes.filter(q => q.score > 0);
  if (completedQuizzes.length > 0) {
    const avgQuizPct = completedQuizzes.reduce((acc, q) => acc + (q.score / (q.questions.length || 4)), 0) / completedQuizzes.length;
    codingScore = Math.round(30 + (avgQuizPct * 50));
  }
  if (user.studentProfile?.leaderboardPoints > 0) {
    codingScore += Math.min(Math.round(user.studentProfile.leaderboardPoints / 15), 20);
  }
  if (profile.githubData?.projectComplexityScore > 0) {
    codingScore = Math.round((codingScore * 0.6) + (profile.githubData.projectComplexityScore * 0.4));
  }
  codingScore = Math.min(codingScore, 100);

  // 3. Project Strength Score (0-100)
  let projectScore = 35;
  if (profile.githubData?.publicRepos > 0) {
    projectScore += Math.min(profile.githubData.publicRepos * 8, 35);
    if (profile.githubData.totalStars > 0) projectScore += Math.min(profile.githubData.totalStars * 5, 15);
  }
  if (roadmaps.length > 0) {
    projectScore += Math.min(roadmaps.length * 10, 20);
  }
  projectScore = Math.min(projectScore, 100);

  // 4. Resume Quality (0-100)
  const resumeScore = user.studentProfile?.resumeScore || 50;

  // 5. Interview Readiness (0-100)
  let interviewScore = 45;
  if (profile.interviewEvaluations && profile.interviewEvaluations.length > 0) {
    const avgInterview = profile.interviewEvaluations.reduce((acc, i) => acc + (i.overallScore || 60), 0) / profile.interviewEvaluations.length;
    interviewScore = Math.round(avgInterview);
  }

  // 6. Communication (0-100)
  let communicationScore = 65;
  if (profile.interviewEvaluations && profile.interviewEvaluations.length > 0) {
    const latest = profile.interviewEvaluations[profile.interviewEvaluations.length - 1];
    if (latest.clarityScore) {
      communicationScore = Math.round((communicationScore * 0.4) + (latest.clarityScore * 0.6));
    }
  }

  // 7. Certifications & Badges (0-100)
  let certScore = 30;
  if (certificates.length > 0) {
    certScore += Math.min(certificates.length * 20, 50);
  }
  if (user.studentProfile?.badges && user.studentProfile.badges.length > 0) {
    certScore += Math.min(user.studentProfile.badges.length * 10, 25);
  }
  certScore = Math.min(certScore, 100);

  // Overall Weighted Calculation
  const overall = Math.round(
    (technicalScore * 0.22) +
    (codingScore * 0.18) +
    (projectScore * 0.20) +
    (resumeScore * 0.15) +
    (interviewScore * 0.15) +
    (certScore * 0.05) +
    (communicationScore * 0.05)
  );

  // Rating category
  let ratingCategory = 'Foundation Phase';
  if (overall >= 85) ratingCategory = 'High Competitive Edge';
  else if (overall >= 70) ratingCategory = 'Job Ready';
  else if (overall >= 50) ratingCategory = 'Developing Competency';

  // Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];
  const criticalGaps = [];

  if (technicalScore >= 75) strengths.push('Strong core technical skill foundation');
  else weaknesses.push('Technical depth needs expansion in modern frameworks');

  if (codingScore >= 75) strengths.push('High algorithm and problem-solving readiness');
  else criticalGaps.push('Limited verified coding challenge & quiz history');

  if (projectScore >= 70) strengths.push('Demonstrated hands-on project portfolio');
  else criticalGaps.push('Needs at least 2-3 production-grade deployed portfolio projects');

  if (resumeScore >= 80) strengths.push('ATS-optimized resume structure');
  else weaknesses.push('Resume ATS compatibility score is below industry recruiter threshold (80%)');

  if (interviewScore >= 75) strengths.push('Strong structured articulation in mock interviews');
  else weaknesses.push('Mock interview performance needs practice in system design & STAR structure');

  // Next Best Actions Engine
  const nextActions = [];

  if (resumeScore < 80) {
    nextActions.push({
      title: 'Optimize Resume for ATS Compatibility',
      description: 'Upload and rescan your resume to reach a score above 80%. Apply Google X-Y-Z formula to bullet points.',
      type: 'resume',
      link: '/ai-resume',
      priority: 'high',
      reason: 'Increases initial recruiter screening pass rates.'
    });
  }

  if (quizzes.length < 3) {
    nextActions.push({
      title: 'Complete 2 Technical Skill Quizzes',
      description: 'Test your understanding on key topics like API Security, Virtual DOM, and Indexing.',
      type: 'quiz',
      link: '/ai-quiz',
      priority: 'high',
      reason: 'Validates and increases your verified technical proficiency score.'
    });
  }

  if (!profile.githubData?.username) {
    nextActions.push({
      title: 'Connect GitHub Profile',
      description: 'Link your GitHub account to verify repository complexity, commit streaks, and project code quality.',
      type: 'github',
      link: '/profile',
      priority: 'medium',
      reason: 'Provides automated code proof directly on your Career Passport.'
    });
  }

  if (profile.interviewEvaluations.length === 0) {
    nextActions.push({
      title: 'Take Your First AI Mock Interview',
      description: 'Simulate a 4-question technical and behavioral round to calibrate your answer pacing.',
      type: 'interview',
      link: '/ai-interview',
      priority: 'high',
      reason: 'Calibrates interview readiness and communication scores.'
    });
  }

  nextActions.push({
    title: 'Explore AI Course Recommendations',
    description: 'Review AI-suggested courses aligned with your target role of ' + profile.targetRole,
    type: 'course',
    link: '/courses',
    priority: 'medium',
    reason: 'Addresses identified skill gaps for ' + profile.targetRole
  });

  const newReadinessScore = {
    overallReadiness: Math.min(overall, 98),
    technicalSkills: technicalScore,
    codingAbility: codingScore,
    projectStrength: projectScore,
    resumeQuality: resumeScore,
    interviewReadiness: interviewScore,
    communication: communicationScore,
    certifications: certScore,
    ratingCategory,
    strengths,
    weaknesses,
    criticalGaps,
    scoringRationale: `Computed from ${skillsCount} tracked skills, ${quizzes.length} quiz evaluations, ${certificates.length} certificates, and verified repository evidence.`,
    lastCalculated: new Date()
  };

  const updatedProfile = await CareerProfile.findByIdAndUpdate(
    careerProfileId,
    {
      $set: {
        readinessScore: newReadinessScore,
        nextActions: nextActions
      }
    },
    { new: true }
  );

  return updatedProfile;
};

/**
 * 3. Record student activity and synchronize proficiency with bounded retry
 */
exports.recordActivity = async (userId, activityType, payload = {}, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let profile = await CareerProfile.findOne({ student: userId });
      if (!profile) {
        profile = await exports.getOrCreateProfile(userId);
      }

      if (activityType === 'QUIZ_COMPLETED') {
        const { topic, score, maxScore = 4 } = payload;
        const pct = (score / maxScore) * 100;
        
        // Find or add skill
        const skillIndex = profile.skills.findIndex(s => s.name.toLowerCase() === (topic || '').toLowerCase());
        if (skillIndex > -1) {
          profile.skills[skillIndex].proficiency = Math.min(Math.round((profile.skills[skillIndex].proficiency * 0.5) + (pct * 0.5)), 100);
          if (!profile.skills[skillIndex].verifiedBy.includes('quiz')) {
            profile.skills[skillIndex].verifiedBy.push('quiz');
          }
          profile.skills[skillIndex].lastAssessed = new Date();
        } else if (topic) {
          profile.skills.push({
            name: topic,
            category: categorizeSkill(topic),
            proficiency: Math.round(pct),
            verifiedBy: ['quiz'],
            lastAssessed: new Date()
          });
        }
      } else if (activityType === 'INTERVIEW_COMPLETED') {
        const { technology, role, difficulty, overallScore, technicalScore, structureScore, clarityScore, confidenceScore, feedback, improvements } = payload;
        profile.interviewEvaluations.push({
          technology,
          role,
          difficulty,
          overallScore: overallScore || 70,
          technicalScore: technicalScore || 70,
          structureScore: structureScore || 70,
          clarityScore: clarityScore || 70,
          confidenceScore: confidenceScore || 70,
          feedback: feedback || '',
          improvements: improvements || [],
          date: new Date()
        });
      } else if (activityType === 'JOB_MATCH_ANALYSIS') {
        const { jobTitle, company, matchScore, matchedSkills, missingSkills, roadmapId } = payload;
        profile.jobMatchHistory.unshift({
          jobTitle: jobTitle || 'Target Role',
          company: company || 'Target Company',
          matchScore: matchScore || 70,
          matchedSkills: matchedSkills || [],
          missingSkills: missingSkills || [],
          roadmapId: roadmapId || null,
          analyzedAt: new Date()
        });
        // Keep top 10 history records
        if (profile.jobMatchHistory.length > 10) {
          profile.jobMatchHistory = profile.jobMatchHistory.slice(0, 10);
        }
      }

      await profile.save();
      return await exports.recalculateReadiness(profile._id);
    } catch (err) {
      if ((err.name === 'VersionError' || err.code === 11000) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 25 * attempt));
        continue;
      }
      throw err;
    }
  }
};
