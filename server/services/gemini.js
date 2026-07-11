const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- AI CONFIG & BOOTSTRAP ---
// NOTE: Make sure GEMINI_API_KEY is defined in system settings / env.
let geminiModel = null;

if (process.env.GEMINI_API_KEY) {
  try {
    // Quick debug: instantiate client
    const aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('[Info] AI Engine: Connection looks good.');
  } catch (err) {
    console.error('[Error] Could not initialize Gemini:', err.message);
  }
} else {
  console.log('[Notice] Running fallback simulator (missing GEMINI_API_KEY).');
}

/**
 * Handles API calls to Gemini and parses the raw response payload into JSON.
 * Returns null if the model fails or key isn't verified.
 */
async function callGemini(prompt, systemInstruction = '') {
  if (!geminiModel) return null; // shortcut out if not active

  try {
    const promptPayload = systemInstruction 
      ? `${systemInstruction}\n\nUser Input/Request:\n${prompt}\n\nResponse MUST be in valid raw JSON format only.`
      : `${prompt}\n\nResponse MUST be in valid raw JSON format only.`;
    
    const rawResult = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptPayload }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(rawResult.response.text());
  } catch (apiErr) {
    console.warn('[Warning] API error occurred. Falling back:', apiErr.message);
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
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
  const { currentSkills = [], careerGoal = 'Full Stack Developer', learningStyle = 'Visual', preferredTechnology = 'React', placementTarget = 'Product-based' } = profile;
  
  const recommendations = [
    {
      courseId: "rec_course_1",
      title: `Advanced ${preferredTechnology} Mastery & Architecture`,
      description: `Deep dive into advanced architectures, performance tuning, state management, and real-time systems using ${preferredTechnology}.`,
      reason: `Based on your goal to become a ${careerGoal} and interest in ${preferredTechnology}, this course fills technical gaps.`,
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
      title: `Scalable Backend Services with Node & SQL/NoSQL`,
      description: `Learn to design RESTful and GraphQL APIs, implement JWT caching, rate limiting, and write production-grade databases.`,
      reason: `Essential for your placement target of ${placementTarget} companies where backend and system design skills are highly tested.`,
      difficulty: "Advanced",
      duration: "8 weeks",
      projects: ["High-throughput notification gateway", "Caching proxy server"],
      books: ["Designing Data-Intensive Applications by Martin Kleppmann"],
      practiceWebsites: ["HackerRank", "Excalidraw for Database Design"],
      placementPrepResources: ["API Design Handbook", "SQL & NoSQL Performance Tuning Guide"],
      interviewQuestions: [
        "Explain MongoDB indexing and how index-intersection works.",
        "How would you prevent CSRF and SQL injection vulnerabilities in a Node backend?"
      ]
    }
  ];

  return { recommendations };
};

/**
 * 2. AI Career Roadmap Generator
 */
exports.generateCareerRoadmap = async (track) => {
  const prompt = `Generate a detailed timeline-based career roadmap for the track: "${track}".`;
  const systemInstruction = `You are a Principal Software Architect. Generate a career roadmap JSON structure with: track, duration, difficulty, modules (array of objects with: title, timeline, topics (array), projects (array), resources (array), milestones (array), weeklyTasks (array), mockInterviews (array), practiceProblems (array)).`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
  const roadmapTracks = {
    "Web Development": [
      { title: "HTML, CSS & Modern layouts", timeline: "Week 1-2", topics: ["Flexbox", "CSS Grid", "Semantic HTML", "Responsive Web Design"], projects: ["Personal Portfolio Website"], resources: ["MDN Web Docs", "CSS-Tricks"], milestones: ["Build an accessible multi-page layouts"], weeklyTasks: ["Code 2 responsive mockups", "Read accessibility specifications"], mockInterviews: ["Describe CSS box model and positioning styles."], practiceProblems: ["Flexbox Froggy", "CSS Grid Garden"] },
      { title: "Javascript & ES6+ Fundamentals", timeline: "Week 3-4", topics: ["Closures", "Promises", "Async/Await", "DOM Manipulation"], projects: ["Interactive Budget Tracker"], resources: ["Eloquent JavaScript", "JavaScript.info"], milestones: ["Master asynchronous requests"], weeklyTasks: ["Write an API consuming dashboard", "Practice promises chain structure"], mockInterviews: ["Explain Event Loop, Microtasks and Event Delegation."], practiceProblems: ["LeetCode JS 30 Days"] },
      { title: "React & Client-side State Management", timeline: "Week 5-8", topics: ["React Hooks", "Context API", "Redux/Zustand", "React Router"], projects: ["E-commerce App with Cart"], resources: ["React Docs Beta", "Kent C. Dodds Blog"], milestones: ["Launch SPA with state persistence"], weeklyTasks: ["Create complex form handling with React Hook Form", "Structure route-guards"], mockInterviews: ["Compare Context API with Redux. When to use which?"], practiceProblems: ["Build reusable UI buttons, modals and tables from scratch."] }
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
    modules: selectedTrack
  };
};

/**
 * 3. AI Chatbot (Career Assistant)
 */
exports.getChatbotResponse = async (userMessage, history = []) => {
  const prompt = `Chat History: ${JSON.stringify(history)}\nUser Message: "${userMessage}"`;
  const systemInstruction = `You are "CareerNest", an advanced AI Career Coach and Technical Mentor. Provide helpful, conversational, and direct guidance. Response must be in JSON format: { answer: "string", suggestedActions: ["action1", "action2"], references: ["ref1"] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
  const msgLower = userMessage.toLowerCase();
  let answer = "I'm here to help with your career path! I can give you interview tips, explain software development concepts, suggest projects, or advise on learning routes.";
  let suggestedActions = ["Generate a Web Dev Roadmap", "Analyze my placement readiness"];
  let references = ["MDN Web Docs", "System Design Primer"];

  if (msgLower.includes("react") || msgLower.includes("frontend")) {
    answer = "For frontend engineering, especially React, focus on core concepts like Virtual DOM, state hooks, performance optimizations (useMemo/useCallback), and modern state libraries like Zustand or Redux. Project-based learning is the best approach.";
    suggestedActions = ["Build a React project", "Practice React interview questions"];
    references = ["React Official Documentation", "Frontend Mentor"];
  } else if (msgLower.includes("resume") || msgLower.includes("cv")) {
    answer = "To pass Applicant Tracking Systems (ATS), format your resume as a single-column PDF, list your technical skills explicitly under a dedicated section, and write project bullet points using the Google X-Y-Z formula: 'Accomplished [X], measured by [Y], by doing [Z]'.";
    suggestedActions = ["Upload Resume for ATS score", "Learn X-Y-Z resume writing"];
    references = ["ATS-friendly resume templates", "Resume writing guidelines"];
  } else if (msgLower.includes("interview") || msgLower.includes("mock")) {
    answer = "Interviews consist of Technical, HR, and Behavioral rounds. For technical rounds, master Data Structures & Algorithms and System Design. For behavioral, use the STAR method (Situation, Task, Action, Result) to structure your answers.";
    suggestedActions = ["Generate Mock Interview questions", "Practice behavioral questions"];
    references = ["STAR Interview Technique Guide", "Tech Interview Handbook"];
  } else if (msgLower.includes("node") || msgLower.includes("backend")) {
    answer = "Backend development requires a strong grasp of APIs (REST/GraphQL), databases (Mongoose/MongoDB/SQL), caching (Redis), authentication (JWT), and system security (CORS, Rate Limiting, Helmet).";
    suggestedActions = ["Design a relational schema", "Implement custom express middleware"];
    references = ["Node.js Best Practices", "Express.js Guides"];
  }

  return {
    answer,
    suggestedActions,
    references
  };
};

/**
 * 4. AI Resume Analyzer
 */
exports.analyzeResume = async (resumeText, jobTarget = 'Software Engineer') => {
  const prompt = `Analyze this resume content relative to the target role of "${jobTarget}":\n\n${resumeText}`;
  const systemInstruction = `You are an expert HR ATS systems consultant. Analyze the resume and provide a detailed JSON response: { atsScore: number (0-100), rating: string, missingSkills: [string], weakSections: [string], formattingIssues: [string], grammarSuggestions: [string], keywordOptimization: [string], resumeSuggestions: [string], improvedPoints: [string] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
  let atsScore = 72;
  const missingSkills = ["Docker", "Kubernetes", "GraphQL", "CI/CD Pipelines", "Jest/Enzyme Testing"];
  const weakSections = ["Projects lack metric-based impact", "Experience description is too brief"];
  const formattingIssues = ["Multi-column layouts could cause parsing issues on legacy ATS systems", "Include links to Github/LinkedIn directly below contacts"];
  const grammarSuggestions = ["Use active action verbs: 'Managed', 'Developed', 'Engineered' instead of passive phrases like 'Responsible for'"];
  const keywordOptimization = ["Add keywords: Scalability, REST APIs, Microservices, System Architecture"];
  const resumeSuggestions = [
    "Quantify your project metrics, e.g., 'Optimized query loading times by 40% using database indexes'.",
    "Restructure your skills block to separate Core Languages from Libraries and DevOps tools."
  ];
  const improvedPoints = [
    "Engineered robust MERN stack applications, optimizing page load metrics by 35% through code splitting.",
    "Managed database instances, implementing compound index structures to improve query retrieval times by 40%."
  ];

  // Adjust score based on length or profile factors if present
  if (resumeText && resumeText.length > 500) atsScore = 81;
  if (resumeText && resumeText.toLowerCase().includes("react") && jobTarget.toLowerCase().includes("react")) {
    atsScore += 5;
  }

  return {
    atsScore: Math.min(atsScore, 100),
    rating: atsScore >= 85 ? "Excellent" : atsScore >= 70 ? "Good" : "Needs Work",
    missingSkills,
    weakSections,
    formattingIssues,
    grammarSuggestions,
    keywordOptimization,
    resumeSuggestions,
    improvedPoints
  };
};

/**
 * 5. AI Skill Gap Analyzer
 */
exports.analyzeSkillGap = async (currentSkills = [], targetJobRole = 'Software Engineer') => {
  const prompt = `Compare current skills: ${JSON.stringify(currentSkills)} against target: "${targetJobRole}".`;
  const systemInstruction = `You are a Tech Career Mentor. Return a JSON structure: { missingSkills: [string], recommendedLearningPath: [string], recommendedCourses: [string], practiceProjects: [string], timeline: string }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
  const missing = [];
  const normalizedSkills = currentSkills.map(s => s.toLowerCase());

  if (!normalizedSkills.includes("docker")) missing.push("Docker & Containerization");
  if (!normalizedSkills.includes("aws") && !normalizedSkills.includes("cloud")) missing.push("Cloud Computing (AWS/GCP)");
  if (!normalizedSkills.includes("jest") && !normalizedSkills.includes("testing")) missing.push("Unit & Integration Testing (Jest/Cypress)");
  if (!normalizedSkills.includes("ci/cd") && !normalizedSkills.includes("github actions")) missing.push("CI/CD Automation Pipelines");
  if (missing.length === 0) missing.push("System Design Patterns", "Microservices Architecture");

  return {
    missingSkills: missing,
    recommendedLearningPath: [
      `1. Master Containerization basics with ${missing[0] || 'Docker'}`,
      "2. Integrate automated testing in existing repositories",
      "3. Set up automated linting and tests running via GitHub Actions workflows",
      "4. Deploy and host backend servers utilizing scalable cloud architecture services"
    ],
    recommendedCourses: [
      `DevOps BootCamp: Zero to Docker & Kubernetes`,
      `Testing JavaScript Applications: Unit, Integration, and E2E`
    ],
    practiceProjects: [
      "Containerized microservices-based REST API deployed to AWS EC2",
      "CI/CD workflow configured repo executing lint checks and unit tests on commit"
    ],
    timeline: "4 - 6 weeks of dedicated study (10-15 hours/week)"
  };
};

/**
 * 6. AI Mock Interview Generator
 */
exports.generateMockInterview = async (tech, experience, role, difficulty) => {
  const prompt = `Generate 4 interview questions. Technology: ${tech}, Level: ${experience}, Role: ${role}, Difficulty: ${difficulty}.`;
  const systemInstruction = `You are a Technical Lead. Generate a mock interview JSON structure: { questions: [ { id: number, question: string, type: "Technical" | "Behavioral" | "HR", idealAnswerOutline: string } ] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
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
        question: `How do you handle application-wide state management and prevent component re-render performance bottlenecks?`,
        type: "Technical",
        idealAnswerOutline: "Explain state localization, useMemo/useCallback, state selectors in Zustand/Redux, context optimization, and immutable data flow."
      },
      {
        id: 3,
        question: "Describe a project scenario where you hit a blocker. What specific steps did you take to resolve it?",
        type: "Behavioral",
        idealAnswerOutline: "Apply the STAR method. Describe the Situation, the Task at hand, the Action steps (research, collaboration), and the resulting metrics or learnings."
      },
      {
        id: 4,
        question: "Why do you want to work at this specific platform as a candidate, and where do you envision your skills in 3 years?",
        type: "HR",
        idealAnswerOutline: "Highlight alignment with company goals, dedication to technical excellence, and plans to advance into architectural or leadership roles."
      }
    ]
  };
};

/**
 * 7. AI Quiz Generator
 */
exports.generateQuiz = async (courseName, topic, difficulty) => {
  const prompt = `Generate a 4-question quiz. Course: ${courseName}, Topic: ${topic}, Difficulty: ${difficulty}.`;
  const systemInstruction = `You are a Course Instructor. Generate a JSON quiz structure: { quizTitle: string, questions: [ { id: number, question: string, options: [string], correctAnswerIndex: number, explanation: string } ] }.`;

  const geminiResponse = await callGemini(prompt, systemInstruction);
  if (geminiResponse) return geminiResponse;

  // Local fallback simulation
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
    ]
  };
};

/**
 * 8. Placement Probability Predictor
 */
exports.predictPlacementProbability = (metrics) => {
  // metrics: { cgpa, skillsCount, projectsCount, certificationsCount, mockInterviewScore, resumeScore, codingChallengesScore }
  const {
    cgpa = 7.0,
    skillsCount = 3,
    projectsCount = 1,
    certificationsCount = 0,
    mockInterviewScore = 60,
    resumeScore = 60,
    codingChallengesScore = 10
  } = metrics;

  // Predict logic: standard weighted formula
  let baseScore = 30; // base probability
  
  // CGPA impact (out of 10)
  baseScore += (parseFloat(cgpa) - 5) * 6; // up to +30% for 10 CGPA
  
  // Skills impact (max 10 skills factored)
  baseScore += Math.min(skillsCount, 10) * 2; // up to +20%
  
  // Projects impact
  baseScore += Math.min(projectsCount, 5) * 4; // up to +20%

  // Certifications
  baseScore += Math.min(certificationsCount, 4) * 2.5; // up to +10%

  // Interview & Resume (average scores above 60 give bonuses)
  const avgPerformance = (parseFloat(mockInterviewScore) + parseFloat(resumeScore)) / 2;
  if (avgPerformance > 80) baseScore += 10;
  else if (avgPerformance > 65) baseScore += 5;

  // Coding challenges score
  baseScore += Math.min(codingChallengesScore / 10, 10); // up to +10%

  const finalProbability = Math.max(0, Math.min(Math.round(baseScore), 98)); // Cap at 98% because there are no 100% guarantees in recruitment

  // Generate suggestions based on weakest areas
  const suggestions = [];
  const missingSkills = [];

  if (parseFloat(cgpa) < 7.5) {
    suggestions.push("Academic performance is slightly below benchmark. Focus on boosting CGPA in coming semesters or balance it with exceptional project work.");
  }
  if (skillsCount < 6) {
    suggestions.push("Expand your skill profile. Learn advanced frameworks, state management, or container tools.");
    missingSkills.push("Redux/Zustand", "Docker", "Typescript");
  }
  if (projectsCount < 3) {
    suggestions.push("Increase your portfolio size. Recruiters look for at least 3 distinct deployed projects with readme files.");
  }
  if (parseFloat(resumeScore) < 75) {
    suggestions.push("Optimize your resume using direct action verbs and quantifiable results to pass ATS scanners.");
  }
  if (parseFloat(mockInterviewScore) < 70) {
    suggestions.push("Practice mock interviews with specialized questions in mock interview console to improve structural coding explanations.");
  }

  return {
    placementProbability: finalProbability,
    rating: finalProbability >= 85 ? "High Placement Ready" : finalProbability >= 65 ? "Moderate Placement Ready" : "Low Placement Ready",
    suggestions,
    missingSkills
  };
};
