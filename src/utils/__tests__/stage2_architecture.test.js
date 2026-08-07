import { normalizeTopic, buildCourseCacheKey, PROMPT_VERSION } from '../cacheUtils.js';
import { 
  ALLOWED_GRADIENTS, 
  validateOrFallbackGradient, 
  sanitizeImageKeyword, 
  validateLessonContent 
} from '../coursePipelineUtils.js';

function runStage2Tests() {
  console.log('--- Running Stage 2 Architecture Unit Tests ---');
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

  // Test 1: normalizeTopic removes stop words
  const norm1 = normalizeTopic('Курс по React Hooks для начинающих');
  assert(norm1 === 'react hooks', `normalizeTopic cleans stop words ('${norm1}' === 'react hooks')`);

  const norm2 = normalizeTopic('Tutorial on Python from scratch');
  assert(norm2 === 'python', `normalizeTopic cleans English stop words ('${norm2}' === 'python')`);

  // Test 2: promptVersion is included in cache key
  const cacheKey = buildCourseCacheKey('React', 'Beginner');
  assert(cacheKey.includes(`p${PROMPT_VERSION}`), `buildCourseCacheKey includes prompt version p${PROMPT_VERSION}`);

  // Test 3: validateOrFallbackGradient accepts valid gradients
  const validGrad = ALLOWED_GRADIENTS[0];
  assert(validateOrFallbackGradient(validGrad) === validGrad, 'validateOrFallbackGradient accepts valid gradient');

  // Test 4: validateOrFallbackGradient falls back to valid gradient on invalid input
  const invalidGrad = 'bg-red-500 text-black random-class';
  const fallbackGrad = validateOrFallbackGradient(invalidGrad, 'React');
  assert(ALLOWED_GRADIENTS.includes(fallbackGrad), 'validateOrFallbackGradient falls back to allowlisted gradient');

  // Test 5: sanitizeImageKeyword removes unsafe / forbidden words
  assert(sanitizeImageKeyword('Python (programming language)') === 'Python (programming language)', 'sanitizeImageKeyword leaves safe keywords intact');
  assert(sanitizeImageKeyword('nude photo') === 'Education', 'sanitizeImageKeyword sanitizes unsafe keyword to Education');

  // Test 6: validateLessonContent checks required sections
  const validLesson = `# Title
Some content
## Практика / Домашнее задание
1. Task 1
---FLASHCARD---
Term: X
Def: Y
---`;
  assert(validateLessonContent(validLesson).valid === true, 'validateLessonContent approves complete lesson');

  const invalidLesson = `# Title
No practice or flashcards`;
  const valResult = validateLessonContent(invalidLesson);
  assert(valResult.valid === false && valResult.errors.length >= 2, 'validateLessonContent rejects incomplete lesson');

  console.log(`\nStage 2 Tests Completed: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStage2Tests();
