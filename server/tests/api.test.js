/**
 * Automated API Test Runner
 * Verifies key authentication, AI intelligence, and platform endpoints.
 */

require('dotenv').config();
const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n=========================================');
  console.log('STARTING CAREERNEST AUTOMATED API CHECKS');
  console.log('=========================================');

  let successCount = 0;
  let failCount = 0;

  const testCases = [
    // 1: Base Health Check
    {
      name: 'Server Base Health Check',
      fn: async () => {
        const res = await fetch(`http://localhost:${PORT}/`);
        const data = await res.json();
        if (res.status === 200 && data.message) {
          return { success: true };
        }
        return { success: false, reason: `Status: ${res.status}, Message: ${JSON.stringify(data)}` };
      }
    },
    // 2: Load Public Courses
    {
      name: 'Fetch Courses Endpoint',
      fn: async () => {
        const res = await fetch(`${BASE_URL}/courses`);
        const data = await res.json();
        if (res.status === 200 && data.success && Array.isArray(data.courses)) {
          return { success: true, detail: `Found ${data.courses.length} courses.` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    },
    // 3: Verify Login Authentication
    {
      name: 'Student Account Login Authentication',
      fn: async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alex@student.com',
            password: 'password123'
          })
        });
        const data = await res.json();
        if (res.status === 200 && data.success && data.accessToken) {
          global.testAccessToken = data.accessToken;
          return { success: true };
        }
        return { success: false, reason: `Status: ${res.status}, Msg: ${data.message}` };
      }
    },
    // 4: Central Career Profile & 7-Factor Readiness
    {
      name: 'Central Career Profile & 7-Factor Readiness Score',
      fn: async () => {
        if (!global.testAccessToken) return { success: false, reason: 'Auth token missing' };
        const res = await fetch(`${BASE_URL}/ai/career-profile`, {
          headers: { 'Authorization': `Bearer ${global.testAccessToken}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.success && data.profile?.readinessScore) {
          return { success: true, detail: `Overall Readiness: ${data.profile.readinessScore.overallReadiness}%, Category: ${data.profile.readinessScore.ratingCategory}` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    },
    // 5: Job Description Intelligence & Matcher
    {
      name: 'AI Job Description Analyzer & Matcher',
      fn: async () => {
        if (!global.testAccessToken) return { success: false, reason: 'Auth token missing' };
        const res = await fetch(`${BASE_URL}/ai/analyze-job`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.testAccessToken}`
          },
          body: JSON.stringify({
            jobText: 'We are hiring a Full Stack React and Node.js engineer with experience in Docker, AWS, and MongoDB to build scalable microservices.'
          })
        });
        const data = await res.json();
        if (res.status === 200 && data.success && typeof data.analysis?.matchScore === 'number') {
          return { success: true, detail: `Job Match: ${data.analysis.matchScore}%, Extracted: ${data.analysis.requiredSkills.length} skills.` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    },
    // 6: Context-Aware Aura Copilot
    {
      name: 'Context-Aware Aura Copilot Chatbot',
      fn: async () => {
        if (!global.testAccessToken) return { success: false, reason: 'Auth token missing' };
        const res = await fetch(`${BASE_URL}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.testAccessToken}`
          },
          body: JSON.stringify({
            message: 'How can I improve my Career Readiness Score?'
          })
        });
        const data = await res.json();
        if (res.status === 200 && data.success && data.answer) {
          return { success: true, detail: `Answer received with ${data.platformActions?.length || 0} platform actions.` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    },
    // 7: Mentors with AI Compatibility Calculation
    {
      name: 'Mentors Discovery with AI Match Calculation',
      fn: async () => {
        if (!global.testAccessToken) return { success: false, reason: 'Auth token missing' };
        const res = await fetch(`${BASE_URL}/mentors`, {
          headers: { 'Authorization': `Bearer ${global.testAccessToken}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.success && Array.isArray(data.mentors)) {
          const topMentor = data.mentors[0];
          return { success: true, detail: `Found ${data.mentors.length} mentors. Top match: ${topMentor?.aiMatchScore || 'N/A'}%` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    },
    // 8: Peer Study Pods
    {
      name: 'Peer Study Pods Endpoint',
      fn: async () => {
        if (!global.testAccessToken) return { success: false, reason: 'Auth token missing' };
        const res = await fetch(`${BASE_URL}/platform/study-pods`, {
          headers: { 'Authorization': `Bearer ${global.testAccessToken}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.success && Array.isArray(data.pods)) {
          return { success: true, detail: `Active Pods: ${data.pods.length}` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    },
    // 9: AI Micro-Internships
    {
      name: 'AI Micro-Internships Endpoint',
      fn: async () => {
        if (!global.testAccessToken) return { success: false, reason: 'Auth token missing' };
        const res = await fetch(`${BASE_URL}/platform/micro-internships`, {
          headers: { 'Authorization': `Bearer ${global.testAccessToken}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.success && Array.isArray(data.internships)) {
          return { success: true, detail: `Active Simulations: ${data.internships.length}` };
        }
        return { success: false, reason: `Status: ${res.status}, Data: ${JSON.stringify(data)}` };
      }
    }
  ];

  for (const tc of testCases) {
    try {
      const result = await tc.fn();
      if (result.success) {
        successCount++;
        console.log(`✅ [PASS] ${tc.name} ${result.detail ? `(${result.detail})` : ''}`);
      } else {
        failCount++;
        console.error(`❌ [FAIL] ${tc.name} - Reason: ${result.reason}`);
      }
    } catch (error) {
      failCount++;
      console.error(`❌ [FAIL] ${tc.name} - Error: ${error.message}`);
    }
  }

  console.log('=========================================');
  console.log(`TEST SUMMARY: Passed: ${successCount} | Failed: ${failCount}`);
  console.log('=========================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
