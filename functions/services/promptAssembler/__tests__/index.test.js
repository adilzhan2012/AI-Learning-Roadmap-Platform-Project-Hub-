const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { assembleSystemPrompt, getHistoryDepth } = require('../index.js');

describe('assembleSystemPrompt - 3x3 (mode x plan) and history assembly unit tests', () => {
  // Test 3x3 matrix of (mode x plan)
  const modes = ['global', 'lesson', 'homework'];
  const plans = ['FREE', 'PRO', 'ULTRA'];

  for (const mode of modes) {
    for (const plan of plans) {
      test(`Matrix combination: mode="${mode}" x plan="${plan}"`, () => {
        const context = {
          userId: 'test_user',
          mode,
          plan,
          lessonTitle: 'Тестовый урок',
          courseTitle: 'Тестовый курс',
          lessonContent: 'Материал урока...',
          homeworkTask: { prompt: 'Сделайте упражнение 1' },
          userProfile: { name: 'Дмитрий', streakDays: 7 },
          recentHistory: [
            { id: '1', role: 'user', content: 'Вопрос 1' },
            { id: '2', role: 'assistant', content: 'Ответ 1' }
          ]
        };

        const result = assembleSystemPrompt(context, 'Новый вопрос');

        assert.ok(result.systemPrompt);
        assert.ok(result.messages.length >= 3);
        assert.equal(result.messages[0].role, 'system');
        assert.equal(result.messages[result.messages.length - 1].role, 'user');
        assert.equal(result.messages[result.messages.length - 1].content, 'Новый вопрос');

        // Mode specific assertions
        if (mode === 'global') {
          assert.match(result.systemPrompt, /MODE: GLOBAL MENTOR/);
          if (plan === 'ULTRA') {
            assert.match(result.systemPrompt, /ULTRA SUBSCRIBER SPECIAL ABILITY/);
          } else if (plan === 'PRO') {
            assert.match(result.systemPrompt, /PRO SUBSCRIBER ABILITY/);
          } else {
            assert.match(result.systemPrompt, /FREE PLAN LIMITATION/);
          }
        } else if (mode === 'lesson') {
          assert.match(result.systemPrompt, /MODE: CONTEXTUAL LESSON MENTOR/);
          assert.match(result.systemPrompt, /Я помогаю только с материалами этого урока/);
        } else if (mode === 'homework') {
          assert.match(result.systemPrompt, /MODE: SOCRATIC HOMEWORK MENTOR/);
          assert.match(result.systemPrompt, /DO NOT solve the homework for the user/);
        }
      });
    }
  }

  test('History depth config: resolves correct depths per mode & plan', () => {
    assert.equal(getHistoryDepth('global', 'ULTRA'), 12);
    assert.equal(getHistoryDepth('global', 'PRO'), 6);
    assert.equal(getHistoryDepth('global', 'FREE'), 6);
    assert.equal(getHistoryDepth('lesson', 'PRO'), 6);
    assert.equal(getHistoryDepth('homework', 'ULTRA'), 8);
  });

  test('History slicing: global ULTRA slices 12 messages, while global PRO slices 6', () => {
    const manyMessages = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`
    }));

    const ultraResult = assembleSystemPrompt({
      mode: 'global',
      plan: 'ULTRA',
      recentHistory: manyMessages
    });
    assert.equal(ultraResult.historyMessages.length, 12);
    assert.equal(ultraResult.historyMessages[0].content, 'Message 8');

    const proResult = assembleSystemPrompt({
      mode: 'global',
      plan: 'PRO',
      recentHistory: manyMessages
    });
    assert.equal(proResult.historyMessages.length, 6);
    assert.equal(proResult.historyMessages[0].content, 'Message 14');
  });

  test('JSON Action blocks are stripped from history during prompt assembly', () => {
    const rawHistoryWithAction = [
      {
        id: '1',
        role: 'assistant',
        content: `Я составил драфт курса:
\`\`\`json
{
  "action": "propose_course",
  "topic": "Python"
}
\`\`\`
Вам подходит?`
      }
    ];

    const result = assembleSystemPrompt({
      mode: 'global',
      plan: 'ULTRA',
      recentHistory: rawHistoryWithAction
    }, 'Да, подходит');

    const cleanedHistoryMessage = result.historyMessages[0];
    assert.equal(cleanedHistoryMessage.content.includes('"action": "propose_course"'), false);
    assert.match(cleanedHistoryMessage.content, /Я составил драфт курса:/);
    assert.match(cleanedHistoryMessage.content, /Вам подходит\?/);
  });
});
