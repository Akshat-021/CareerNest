/**
 * Regression Tests: Phase 3 AI Integration & Fallback Resilience
 * Covers:
 * 1. Safe operation when GEMINI_API_KEY is unconfigured (zero crashes across all 11 AI features)
 * 2. Timeout protection and graceful failure recovery in callGemini
 * 3. Error message secret sanitization (API keys / tokens never exposed in logs)
 * 4. Resilient JSON extraction from Markdown-wrapped model outputs
 * 5. Input length clamping preventing prompt exhaustion
 * 6. Fallback transparency disclosures (isSimulatedFallback: true)
 * 7. Real document skill extraction in analyzeResume
 */

const assert = require('assert');
const aiService = require('../services/gemini');

console.log('\n=========================================');
console.log('CAREERNEST: PHASE 3 AI INTEGRATION & RESILIENCE TESTS');
console.log('=========================================\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${name}`);
    console.error(`  Reason: ${err.message}`);
    failed++;
  }
}

async function runAiIntegrationTests() {
  // ---------------------------------------------------------
  // 1. Secret Sanitization in Error Logs
  // ---------------------------------------------------------
  await test('sanitizeErrorMessage redacts sensitive API keys and authorization headers', () => {
    const rawErrorWithKey = 'API error: https://generativelanguage.googleapis.com/v1/models?key=AIzaSyFakeSecretKey123456789 - Quota Exceeded';
    const sanitizedKey = aiService._sanitizeErrorMessage(rawErrorWithKey);
    assert.ok(!sanitizedKey.includes('AIzaSyFakeSecretKey123456789'), 'Secret key must be redacted');
    assert.ok(sanitizedKey.includes('[REDACTED]'), 'Must replace with [REDACTED]');

    const rawErrorWithBearer = 'Unauthorized request with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyPayload';
    const sanitizedBearer = aiService._sanitizeErrorMessage(rawErrorWithBearer);
    assert.ok(!sanitizedBearer.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'Bearer token must be redacted');
  });

  // ---------------------------------------------------------
  // 2. Resilient JSON Parsing from LLM Output
  // ---------------------------------------------------------
  await test('cleanJsonResponse cleanly extracts JSON from Markdown-fenced code blocks', () => {
    const rawFenced = '```json\n{\n  "score": 95,\n  "rating": "Excellent"\n}\n```';
    const cleaned = aiService._cleanJsonResponse(rawFenced);
    const parsed = JSON.parse(cleaned);
    assert.strictEqual(parsed.score, 95);
    assert.strictEqual(parsed.rating, 'Excellent');

    const rawFencedNoLang = '```\n{"success": true}\n```';
    const cleanedNoLang = aiService._cleanJsonResponse(rawFencedNoLang);
    assert.strictEqual(JSON.parse(cleanedNoLang).success, true);
  });

  // ---------------------------------------------------------
  // 3. Timeout Protection in callGemini
  // ---------------------------------------------------------
  await test('callGemini times out and cascades to fallback if model call hangs', async () => {
    // Inject a stalled mock model that never resolves
    const stalledModel = {
      generateContent: () => new Promise(() => {}) // Stalls forever
    };

    aiService._setGeminiModel(stalledModel);

    // Call with a 100ms timeout
    const result = await aiService._callGemini('Prompt test', 'Instruction', 100);
    assert.strictEqual(result, null, 'Stalled API call should return null and trigger fallback');

    // Restore
    aiService._setGeminiModel(null);
  });

  // ---------------------------------------------------------
  // 4. Input Clamping & Error Recovery
  // ---------------------------------------------------------
  await test('callGemini clamps oversized prompt text to prevent buffer overflow', async () => {
    let capturedPrompt = '';
    const mockModel = {
      generateContent: async ({ contents }) => {
        capturedPrompt = contents[0].parts[0].text;
        return {
          response: {
            text: () => JSON.stringify({ ok: true })
          }
        };
      }
    };

    aiService._setGeminiModel(mockModel);

    const oversizedString = 'A'.repeat(30000); // 30,000 chars
    const result = await aiService._callGemini(oversizedString, '', 5000);
    assert.strictEqual(result.ok, true);
    assert.ok(capturedPrompt.length < 20000, 'Captured prompt must be clamped under 20,000 chars');

    aiService._setGeminiModel(null);
  });

  // ---------------------------------------------------------
  // 5. Zero-Crash Execution Across All AI Features Without GEMINI_API_KEY
  // ---------------------------------------------------------
  await test('All 11 AI features execute safely with transparent fallback metadata when GEMINI_API_KEY is absent', async () => {
    // 1. Course Recommendations
    const recs = await aiService.generateRecommendations({
      currentSkills: ['React', 'JavaScript'],
      careerGoal: 'Frontend Developer'
    });
    assert.ok(Array.isArray(recs.recommendations));
    assert.strictEqual(recs.isSimulatedFallback, true);

    // 2. Career Roadmap
    const roadmap = await aiService.generateCareerRoadmap('Web Development');
    assert.strictEqual(roadmap.track, 'Web Development');
    assert.strictEqual(roadmap.isSimulatedFallback, true);

    // 3. Job Description Analyzer
    const jobAnalysis = await aiService.analyzeJobDescription('Looking for a React and Node developer with Docker experience', ['React']);
    assert.ok(jobAnalysis.matchedSkills.includes('React'));
    assert.strictEqual(jobAnalysis.isSimulatedFallback, true);

    // 4. Job-Specific Roadmap
    const jobRoadmap = await aiService.generateJobSpecificRoadmap('Frontend Engineer', ['TypeScript', 'Docker']);
    assert.ok(Array.isArray(jobRoadmap.modules));
    assert.strictEqual(jobRoadmap.isSimulatedFallback, true);

    // 5. Chatbot Response
    const chat = await aiService.getChatbotResponse('How do I improve my readiness score?', [], { readinessScore: { overallReadiness: 60 } });
    assert.ok(chat.answer.length > 20);
    assert.ok(Array.isArray(chat.suggestedActions));
    assert.strictEqual(chat.isSimulatedFallback, true);

    // 6. Mock Interview Evaluation
    const interviewEval = await aiService.evaluateMockInterviewAnswer(
      'Explain virtual DOM',
      'The virtual DOM is a lightweight copy of the real DOM because it batches updates.',
      'React',
      'Frontend Engineer'
    );
    assert.ok(typeof interviewEval.overallScore === 'number');
    assert.strictEqual(interviewEval.isSimulatedFallback, true);

    // 7. Mock Interview Question Generation
    const mockInterview = await aiService.generateMockInterview('Node.js', 'Intermediate', 'Backend Engineer', 'Medium');
    assert.ok(mockInterview.questions.length === 4);
    assert.strictEqual(mockInterview.isSimulatedFallback, true);

    // 8. Quiz Generation
    const quiz = await aiService.generateQuiz('Node.js', 'Event Loop', 'Medium');
    assert.ok(quiz.questions.length === 4);
    assert.strictEqual(quiz.isSimulatedFallback, true);

    // 9. Cover Letter Generation
    const coverLetter = await aiService.generateCoverLetter({ company: 'Google', position: 'SWE' }, { name: 'Alex', skills: ['React', 'Node'] });
    assert.ok(coverLetter.coverLetter.includes('Google'));
    assert.strictEqual(coverLetter.isSimulatedFallback, true);

    // 10. Resume ATS Evaluation
    const resumeEval = await aiService.analyzeResume('Alex Rivera - Software Engineer proficient in React, Node.js, and Docker.', 'Software Engineer');
    assert.ok(resumeEval.atsScore >= 35 && resumeEval.atsScore <= 95);
    assert.strictEqual(resumeEval.isSimulatedFallback, true);

    // 11. Mentor Matching
    const mentorMatch = aiService.calculateMentorMatch(
      { mentorProfile: { expertise: ['React', 'Node.js'], rating: 4.9, reviewsCount: 15 } },
      { targetRole: 'Software Engineer', skills: ['React'] }
    );
    assert.ok(mentorMatch.matchScore >= 60);
    assert.strictEqual(mentorMatch.isSimulatedFallback, false);
    assert.strictEqual(mentorMatch.aiEngine, 'deterministic-scoring-algorithm');
  });

  console.log('\n=========================================');
  console.log(`AI INTEGRATION TESTS FINISHED: ${passed} passed, ${failed} failed`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAiIntegrationTests().catch((err) => {
  console.error('AI integration test runner crashed:', err);
  process.exit(1);
});
