const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getGlobalPrompt, getPlanCourseInstruction, GLOBAL_MENTOR_TOOLS } = require('../../modes/globalPrompt.js');

describe('modes/globalPrompt unit tests', () => {
  test('GLOBAL_MENTOR_TOOLS exports valid Gemini function declarations', () => {
    assert.equal(Array.isArray(GLOBAL_MENTOR_TOOLS), true);
    assert.equal(GLOBAL_MENTOR_TOOLS.length, 2);

    const proposeTool = GLOBAL_MENTOR_TOOLS.find(t => t.function.name === 'propose_course');
    assert.ok(proposeTool);
    assert.match(proposeTool.function.description, /Propose a tailored learning roadmap/);
    assert.ok(proposeTool.function.parameters.properties.topic);
    assert.ok(proposeTool.function.parameters.properties.modules);

    const generateTool = GLOBAL_MENTOR_TOOLS.find(t => t.function.name === 'generate_course');
    assert.ok(generateTool);
    assert.match(generateTool.function.description, /Trigger the actual generation/);
    assert.ok(generateTool.function.parameters.properties.topic);
  });

  test('ULTRA plan includes interactive briefing instruction and propose_course/generate_course tools calling guidance', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'ULTRA',
      userProfile: { name: 'Алексей', streakDays: 5 }
    });

    assert.match(prompt, /ULTRA SUBSCRIBER SPECIAL ABILITY - INTERACTIVE ROADMAP BRIEFING/);
    assert.match(prompt, /Ask 2-3 clarifying questions/);
    assert.match(prompt, /propose_course/);
    assert.match(prompt, /generate_course/);
    assert.match(prompt, /Name: Алексей/);
  });

  test('PRO plan includes direct course proposal tool calling and ULTRA upsell note', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'PRO',
      userProfile: { name: 'Елена', streakDays: 3 }
    });

    assert.match(prompt, /PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL/);
    assert.match(prompt, /propose_course/);
    assert.match(prompt, /На подписке \*\*ULTRA\*\* я могу провести персональный бриф/);
    assert.equal(prompt.includes('INTERACTIVE ROADMAP BRIEFING:'), false);
  });

  test('FREE plan includes polite refusal instruction and upgrade advice without calling tools', () => {
    const prompt = getGlobalPrompt({
      mode: 'global',
      plan: 'FREE',
      userProfile: { name: 'Иван' }
    });

    assert.match(prompt, /FREE PLAN LIMITATION - COURSE CREATION RESTRICTION/);
    assert.match(prompt, /politely refuse to draft or write the syllabus/);
    assert.match(prompt, /exclusive to PRO and ULTRA plans/);
    assert.match(prompt, /Do NOT call propose_course or generate_course tools/);
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
