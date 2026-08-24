const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { evaluatePlanLimits } = require('../index.js');

describe('evaluatePlanLimits 9-combination unit tests', () => {
  // 1. FREE x global
  test('1. FREE x global: allows within daily limit (4/5)', () => {
    const res = evaluatePlanLimits({
      plan: 'FREE',
      usageType: 'mentor_message',
      usage: { mentorMessagesUsed: 4 },
      daysSinceReg: 30
    });
    assert.equal(res.allowed, true);
    assert.equal(res.isProSoftCapped, false);
    assert.equal(res.model, 'gemini-2.5-flash');
    assert.equal(res.updatedUsageCount, 5);
  });

  test('1. FREE x global: blocks when daily limit reached (5/5)', () => {
    const res = evaluatePlanLimits({
      plan: 'FREE',
      usageType: 'mentor_message',
      usage: { mentorMessagesUsed: 5 },
      daysSinceReg: 30
    });
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'PLAN_LIMIT_EXCEEDED');
  });

  // 2. FREE x lesson
  test('2. FREE x lesson: allows under 3 messages on lesson', () => {
    const res = evaluatePlanLimits({
      plan: 'FREE',
      usageType: 'contextual_mentor_message',
      lessonMessagesUsed: 2
    });
    assert.equal(res.allowed, true);
    assert.equal(res.updatedUsageCount, 3);
  });

  test('2. FREE x lesson: blocks at 3 messages with LESSON_MENTOR_LIMIT_EXCEEDED', () => {
    const res = evaluatePlanLimits({
      plan: 'FREE',
      usageType: 'contextual_mentor_message',
      lessonMessagesUsed: 3
    });
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'LESSON_MENTOR_LIMIT_EXCEEDED');
  });

  // 3. FREE x homework
  test('3. FREE x homework: blocks when monthly homework reviews exceed 2', () => {
    const res = evaluatePlanLimits({
      plan: 'FREE',
      usageType: 'homework_review',
      usage: { homeworkReviewsUsed: 2 }
    });
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'PLAN_LIMIT_EXCEEDED');
  });

  // 4. PRO x global (under soft-cap)
  test('4. PRO x global: routes complex queries to gemini-2.5-pro when not soft-capped', () => {
    const res = evaluatePlanLimits({
      plan: 'PRO',
      usageType: 'mentor_message',
      usage: { mentorMessagesUsed: 10 },
      userQuery: 'Объясни мне подробно устройство рантайма Node.js'
    });
    assert.equal(res.allowed, true);
    assert.equal(res.isProSoftCapped, false);
    assert.equal(res.model, 'gemini-2.5-pro');
    assert.equal(res.updatedUsageCount, 11);
  });

  // 4. PRO x global (over soft-cap)
  test('4. PRO x global: routes to gemini-2.5-flash when soft-capped (>= 50 messages)', () => {
    const res = evaluatePlanLimits({
      plan: 'PRO',
      usageType: 'mentor_message',
      usage: { mentorMessagesUsed: 50 },
      userQuery: 'Объясни мне подробно устройство рантайма Node.js'
    });
    assert.equal(res.allowed, true);
    assert.equal(res.isProSoftCapped, true);
    assert.equal(res.model, 'gemini-2.5-flash');
    assert.equal(res.updatedUsageCount, 51);
  });

  // 5. PRO x lesson
  test('5. PRO x lesson: allows unlimited messages on lesson', () => {
    const res = evaluatePlanLimits({
      plan: 'PRO',
      usageType: 'contextual_mentor_message',
      lessonMessagesUsed: 40
    });
    assert.equal(res.allowed, true);
    assert.equal(res.updatedUsageCount, 41);
  });

  // 6. PRO x homework
  test('6. PRO x homework: blocks when monthly reviews exceed 30', () => {
    const res = evaluatePlanLimits({
      plan: 'PRO',
      usageType: 'homework_review',
      usage: { homeworkReviewsUsed: 30 }
    });
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'PLAN_LIMIT_EXCEEDED');
  });

  // 7. ULTRA x global
  test('7. ULTRA x global: allows requests when ultraTokensUsed < 300,000', () => {
    const res = evaluatePlanLimits({
      plan: 'ULTRA',
      usageType: 'mentor_message',
      usage: { ultraTokensUsed: 150000 }
    });
    assert.equal(res.allowed, true);
    assert.equal(res.model, 'gemini-2.5-pro');
  });

  // 8. ULTRA x lesson
  test('8. ULTRA x lesson: allows lesson queries under token limit', () => {
    const res = evaluatePlanLimits({
      plan: 'ULTRA',
      usageType: 'contextual_mentor_message',
      usage: { ultraTokensUsed: 50000 }
    });
    assert.equal(res.allowed, true);
    assert.equal(res.model, 'gemini-2.5-pro');
  });

  // 9. ULTRA x homework
  test('9. ULTRA x homework: blocks when daily token limit of 300,000 is reached', () => {
    const res = evaluatePlanLimits({
      plan: 'ULTRA',
      usageType: 'homework_review',
      usage: { ultraTokensUsed: 300000 }
    });
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'PLAN_LIMIT_EXCEEDED');
  });
});
