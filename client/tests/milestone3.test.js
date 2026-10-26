import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(__dirname, '..', '..', 'server');

test('CAREERNEST PHASE 4 - MILESTONE 3: AI TRANSPARENCY & CRITICAL UX REMEDIATION', async (t) => {
  await t.test('1. AI Fallback Transparency: All 6 designated AI pages integrate FallbackDisclosure and handle simulation metadata', async () => {
    const aiPages = [
      {
        file: 'AIJobAnalyzer.jsx',
        checks: [
          /FallbackDisclosure/,
          /isSimulated=\{analysis\.isSimulatedFallback \?\? true\}/,
          /engineName=\{analysis\.aiEngine/
        ]
      },
      {
        file: 'AIMockInterview.jsx',
        checks: [
          /FallbackDisclosure/,
          /isSimulated=\{aiMetadata\.isSimulatedFallback\}/,
          /engineName=\{aiMetadata\.aiEngine/
        ]
      },
      {
        file: 'AIRoadmap.jsx',
        checks: [
          /FallbackDisclosure/,
          /isSimulated=\{activeRoadmap\.isSimulatedFallback \?\? true\}/,
          /engineName=\{activeRoadmap\.aiEngine/
        ]
      },
      {
        file: 'AISkillGap.jsx',
        checks: [
          /FallbackDisclosure/,
          /isSimulated=\{gapData\?\.isSimulatedFallback \?\? true\}/,
          /engineName=\{gapData\?\.aiEngine/
        ]
      },
      {
        file: 'AIQuiz.jsx',
        checks: [
          /FallbackDisclosure/,
          /isSimulated=\{quiz\.isSimulatedFallback \?\? true\}/,
          /engineName=\{quiz\.aiEngine/
        ]
      },
      {
        file: 'AIResume.jsx',
        checks: [
          /FallbackDisclosure/,
          /isSimulated=\{analysis\.isSimulatedFallback \?\? true\}/,
          /engineName=\{analysis\.aiEngine/
        ]
      }
    ];

    for (const { file, checks } of aiPages) {
      const filePath = path.join(clientRoot, 'src', 'pages', file);
      assert.ok(fs.existsSync(filePath), `${file} must exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      for (const check of checks) {
        assert.match(content, check, `${file} must satisfy ${check}`);
      }
    }
  });

  await t.test('2. Backend AI Metadata: aiController passes isSimulatedFallback and aiEngine in responses', async () => {
    const aiControllerPath = path.join(serverRoot, 'controllers', 'aiController.js');
    assert.ok(fs.existsSync(aiControllerPath), 'aiController.js must exist');
    const content = fs.readFileSync(aiControllerPath, 'utf8');

    assert.match(content, /isSimulatedFallback:\s*roadmapData\.isSimulatedFallback/, 'generateRoadmap passes isSimulatedFallback');
    assert.match(content, /isSimulatedFallback:\s*quizData\.isSimulatedFallback/, 'generateCourseQuiz passes isSimulatedFallback');
    assert.match(content, /\.\.\.rawAnalysis/, 'skillGapAnalysis preserves rawAnalysis fallback metadata');
  });

  await t.test('3. Dashboard Error & Safe Retry States: All 4 targeted views feature explicit user-facing error & retry handling', async () => {
    const dashboardViews = [
      {
        file: 'StudentDashboard.jsx',
        checks: [/Alert/, /EmptyState/, /Spinner/, /Button/, /isRetrying/, /Promise\.allSettled/, /Retry/]
      },
      {
        file: 'MentorDashboard.jsx',
        checks: [/Alert/, /EmptyState/, /Spinner/, /Button/, /isRetrying/, /Promise\.allSettled/, /handleUpdateStatus/, /Retry/]
      },
      {
        file: 'AdminDashboard.jsx',
        checks: [/Alert/, /EmptyState/, /Spinner/, /Button/, /isRetrying/, /handleApproveMentor/, /Retry/]
      },
      {
        file: 'AISkillGap.jsx',
        checks: [/Alert/, /EmptyState/, /Spinner/, /Button/, /fetchGapAnalysis/, /Retry/]
      }
    ];

    for (const { file, checks } of dashboardViews) {
      const filePath = path.join(clientRoot, 'src', 'pages', file);
      assert.ok(fs.existsSync(filePath), `${file} must exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      for (const check of checks) {
        assert.match(content, check, `${file} must contain ${check}`);
      }
    }
  });

  await t.test('4. Connected Workflows: Valid cross-feature next steps are implemented with actual routes', async () => {
    const workflowConnections = [
      {
        file: 'AIJobAnalyzer.jsx',
        destinations: ['/ai-gap', '/ai-interview']
      },
      {
        file: 'AIMockInterview.jsx',
        destinations: ['/challenges', '/courses', '/dashboard']
      },
      {
        file: 'AIRoadmap.jsx',
        destinations: ['/courses', '/ai-interview']
      },
      {
        file: 'AISkillGap.jsx',
        destinations: ['/ai-roadmap', '/courses', '/ai-interview']
      },
      {
        file: 'AIQuiz.jsx',
        destinations: ['/challenges', '/ai-interview', '/courses']
      },
      {
        file: 'AIResume.jsx',
        destinations: ['/passport', '/profile', '/ai-job-analyzer']
      }
    ];

    for (const { file, destinations } of workflowConnections) {
      const filePath = path.join(clientRoot, 'src', 'pages', file);
      const content = fs.readFileSync(filePath, 'utf8');
      for (const dest of destinations) {
        assert.ok(content.includes(`'${dest}'`) || content.includes(`"${dest}"`), `${file} must link to existing route ${dest}`);
      }
    }
  });
});
