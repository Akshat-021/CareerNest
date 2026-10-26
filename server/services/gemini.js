const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- AI CONFIG & BOOTSTRAP ---
let geminiModel = null;

function sanitizeErrorMessage(msg) {
  if (!msg) return 'Unknown error';
  return String(msg)
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/api[-_]?key[:=]\s*[a-zA-Z0-9_\-]+/gi, 'apiKey=[REDACTED]');
}

function cleanJsonResponse(text) {
  if (!text) return '{}';
  let cleaned = text.trim();
  // Strip Markdown code fences if model returned ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

function getGeminiModel() {
  if (geminiModel) return geminiModel;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const aiClient = new GoogleGenerativeAI(apiKey.trim());
      geminiModel = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('[Info] CareerNest AI Engine: Connection initialized with Gemini 1.5 Flash.');
      return geminiModel;
    } catch (err) {
      console.error('[Error] Could not initialize Gemini:', sanitizeErrorMessage(err.message));
      return null;
    }
  }
  return null;
}

// Initial bootstrap check
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
  getGeminiModel();
} else {
  console.log('[Notice] CareerNest: Transparent heuristic AI simulation active (missing GEMINI_API_KEY).');
}

/**
 * Handles API calls to Gemini and parses the raw response payload into JSON.
 * Protected by configurable timeout, input length bounds, and sanitized error handling.
 * Returns null if the model fails or key isn't verified.
 */
async function callGemini(prompt, systemInstruction = '', timeoutMs = 15000) {
  const model = getGeminiModel();
  if (!model) return null;

  try {
    // Clamp input to prevent token/memory overflow
    const safePrompt = typeof prompt === 'string'
      ? prompt.slice(0, 15000)
      : JSON.stringify(prompt).slice(0, 15000);
    const safeInstruction = typeof systemInstruction === 'string'
      ? systemInstruction.slice(0, 5000)
      : '';

    const promptPayload = safeInstruction 
      ? `${safeInstruction}\n\nUser Input/Request:\n${safePrompt}\n\nResponse MUST be in valid raw JSON format only.`
      : `${safePrompt}\n\nResponse MUST be in valid raw JSON format only.`;
    
    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptPayload }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const rawResult = await Promise.race([generatePromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const rawText = rawResult.response.text();
    const cleanJson = cleanJsonResponse(rawText);
    return JSON.parse(cleanJson);
  } catch (apiErr) {
    const sanitized = sanitizeErrorMessage(apiErr.message);
    console.warn('[Warning] Gemini API unavailable or failed. Seamlessly activating heuristic engine:', sanitized);
    return null;
  }
}

/**
 * 1. AI Course Recommendation Engine
 */
exports.generateRecommendations = async (profile) => {
  const prompt = `Profile data: ${JSON.stringify(profile)}. Generate 3 course recommendations.`;
  const systemInstruction = `You are an expert AI academic advisor. Generate a JSON array of recommended courses. Each course must have: courseId, title, description, reason, difficulty, duration, projects (array), books (array), practiceWebsites (array), placementPrepResources (array), interviewQuestions (array).`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) {
    return {
      recommendations: geminiResponse.recommendations || geminiResponse,
      isSimulatedFallback: false,
      aiEngine: 'gemini-1.5-flash'
    };
  }

  // Local fallback simulation
  const { currentSkills = [], careerGoal = 'Full Stack Developer', preferredTechnology = 'React', placementTarget = 'Product-based' } = profile;
  
  const recommendations = [
    {
      courseId: "rec_course_1",
      title: `Advanced ${preferredTechnology} Mastery & Scalable Architecture`,
      description: `Deep dive into advanced architectures, performance tuning, state management, and real-time systems using ${preferredTechnology}.`,
      reason: `Based on your goal to become a ${careerGoal} and interest in ${preferredTechnology}, this course fills critical technical gaps.`,
      difficulty: "Intermediate to Advanced",
      duration: "6 weeks",
      projects: ["Real-time collaborative workspace app", "Micro-frontend dashboard portal"],
      books: [`You Don't Know JS Yet`, `${preferredTechnology} Design Patterns`],
      practiceWebsites: ["LeetCode", "Frontend Mentor", "StackOverflow"],
      placementPrepResources: ["System Design Primer", "Tech Interview Handout"],
      interviewQuestions: [
        `Explain virtualization and reconciliation in ${preferredTechnology}.`,
        `How would you optimize page-load speed for large client-side web apps?`
      ]
    },
    {
      courseId: "rec_course_2",
      title: `Scalable Backend Services with Node, Express & SQL/NoSQL`,
      description: `Learn to design RESTful and GraphQL APIs, implement JWT caching, rate limiting, and write production-grade databases.`,
      reason: `Essential for your placement target of ${placementTarget} companies where backend and system design skills are highly tested.`,
      difficulty: "Advanced",
      duration: "8 weeks",
      projects: ["High-throughput notification gateway", "Distributed caching proxy server"],
      books: ["Designing Data-Intensive Applications by Martin Kleppmann"],
      practiceWebsites: ["HackerRank", "Excalidraw for Database Design"],
      placementPrepResources: ["API Design Handbook", "SQL & NoSQL Performance Tuning Guide"],
      interviewQuestions: [
        "Explain MongoDB indexing and how index-intersection works.",
        "How would you prevent CSRF and SQL injection vulnerabilities in a Node backend?"
      ]
    }
  ];

  return {
    recommendations,
    isSimulatedFallback: true,
    aiEngine: 'curated-heuristic-v1'
  };
};

/**
 * 2. AI Career Roadmap Generator
 */
exports.generateCareerRoadmap = async (track) => {
  const prompt = `Generate a detailed timeline-based career roadmap for the track: "${track}".`;
  const systemInstruction = `You are a Principal Software Architect. Generate a career roadmap JSON structure with: track, duration, difficulty, modules (array of objects with: title, timeline, topics (array), projects (array), resources (array), milestones (array), weeklyTasks (array), mockInterviews (array), practiceProblems (array)).`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) {
    return {
      ...geminiResponse,
      isSimulatedFallback: false,
      aiEngine: 'gemini-1.5-flash'
    };
  }

  // Local fallback simulation
  const roadmapTracks = {
    "Web Development": [
      { title: "HTML, CSS & Modern Layouts", timeline: "Week 1-2", topics: ["Flexbox", "CSS Grid", "Semantic HTML", "Responsive Web Design"], projects: ["Personal Portfolio Website"], resources: ["MDN Web Docs", "CSS-Tricks"], milestones: ["Build accessible multi-page layouts"], weeklyTasks: ["Code 2 responsive mockups", "Read accessibility specifications"], mockInterviews: ["Describe CSS box model and positioning styles."], practiceProblems: ["Flexbox Froggy", "CSS Grid Garden"] },
      { title: "JavaScript & ES6+ Fundamentals", timeline: "Week 3-4", topics: ["Closures", "Promises", "Async/Await", "DOM Manipulation"], projects: ["Interactive Budget Tracker"], resources: ["Eloquent JavaScript", "JavaScript.info"], milestones: ["Master asynchronous requests"], weeklyTasks: ["Write an API consuming dashboard", "Practice promises chain structure"], mockInterviews: ["Explain Event Loop, Microtasks and Event Delegation."], practiceProblems: ["LeetCode JS 30 Days"] },
      { title: "React & Client-Side State Management", timeline: "Week 5-8", topics: ["React Hooks", "Context API", "Redux/Zustand", "React Router"], projects: ["E-commerce App with Cart"], resources: ["React Docs Beta", "Kent C. Dodds Blog"], milestones: ["Launch SPA with state persistence"], weeklyTasks: ["Create complex form handling with React Hook Form", "Structure route-guards"], mockInterviews: ["Compare Context API with Redux. When to use which?"], practiceProblems: ["Build reusable UI buttons, modals and tables from scratch."] }
    ],
    "AI": [
      { title: "Python & Linear Algebra", timeline: "Week 1-3", topics: ["NumPy", "Pandas", "Matrix Operations", "Probability"], projects: ["Dataset analytics dashboard"], resources: ["Kaggle Tutorials", "Python for Data Analysis"], milestones: ["Perform Exploratory Data Analysis (EDA) on a dataset"], weeklyTasks: ["Implement Matrix Multiplication from scratch", "Clean a messy real-world CSV dataset"], mockInterviews: ["Explain Eigenvalues and Eigenvectors in simple terms."], practiceProblems: ["Kaggle micro-challenges"] },
      { title: "Classical Machine Learning", timeline: "Week 4-7", topics: ["Linear Regression", "Decision Trees", "SVM", "Clustering"], projects: ["House Price Prediction model"], resources: ["Scikit-Learn Docs", "Hands-On ML Book"], milestones: ["Train and evaluate linear/classification models"], weeklyTasks: ["Implement K-Means clustering", "Fine-tune hyperparameters using GridSearch"], mockInterviews: ["Describe bias-variance tradeoff and regularization techniques."], practiceProblems: ["Predict house pricing dataset"] }
    ]
  };

  const selectedTrack = roadmapTracks[track] || roadmapTracks["Web Development"];

  return {
    track,
    duration: "8-12 weeks",
    difficulty: "Beginner to Intermediate",
    modules: selectedTrack,
    isSimulatedFallback: true,
    aiEngine: 'curated-roadmap-heuristic-v1'
  };
};

/**
 * 3. JOB DESCRIPTION INTELLIGENCE ("Analyze a Job")
 */
exports.analyzeJobDescription = async (jobText, studentSkills = [], targetRole = 'Software Engineer') => {
  const prompt = `Job Description:\n${jobText}\n\nStudent Current Skills: ${JSON.stringify(studentSkills)}\nStudent Target Role: "${targetRole}"`;
  const systemInstruction = `You are an expert Technical Recruiter & Career Architect.
Extract key requirements from the Job Description and compare them with the student's current skills.
Return a valid JSON object with:
{
  "jobTitle": "string",
  "company": "string (or 'Target Employer' if not stated)",
  "experienceRequired": "string",
  "matchScore": number (0-100),
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "matchedSkills": ["skill1", "skill2"],
  "criticalMissingSkills": ["skill1", "skill2"],
  "niceToHaveGaps": ["skill1", "skill2"],
  "responsibilitiesSummary": ["resp1", "resp2"],
  "recommendedCourses": ["course1", "course2"],
  "recommendedProjects": ["project idea 1", "project idea 2"],
  "actionPlanSummary": "string explaining how the student can close the gap in 4-6 weeks"
}`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local heuristic fallback
  const lowerText = jobText.toLowerCase();
  const knownTech = [
    'react', 'node.js', 'express', 'mongodb', 'postgresql', 'sql', 'docker', 'kubernetes',
    'aws', 'gcp', 'typescript', 'javascript', 'python', 'java', 'graphql', 'redis', 'ci/cd', 'git', 'tailwind', 'rest api', 'system design'
  ];

  const extractedRequired = [];
  knownTech.forEach(tech => {
    if (lowerText.includes(tech)) {
      extractedRequired.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  });

  if (extractedRequired.length === 0) {
    extractedRequired.push('React', 'Node.js', 'MongoDB', 'REST APIs', 'Git', 'Docker');
  }

  const normalizedStudent = studentSkills.map(s => s.toLowerCase());
  const matched = [];
  const missing = [];

  extractedRequired.forEach(req => {
    const isMatched = normalizedStudent.some(st => st.includes(req.toLowerCase()) || req.toLowerCase().includes(st));
    if (isMatched) matched.push(req);
    else missing.push(req);
  });

  const baseRatio = extractedRequired.length > 0 ? (matched.length / extractedRequired.length) : 0.5;
  const matchScore = Math.min(Math.max(Math.round(baseRatio * 100), 25), 95);

  return {
    jobTitle: lowerText.includes('full stack') ? 'Full Stack Developer' : (lowerText.includes('backend') ? 'Backend Engineer' : (lowerText.includes('frontend') ? 'Frontend Engineer' : 'Software Engineer')),
    company: 'Target Enterprise',
    experienceRequired: lowerText.includes('senior') ? '3-5 years' : (lowerText.includes('mid') ? '2-3 years' : '0-2 years (Entry/Associate)'),
    matchScore,
    requiredSkills: extractedRequired.slice(0, 8),
    preferredSkills: ['TypeScript', 'Docker', 'System Design', 'Redis Caching'],
    matchedSkills: matched,
    criticalMissingSkills: missing.slice(0, 4),
    niceToHaveGaps: missing.slice(4),
    responsibilitiesSummary: [
      'Design, build, and maintain high-performance frontend components and microservices.',
      'Collaborate with cross-functional product and design teams to deliver end-to-end features.',
      'Optimize application performance, API throughput, and database query latency.'
    ],
    recommendedCourses: [
      missing[0] ? `Production-Grade ${missing[0]} Masterclass` : 'Advanced Full-Stack Engineering',
      missing[1] ? `Cloud & Deployment with ${missing[1]}` : 'System Design & Scalability'
    ],
    recommendedProjects: [
      `Build a scalable application featuring ${missing.slice(0, 2).join(' and ')} with automated CI/CD.`,
      `Design an interactive real-time dashboard with authentication, caching, and rate limiting.`
    ],
    actionPlanSummary: `You currently match ${matched.length} out of ${extractedRequired.length} core technical requirements (${matchScore}% match). Focusing on ${missing.slice(0, 2).join(', ')} over the next 4 weeks will significantly boost your candidate ranking.`,
    isSimulatedFallback: true,
    aiEngine: 'keyword-matcher-heuristic-v1'
  };
};

/**
 * 4. JOB DESCRIPTION → 6-WEEK TARGETED ROADMAP
 */
exports.generateJobSpecificRoadmap = async (jobTitle, missingSkills = [], currentLevel = 'Intermediate') => {
  const prompt = `Create a 6-week targeted learning roadmap for the role "${jobTitle}" addressing these missing skills: ${JSON.stringify(missingSkills)}. Level: ${currentLevel}.`;
  const systemInstruction = `You are a Principal Tech Career Mentor. Return JSON with:
{
  "track": "${jobTitle} Fast-Track Mastery",
  "duration": "6 weeks",
  "difficulty": "${currentLevel}",
  "modules": [
    {
      "title": "string",
      "timeline": "Week 1",
      "topics": ["topic1", "topic2"],
      "projects": ["project1"],
      "resources": ["resource1"],
      "milestones": ["milestone1"],
      "weeklyTasks": ["task1", "task2"],
      "mockInterviews": ["interview prompt"],
      "practiceProblems": ["problem1"]
    }
  ]
}`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Fallback 6-week structure
  const s1 = missingSkills[0] || 'Advanced Backend & API Architecture';
  const s2 = missingSkills[1] || 'Containerization & Docker Deployment';
  const s3 = missingSkills[2] || 'Cloud Services & AWS/GCP Infrastructure';
  const s4 = missingSkills[3] || 'System Design & Distributed Data Systems';

  return {
    track: `${jobTitle} Fast-Track Mastery`,
    duration: "6 weeks",
    difficulty: currentLevel,
    modules: [
      {
        title: `Week 1: Core Fundamentals & ${s1}`,
        timeline: "Week 1",
        topics: [`Deep dive into ${s1}`, "Architecture Patterns", "Best Practices"],
        projects: [`Mini proof-of-concept integrating ${s1}`],
        resources: ["Official Documentation", "GitHub Reference Examples"],
        milestones: [`Build working prototype using ${s1}`],
        weeklyTasks: ["Set up local development container", "Implement core data models"],
        mockInterviews: [`Explain key architectural principles behind ${s1}.`],
        practiceProblems: ["Implement 3 practical code challenges"]
      },
      {
        title: `Week 2: Advanced Integration with ${s2}`,
        timeline: "Week 2",
        topics: [`Containerizing services with ${s2}`, "Environment Isolation", "Multi-stage builds"],
        projects: [`Containerized API service pipeline`],
        resources: ["DevOps Handbook", "Docker Hub Best Practices"],
        milestones: [`Successfully build and spin up multi-container docker compose`],
        weeklyTasks: ["Write clean Dockerfiles", "Configure local volume persistence"],
        mockInterviews: ["How does containerization differ from hypervisor virtualization?"],
        practiceProblems: ["Debug broken container network bridges"]
      },
      {
        title: `Week 3: Cloud & Scalability with ${s3}`,
        timeline: "Week 3",
        topics: [`Deploying to ${s3}`, "Serverless vs VM instances", "Load Balancing"],
        projects: [`Live cloud deployed microservice`],
        resources: ["AWS Architecture Center", "Cloud Design Patterns"],
        milestones: [`Deploy app to cloud with HTTPS and custom domain`],
        weeklyTasks: ["Configure cloud security groups", "Set up automated environment secrets"],
        mockInterviews: ["Explain horizontal scaling vs vertical scaling with trade-offs."],
        practiceProblems: ["Deploy static assets to CDN bucket"]
      },
      {
        title: `Week 4: Data Engineering & ${s4}`,
        timeline: "Week 4",
        topics: [`Caching strategies`, "Database Indexing", "Message Queues"],
        projects: [`High-throughput caching layer with Redis`],
        resources: ["Designing Data-Intensive Applications", "Redis Guides"],
        milestones: [`Reduce API response latency by 60% with query cache`],
        weeklyTasks: ["Implement cache invalidation logic", "Benchmark query response metrics"],
        mockInterviews: ["Describe cache stampede and how to prevent it."],
        practiceProblems: ["Write rate limiting middleware"]
      },
      {
        title: "Week 5: Capstone End-to-End Enterprise Project",
        timeline: "Week 5",
        topics: ["Full stack integration", "Unit & Integration Tests", "CI/CD Workflows"],
        projects: [`Production-ready ${jobTitle} Capstone Application`],
        resources: ["GitHub Actions Documentation", "Jest/Playwright guides"],
        milestones: ["100% passing test pipeline and live production URL"],
        weeklyTasks: ["Write comprehensive test suite", "Configure automated CI/CD on merge"],
        mockInterviews: ["Walk me through the architecture of your capstone project."],
        practiceProblems: ["Set up GitHub Actions linter & tester"]
      },
      {
        title: "Week 6: Role-Specific Interview & ATS Polish",
        timeline: "Week 6",
        topics: ["Behavioral STAR questions", "Live Coding Drills", "Resume Impact Bullet Points"],
        projects: ["Polished GitHub README with Architecture Diagrams"],
        resources: ["Tech Interview Handbook", "Aura ATS Scanner"],
        milestones: ["Score >85 on AI Mock Interview Simulator"],
        weeklyTasks: ["Conduct 3 mock interview simulations", "Update resume with X-Y-Z achievements"],
        mockInterviews: ["Tell me about a challenging technical trade-off you had to make."],
        practiceProblems: ["Solve 5 LeetCode Medium system problems"]
      }
    ],
    isSimulatedFallback: true,
    aiEngine: 'curated-job-roadmap-heuristic-v1'
  };
};

/**
 * 5. UPGRADED AURA COPILOT (Context-Aware AI Assistant)
 */
exports.getChatbotResponse = async (userMessage, history = [], careerContext = null) => {
  const contextBlock = careerContext ? `
Student Career Context:
- Target Role: ${careerContext.targetRole || 'Software Engineer'}
- Tracked Skills: ${JSON.stringify(careerContext.skills?.map(s => s.name) || [])}
- Overall Career Readiness Score: ${careerContext.readinessScore?.overallReadiness || 50}/100
- Critical Gaps: ${JSON.stringify(careerContext.readinessScore?.criticalGaps || [])}
- Recent Job Match Score: ${careerContext.latestJobMatch || 'N/A'}%
` : '';

  const prompt = `${contextBlock}\nChat History: ${JSON.stringify(history)}\nStudent User: "${userMessage}"`;
  const systemInstruction = `You are "Aura Copilot", an elite AI Career Intelligence Partner and Technical Mentor.
You have continuous visibility into the student's Career Profile, skills, and readiness scores.
Personalize your response directly to their target role, skill gaps, and current readiness.
Respond in valid JSON format only:
{
  "answer": "string (clear, encouraging, technical, and actionable markdown format)",
  "suggestedActions": ["action 1", "action 2"],
  "platformActions": [
    { "title": "string", "type": "course" | "quiz" | "interview" | "resume" | "job" | "mentor", "link": "string" }
  ],
  "references": ["ref 1", "ref 2"]
}`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Heuristic context-aware fallback
  const msgLower = userMessage.toLowerCase();
  let answer = `I'm your **Aura Copilot**. Based on your career goal of **${careerContext?.targetRole || 'Software Engineer'}** and readiness score of **${careerContext?.readinessScore?.overallReadiness || 50}%**, I'm ready to guide your learning milestones, calibrate interview answers, or evaluate job descriptions.`;
  let suggestedActions = ["Analyze a Job Description", "How can I improve my Career Readiness Score?", "Generate a 6-week roadmap"];
  let platformActions = [
    { title: "Analyze Job Description", type: "job", link: "/ai-job-analyzer" },
    { title: "Take AI Mock Interview", type: "interview", link: "/ai-interview" }
  ];
  let references = ["MDN Web Docs", "System Design Primer"];

  if (msgLower.includes("score") || msgLower.includes("readiness") || msgLower.includes("placement")) {
    answer = `Your **Career Readiness Score** is currently **${careerContext?.readinessScore?.overallReadiness || 50}/100**. To level up toward **Job Ready (75%+)**, I recommend:\n1. **Take skill quizzes** to convert self-reported skills into verified credentials.\n2. **Run an ATS Resume Scan** to ensure your resume scores above 80%.\n3. **Connect your GitHub** to prove repository complexity.`;
    suggestedActions = ["Take a Skill Quiz", "Optimize My Resume", "Explore Recommended Courses"];
    platformActions = [
      { title: "Take Skill Quiz", type: "quiz", link: "/ai-quiz" },
      { title: "Scan Resume", type: "resume", link: "/ai-resume" }
    ];
  } else if (msgLower.includes("docker") || msgLower.includes("kubernetes") || msgLower.includes("devops")) {
    answer = `For containerization and DevOps, start with **Docker**: learn Dockerfile instructions, image layers, and docker-compose for multi-container apps. Once comfortable, progress to **CI/CD with GitHub Actions** before touching Kubernetes.`;
    suggestedActions = ["Generate DevOps Roadmap", "Practice Docker Questions", "Book a DevOps Mentor"];
    platformActions = [
      { title: "View Roadmaps", type: "course", link: "/ai-roadmap" },
      { title: "Search Mentors", type: "mentor", link: "/mentors" }
    ];
  } else if (msgLower.includes("job") || msgLower.includes("interview") || msgLower.includes("apply")) {
    answer = `Before applying, run the job description through our **AI Job Analyzer** to see your exact Match % and missing skills. Then conduct a role-specific **AI Mock Interview** to practice technical questions.`;
    suggestedActions = ["Analyze a Job Description", "Start Voice Mock Interview", "Track in Job Application Copilot"];
    platformActions = [
      { title: "AI Job Analyzer", type: "job", link: "/ai-job-analyzer" },
      { title: "AI Mock Interview", type: "interview", link: "/ai-interview" },
      { title: "Job Application Tracker", type: "job", link: "/job-applications" }
    ];
  }

  return {
    answer,
    suggestedActions,
    platformActions,
    references,
    isSimulatedFallback: true,
    aiEngine: 'context-aware-heuristic-v1'
  };
};

/**
 * 6. VOICE & ADVANCED AI MOCK INTERVIEW EVALUATION
 */
exports.evaluateMockInterviewAnswer = async (question, studentAnswer, tech = 'React', role = 'Software Engineer') => {
  const prompt = `Role: ${role}, Tech: ${tech}\nQuestion: "${question}"\nCandidate Answer: "${studentAnswer}"`;
  const systemInstruction = `You are a Principal Hiring Engineer. Evaluate the candidate's answer with extreme precision.
Return valid JSON:
{
  "overallScore": number (0-100),
  "technicalScore": number (0-100),
  "structureScore": number (0-100, checking STAR method and logical progression),
  "clarityScore": number (0-100),
  "confidenceScore": number (0-100),
  "feedback": "string",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "idealSampleAnswer": "string (a model answer demonstrating how a Senior engineer would answer)"
}`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Fallback heuristic scoring
  const wordCount = (studentAnswer || '').trim().split(/\s+/).length;
  let technicalScore = 65;
  let structureScore = 60;
  let clarityScore = 70;
  let confidenceScore = 65;

  if (wordCount > 60) {
    technicalScore += 15;
    structureScore += 15;
  }
  if (studentAnswer.toLowerCase().includes('because') || studentAnswer.toLowerCase().includes('result') || studentAnswer.toLowerCase().includes('example')) {
    structureScore += 10;
  }

  const overall = Math.min(Math.round((technicalScore * 0.4) + (structureScore * 0.3) + (clarityScore * 0.15) + (confidenceScore * 0.15)), 95);

  return {
    overallScore: overall,
    technicalScore: Math.min(technicalScore, 95),
    structureScore: Math.min(structureScore, 95),
    clarityScore: Math.min(clarityScore, 95),
    confidenceScore: Math.min(confidenceScore, 95),
    feedback: "Solid conceptual explanation. To move into top percentile, incorporate specific metrics and explicit architectural trade-offs.",
    strengths: [
      "Demonstrates clear familiarity with core terminology.",
      "Identifies the primary problem statement accurately."
    ],
    improvements: [
      "Use the STAR method (Situation, Task, Action, Result) to structure practical examples.",
      "Explicitly mention performance edge cases and error handling."
    ],
    idealSampleAnswer: `When addressing this in ${tech}, I first isolate the core state lifecycle and consider performance implications. In production environments, I mitigate bottlenecks by employing memoized selectors, lazy loading routes, and establishing clear error boundaries.`,
    isSimulatedFallback: true,
    aiEngine: 'star-heuristic-v1'
  };
};

/**
 * 7. AI RESUME ANALYZER (ATS Scoring)
 */
exports.analyzeResume = async (resumeText = '', jobTarget = 'Software Engineer') => {
  const prompt = `Analyze this resume content relative to the target role of "${jobTarget}":\n\n${resumeText}`;
  const systemInstruction = `You are an expert HR ATS systems consultant. Analyze the resume and provide a detailed JSON response: { atsScore: number (0-100), rating: string, missingSkills: [string], weakSections: [string], formattingIssues: [string], grammarSuggestions: [string], keywordOptimization: [string], resumeSuggestions: [string], improvedPoints: [string] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) {
    return {
      ...geminiResponse,
      isSimulatedFallback: false,
      aiEngine: 'gemini-1.5-flash'
    };
  }

  // --- EVIDENCE-BASED HEURISTIC FALLBACK (Transparent Simulation) ---
  const lowerText = (resumeText || '').toLowerCase();
  const wordCount = (resumeText || '').trim().split(/\s+/).filter(Boolean).length;

  // Technical skill vocabulary dictionary
  const skillDictionary = [
    'react', 'react native', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind',
    'node.js', 'nodejs', 'express', 'python', 'django', 'fastapi', 'flask', 'java', 'spring', 'go', 'golang', 'c#', 'c++',
    'sql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'graphql', 'rest api', 'prisma',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'git', 'github', 'linux',
    'jest', 'cypress', 'testing', 'system design', 'microservices', 'agile', 'scrum'
  ];

  // Identify skills present in the resume
  const detectedSkills = [];
  skillDictionary.forEach((sk) => {
    // Regex boundary check for clean matching
    const escaped = sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');
    if (regex.test(lowerText)) {
      detectedSkills.push(sk.charAt(0).toUpperCase() + sk.slice(1));
    }
  });

  // Target role skill expectations
  const roleTargetSkills = {
    'frontend': ['React', 'TypeScript', 'JavaScript', 'Tailwind', 'HTML', 'CSS', 'Git', 'REST API'],
    'backend': ['Node.js', 'Express', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Redis', 'REST API', 'System Design'],
    'full stack': ['React', 'Node.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Docker', 'Git', 'REST API'],
    'software engineer': ['JavaScript', 'Python', 'Java', 'SQL', 'Git', 'Docker', 'REST API', 'Data Structures']
  };

  const normalizedRole = jobTarget.toLowerCase();
  let expectedSkills = roleTargetSkills['software engineer'];
  if (normalizedRole.includes('front')) expectedSkills = roleTargetSkills['frontend'];
  else if (normalizedRole.includes('back')) expectedSkills = roleTargetSkills['backend'];
  else if (normalizedRole.includes('full')) expectedSkills = roleTargetSkills['full stack'];

  const matchedSkills = expectedSkills.filter((sk) =>
    detectedSkills.some((ds) => ds.toLowerCase() === sk.toLowerCase())
  );
  const missingSkills = expectedSkills.filter((sk) =>
    !detectedSkills.some((ds) => ds.toLowerCase() === sk.toLowerCase())
  );

  // Structural sections evaluation
  const sectionsIdentified = [];
  const weakSections = [];
  if (/education|degree|bachelor|master|university|college/i.test(lowerText)) sectionsIdentified.push('Education');
  else weakSections.push('Education section is missing or lacks degree credentials');

  if (/experience|employment|work history|intern|internship/i.test(lowerText)) sectionsIdentified.push('Experience');
  else weakSections.push('Professional Experience section is sparse or absent');

  if (/project|portfolio|built|engineered|developed/i.test(lowerText)) sectionsIdentified.push('Projects');
  else weakSections.push('Projects section should showcase end-to-end technical solutions');

  if (/skill|technical|technologies|proficiencies/i.test(lowerText)) sectionsIdentified.push('Skills');
  else weakSections.push('Dedicated Technical Skills section recommended');

  // Quantified bullet metric evaluation
  const hasQuantifiedMetrics = /\d+%\s*|\$\d+|\d+\+?\s*(users|clients|requests|ms|records|students|deployments)/i.test(lowerText);
  if (!hasQuantifiedMetrics) {
    weakSections.push('Project/experience bullets lack quantifiable performance metrics (e.g., latency, users, throughput)');
  }

  // Calculate ATS Score based on evidence
  let calculatedAts = 45;
  calculatedAts += Math.min(sectionsIdentified.length * 6, 24); // up to +24 for sections
  const skillRatio = expectedSkills.length > 0 ? (matchedSkills.length / expectedSkills.length) : 0.5;
  calculatedAts += Math.round(skillRatio * 22); // up to +22 for matched skills
  if (wordCount >= 250 && wordCount <= 900) calculatedAts += 5; // optimal length
  if (hasQuantifiedMetrics) calculatedAts += 5; // metrics bonus

  const atsScore = Math.min(Math.max(calculatedAts, 35), 95);
  const rating = atsScore >= 80 ? 'Excellent' : atsScore >= 65 ? 'Good' : 'Needs Optimization';

  const formattingIssues = [];
  if (wordCount < 150) {
    formattingIssues.push('Resume document text is very short (< 150 words). Provide detailed project descriptions.');
  } else if (wordCount > 1000) {
    formattingIssues.push('Resume length exceeds optimal 1-2 page scan range (> 1000 words). Aim for concise bullet points.');
  }
  if (!/linkedin\.com|github\.com/i.test(lowerText)) {
    formattingIssues.push('Include direct hyperlinks to your verified LinkedIn and active GitHub profiles.');
  }

  const grammarSuggestions = [
    "Begin accomplishment bullets with high-impact action verbs (e.g., 'Engineered', 'Architected', 'Containerized', 'Optimized').",
    "Avoid first-person pronouns ('I', 'we', 'my') in professional resume summaries."
  ];

  const keywordOptimization = missingSkills.length > 0
    ? missingSkills.map(sk => `Add verified competence in ${sk}`)
    : ['Include specialized competencies: System Architecture, Microservices, CI/CD Pipeline Automation'];

  const resumeSuggestions = [
    "Apply Google's X-Y-Z formula: 'Accomplished [X], measured by [Y], by doing [Z]'.",
    "Group technical proficiencies into distinct categories: Languages, Frameworks, Databases, and Cloud/DevOps."
  ];

  const improvedPoints = [
    `Engineered ${matchedSkills[0] || 'full-stack'} application modules with rigorous unit tests, accelerating feature deployment cycles.`,
    `Refactored relational database queries and indexed schemas, reducing backend query latency across production datasets.`
  ];

  return {
    isSimulatedFallback: true,
    aiEngine: 'evidence-based-heuristic-v1',
    disclaimer: 'Transparent heuristic analysis based on actual document text. Live Gemini AI API is deferred.',
    atsScore,
    rating,
    wordCount,
    detectedSkills: detectedSkills.slice(0, 15),
    matchedSkills,
    missingSkills: missingSkills.length > 0 ? missingSkills : ['System Design', 'Cloud Deployment'],
    sectionsIdentified,
    weakSections,
    formattingIssues,
    grammarSuggestions,
    keywordOptimization,
    resumeSuggestions,
    improvedPoints
  };
};

/**
 * 8. AI MOCK INTERVIEW QUESTION GENERATOR
 */
exports.generateMockInterview = async (tech, experience, role, difficulty) => {
  const prompt = `Generate 4 interview questions. Technology: ${tech}, Level: ${experience}, Role: ${role}, Difficulty: ${difficulty}.`;
  const systemInstruction = `You are a Technical Lead. Generate a mock interview JSON structure: { questions: [ { id: number, question: string, type: "Technical" | "Behavioral" | "HR", idealAnswerOutline: string } ] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  return {
    questions: [
      {
        id: 1,
        question: `Explain how asynchronous execution handles calls in ${tech}. How does this differ from multi-threaded concurrency models?`,
        type: "Technical",
        idealAnswerOutline: "Explain thread pool, event loop mechanism, call stack, callback queue, task queue, and non-blocking I/O operations."
      },
      {
        id: 2,
        question: `How do you handle application-wide state management and prevent component re-render performance bottlenecks in ${tech}?`,
        type: "Technical",
        idealAnswerOutline: "Explain state localization, useMemo/useCallback, state selectors in Zustand/Redux, context optimization, and immutable data flow."
      },
      {
        id: 3,
        question: "Describe a project scenario where you hit a blocker or production bug. What specific steps did you take to isolate and resolve it?",
        type: "Behavioral",
        idealAnswerOutline: "Apply the STAR method. Describe the Situation, the Task at hand, the Action steps (logging, debugging, collaboration), and the resulting metrics or learnings."
      },
      {
        id: 4,
        question: `Why do you want to pursue a career as a ${role}, and what architectural challenge are you most eager to solve next?`,
        type: "HR",
        idealAnswerOutline: "Highlight alignment with industry best practices, enthusiasm for scalable systems, and continuous self-learning."
      }
    ],
    isSimulatedFallback: true,
    aiEngine: 'interview-bank-heuristic-v1'
  };
};

/**
 * 9. AI QUIZ GENERATOR
 */
exports.generateQuiz = async (courseName, topic, difficulty) => {
  const prompt = `Generate a 4-question quiz. Course: ${courseName}, Topic: ${topic}, Difficulty: ${difficulty}.`;
  const systemInstruction = `You are a Course Instructor. Generate a JSON quiz structure: { quizTitle: string, questions: [ { id: number, question: string, options: [string], correctAnswerIndex: number, explanation: string } ] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  return {
    quizTitle: `${topic} (${difficulty}) - Quick Evaluation`,
    questions: [
      {
        id: 1,
        question: `Which of the following is true about Virtual DOM in React?`,
        options: [
          "It directly updates the browser layout tree",
          "It is a lightweight JavaScript representation of the real DOM",
          "It is slower than direct DOM manipulations",
          "It requires manual synchronization by the developer"
        ],
        correctAnswerIndex: 1,
        explanation: "The Virtual DOM is a virtual node representation in JS, allowing React to diff and reconcile changes before making batch updates to the real DOM."
      },
      {
        id: 2,
        question: `Which HTTP response status code represents unauthorized access?`,
        options: [
          "400 Bad Request",
          "401 Unauthorized",
          "403 Forbidden",
          "404 Not Found"
        ],
        correctAnswerIndex: 1,
        explanation: "401 Unauthorized is returned when authentication is required and has failed or has not yet been provided."
      },
      {
        id: 3,
        question: `What is the primary benefit of compound indexing in MongoDB?`,
        options: [
          "It speeds up queries that match multiple field keys",
          "It automatically encrypts index keys",
          "It reduces storage sizes of collection schemas",
          "It enables automatic scaling clusters"
        ],
        correctAnswerIndex: 0,
        explanation: "Compound indexes hold references to multiple fields in a document, accelerating queries filtering on all or sequential prefixes of those fields."
      },
      {
        id: 4,
        question: "Which of the following is NOT an advantage of Containerization (Docker)?",
        options: [
          "Consistency of runtimes across machines",
          "Fast container boot times compared to VMs",
          "Guaranteed physical database backup security",
          "Isolation of software environments"
        ],
        correctAnswerIndex: 2,
        explanation: "Docker containerizes application processes but does not intrinsically handle database physical backup protocols; that requires separate database management rules."
      }
    ],
    isSimulatedFallback: true,
    aiEngine: 'question-bank-heuristic-v1'
  };
};

/**
 * 10. AI COVER LETTER GENERATOR
 */
exports.generateCoverLetter = async (jobDetails, studentProfile) => {
  const prompt = `Job Details: ${JSON.stringify(jobDetails)}\nCandidate Profile: ${JSON.stringify(studentProfile)}`;
  const systemInstruction = `You are an executive career coach. Generate a compelling, tailored cover letter highlighting the candidate's verified skills and project achievements. Return JSON: { "coverLetter": "string (formatted with standard paragraphs)" }`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  return {
    coverLetter: `Dear Hiring Team at ${jobDetails.company || 'the company'},\n\nI am writing to express my strong interest in the ${jobDetails.position || 'Software Engineer'} role. With hands-on proficiency in ${(studentProfile.skills || ['modern web technologies']).slice(0, 4).join(', ')} and a solid track record of building production-grade full-stack applications, I am eager to contribute to your engineering initiatives.\n\nThroughout my recent projects, I have focused on building performant, scalable solutions with clean architecture and automated test workflows. My background in designing modular systems aligns directly with the requirements outlined in your job posting.\n\nI welcome the opportunity to discuss how my technical skills and enthusiasm for high-quality engineering can support your team's upcoming milestones.\n\nSincerely,\n${studentProfile.name || 'Candidate'}`,
    isSimulatedFallback: true,
    aiEngine: 'template-synthesizer-heuristic-v1'
  };
};

/**
 * 11. AI MENTOR COMPATIBILITY MATCHING
 */
exports.calculateMentorMatch = (mentor, studentProfile) => {
  const mentorSkills = mentor.mentorProfile?.expertise || [];
  const studentTarget = studentProfile.targetRole || 'Software Engineer';
  const studentSkills = (studentProfile.skills || []).map(s => (s.name || s).toLowerCase());

  let matchScore = 60; // base compatibility

  // Check overlap with mentor expertise
  let overlapCount = 0;
  mentorSkills.forEach(exp => {
    if (studentSkills.some(st => st.includes(exp.toLowerCase()) || exp.toLowerCase().includes(st))) {
      overlapCount++;
    }
  });

  matchScore += Math.min(overlapCount * 8, 24);

  // Rating bonus
  if (mentor.mentorProfile?.rating >= 4.8) matchScore += 10;
  else if (mentor.mentorProfile?.rating >= 4.5) matchScore += 5;

  const finalScore = Math.min(matchScore, 98);

  const reasons = [];
  if (overlapCount > 0) reasons.push(`Specializes in ${mentorSkills.slice(0, 2).join(' & ')}, matching your current learning focus.`);
  if (mentor.mentorProfile?.rating >= 4.8) reasons.push(`Top-rated mentor with ${mentor.mentorProfile.reviewsCount || 10}+ successful student sessions.`);
  if (reasons.length === 0) reasons.push(`Experienced industry leader in ${mentorSkills[0] || 'Software Engineering'}.`);

  return {
    matchScore: finalScore,
    matchReason: reasons.join(' '),
    isSimulatedFallback: false,
    aiEngine: 'deterministic-scoring-algorithm'
  };
};

// Internal test hooks & helpers
exports._callGemini = callGemini;
exports._cleanJsonResponse = cleanJsonResponse;
exports._sanitizeErrorMessage = sanitizeErrorMessage;
exports._setGeminiModel = (m) => { geminiModel = m; };
exports._getGeminiModel = getGeminiModel;
