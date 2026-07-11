/**
 * Automated API Test Runner
 * Verifies key authentication and data retrieval endpoints.
 */

require('dotenv').config();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n=========================================');
  console.log('STARTING AUTOMATED API CHECKS');
  console.log('=========================================');

  let successCount = 0;
  let failCount = 0;

  const testCases = [
    // Test Case 1: Check Server Status
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
    // Test Case 2: Load Public Courses
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
    // Test Case 3: Verify Login Authentication
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
          global.testAccessToken = data.accessToken; // Cache for protected routes
          return { success: true };
        }
        return { success: false, reason: `Status: ${res.status}, Msg: ${data.message}` };
      }
    },
    // Test Case 4: Verify Protected AI Recommendation Route
    {
      name: 'Protected AI Course Recommendation Route',
      fn: async () => {
        if (!global.testAccessToken) {
          return { success: false, reason: 'Skipped - Login authentication failed.' };
        }
        const res = await fetch(`${BASE_URL}/ai/recommend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.testAccessToken}`
          }
        });
        const data = await res.json();
        if (res.status === 200 && data.success && Array.isArray(data.recommendations)) {
          return { success: true, detail: `Received ${data.recommendations.length} recommendations.` };
        }
        return { success: false, reason: `Status: ${res.status}, Msg: ${data.message}` };
      }
    },
    // Test Case 5: Verify AI Placement Predictor
    {
      name: 'AI Placement Probability Predictor Route',
      fn: async () => {
        if (!global.testAccessToken) {
          return { success: false, reason: 'Skipped - Login authentication failed.' };
        }
        const res = await fetch(`${BASE_URL}/ai/predict`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${global.testAccessToken}`
          }
        });
        const data = await res.json();
        if (res.status === 200 && data.success && typeof data.placementProbability === 'number') {
          return { success: true, detail: `Probability: ${data.placementProbability}%, Rating: ${data.rating}` };
        }
        return { success: false, reason: `Status: ${res.status}, Msg: ${data.message}` };
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

// Check if running directly or if server needs to boot
runTests();
