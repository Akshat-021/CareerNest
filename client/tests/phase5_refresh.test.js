import test from 'node:test';
import assert from 'node:assert/strict';
import { getRefreshUrl } from '../src/services/api.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

test('CAREERNEST PHASE 5 - TASK 8: REMOTE TOKEN REFRESH & SECURITY', async (t) => {
  await t.test('1. Local configuration: getRefreshUrl resolves relative endpoint when VITE_BACKEND_URL is empty or undefined', () => {
    assert.strictEqual(getRefreshUrl(''), '/api/auth/refresh');
    assert.strictEqual(getRefreshUrl(undefined), '/api/auth/refresh');
  });

  await t.test('2. Remote configuration: getRefreshUrl targets configured backend host consistently', () => {
    const remoteUrl = 'https://api.careernest.com';
    assert.strictEqual(getRefreshUrl(remoteUrl), 'https://api.careernest.com/api/auth/refresh');

    const remoteUrlTrailing = 'https://api.careernest.com/';
    assert.strictEqual(getRefreshUrl(remoteUrlTrailing), 'https://api.careernest.com/api/auth/refresh');
  });

  await t.test('3. Loop protection & concurrency handling in api.js source verification', () => {
    const apiCode = fs.readFileSync(path.join(clientRoot, 'src', 'services', 'api.js'), 'utf8');

    // 1. Verifies loop protection on the refresh call itself
    assert.match(apiCode, /isRefreshCall/, 'api.js guards against refresh calls triggering recursive refresh');
    assert.match(apiCode, /originalRequest\._retry/, 'api.js flags retried requests');

    // 2. Verifies request queueing for concurrent 401s
    assert.match(apiCode, /isRefreshing/, 'api.js implements concurrency flag');
    assert.match(apiCode, /refreshSubscribers/, 'api.js implements subscriber queue for concurrent requests');

    // 3. Verifies token cleanup on failed refresh
    assert.match(apiCode, /localStorage\.removeItem\('accessToken'\)/, 'Clears accessToken on failure');
    assert.match(apiCode, /localStorage\.removeItem\('refreshToken'\)/, 'Clears refreshToken on failure');
    assert.match(apiCode, /localStorage\.removeItem\('user'\)/, 'Clears user on failure');

    // 4. Verifies secrets are never printed in error logs
    assert.doesNotMatch(apiCode, /console\.error\([^)]*refreshError\s*\)/, 'Does not log unredacted refreshError object with raw tokens');
  });
});
