import { buildCourseCacheKey, normalizeString } from '../cacheUtils.js';

function runTests() {
  console.log('--- Running Stage 1 Architecture Unit Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`` + `✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`` + `❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Standard public course generates valid cache key
  const publicKey = buildCourseCacheKey('React Hooks', 'Intermediate', { duration: 'Standard' });
  assert(publicKey !== null && publicKey.includes('react_hooks'), 'Standard public course generates a valid cache key');

  // Test 2: ragMode: true returns null (never cached globally)
  const ragKey = buildCourseCacheKey('React Hooks', 'Intermediate', { ragMode: true, source: 'http://youtube.com/watch' });
  assert(ragKey === null, 'ragMode: true returns null cache key');

  // Test 3: isPrivate: true returns null
  const privateKey = buildCourseCacheKey('React Hooks', 'Intermediate', { isPrivate: true });
  assert(privateKey === null, 'isPrivate: true returns null cache key');

  // Test 4: hasUserSourceMaterial: true returns null
  const sourceMaterialKey = buildCourseCacheKey('React Hooks', 'Intermediate', { hasUserSourceMaterial: true });
  assert(sourceMaterialKey === null, 'hasUserSourceMaterial: true returns null cache key');

  // Test 5: isPersonalized: true returns null
  const personalizedKey = buildCourseCacheKey('React Hooks', 'Intermediate', { isPersonalized: true });
  assert(personalizedKey === null, 'isPersonalized: true returns null cache key');

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
