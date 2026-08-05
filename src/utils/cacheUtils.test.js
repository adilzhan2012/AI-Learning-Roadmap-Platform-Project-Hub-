import { 
  normalizeString, 
  buildCourseCacheKey, 
  buildLessonCacheKey, 
  CACHE_VERSION 
} from './cacheUtils.js';

function runCacheTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: String normalization
  {
    const input = "  Python   for   Data   Science  ";
    const expected = "python for data science";
    assert(normalizeString(input) === expected, 'String normalization test');
  }

  // Test 2: Deterministic course cache key
  {
    const topic = "Machine Learning";
    const level = "Intermediate";
    const prefs = { duration: "Standard", courseStyle: "Friendly" };
    
    const key1 = buildCourseCacheKey(topic, level, prefs);
    const key2 = buildCourseCacheKey("  machine   learning  ", "INTERMEDIATE", { duration: "standard", courseStyle: "friendly" });

    assert(key1 === key2, 'Deterministic course cache key matching');
    assert(key1.includes(`v${CACHE_VERSION}`), 'Cache key includes version');
  }

  // Test 3: Lesson cache key
  {
    const key = buildLessonCacheKey(5);
    assert(key === 'lesson_node_5', 'Lesson cache key generation');
  }

  console.log(`\nCache Utils Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCacheTests();
