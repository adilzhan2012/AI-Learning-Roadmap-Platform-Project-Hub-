const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getGlobalPrompt, getPlanCourseInstruction } = require('../../modes/globalPrompt.js');

describe('modes/globalPrompt unit tests', () => {
  test('ULTRA plan includes interactive briefing instruction and propose_course/generate_course format', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'ULTRA',
      userProfile: { name: 'Алексей', streakDays: 5 }
    });

    assert.match(prompt, /ULTRA SUBSCRIBER SPECIAL ABILITY - INTERACTIVE ROADMAP BRIEFING/);
    assert.match(prompt, /Ask 2-3 clarifying questions/);
    assert.match(prompt, /"action": "propose_course"/);
    assert.match(prompt, /"action": "generate_course"/);
    assert.match(prompt, /Name: Алексей/);
  });

  test('PRO plan includes direct course proposal and ULTRA upsell note', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'PRO',
      userProfile: { name: 'Елена', streakDays: 3 }
    });

    assert.match(prompt, /PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL/);
    assert.match(prompt, /"action": "propose_course"/);
    assert.match(prompt, /На подписке \*\*ULTRA\*\* я могу провести персональный бриф/);
    assert.equal(prompt.includes('INTERACTIVE ROADMAP BRIEFING:'), false);
  });

  test('FREE plan includes polite refusal instruction and upgrade advice', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'FREE',
      userProfile: { name: 'Иван' }
    });

    assert.match(prompt, /FREE PLAN LIMITATION - COURSE CREATION RESTRICTION/);
    assert.match(prompt, /politely refuse to draft or write the syllabus/);
    assert.match(prompt, /exclusive to PRO and ULTRA plans/);
  });

  test('appends softCap note when usage.isProSoftCapped is true', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'PRO',
      usage: { isProSoftCapped: true }
    });

    assert.match(prompt, /NOTE: The user has exceeded their high-priority daily message quota/);
  });
});
