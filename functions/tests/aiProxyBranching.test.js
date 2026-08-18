const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { resolveGeminiMessages } = require('../index.js');

describe('aiProxy prompt branching (Orchestrator vs Legacy)', () => {
  const userId = 'user_test_123';
  const mockTransactionResult = {
    plan: 'PRO',
    isProSoftCapped: false,
    updatedUsageCount: 4
  };

  test('Orchestrator path: constructs messages using assembleSystemPrompt when mentorContext is present', () => {
    const requestData = {
      mentorContext: {
        mode: 'lesson',
        contextId: 'lesson_1',
        lessonTitle: 'Введение в React',
        courseTitle: 'React с нуля',
        lessonContent: 'React - это библиотека...',
        courseLanguage: 'ru',
        recentHistory: [
          { role: 'user', content: 'Что такое JSX?' },
          { role: 'assistant', content: 'JSX - это синтаксическое расширение...' }
        ]
      },
      userQuery: 'Как работает Virtual DOM?'
    };

    const { geminiMessages, promptAssemblySource } = resolveGeminiMessages(
      requestData,
      userId,
      mockTransactionResult
    );

    assert.equal(promptAssemblySource, 'orchestrator');
    assert.ok(Array.isArray(geminiMessages));
    assert.equal(geminiMessages[0].role, 'system');
    assert.match(geminiMessages[0].content, /MODE: CONTEXTUAL LESSON MENTOR/);
    assert.match(geminiMessages[0].content, /Введение в React/);
    
    // Check history messages
    assert.equal(geminiMessages[1].role, 'user');
    assert.equal(geminiMessages[1].content, 'Что такое JSX?');
    assert.equal(geminiMessages[2].role, 'assistant');
    assert.equal(geminiMessages[2].content, 'JSX - это синтаксическое расширение...');

    // Check user query at the end
    const lastMsg = geminiMessages[geminiMessages.length - 1];
    assert.equal(lastMsg.role, 'user');
    assert.equal(lastMsg.content, 'Как работает Virtual DOM?');
  });

  test('Legacy path: returns clientMessages when mentorContext is not provided', () => {
    const requestData = {
      messages: [
        { role: 'system', content: 'Custom system prompt' },
        { role: 'user', content: 'Hello AI' }
      ],
      usageType: 'ai_question'
    };

    const { geminiMessages, promptAssemblySource } = resolveGeminiMessages(
      requestData,
      userId,
      mockTransactionResult
    );

    assert.equal(promptAssemblySource, 'legacy');
    assert.deepEqual(geminiMessages, requestData.messages);
  });

  test('Legacy path: wraps single prompt into [{ role: "user", content: prompt }]', () => {
    const requestData = {
      prompt: 'Explain quantum computing',
      usageType: 'ai_question'
    };

    const { geminiMessages, promptAssemblySource } = resolveGeminiMessages(
      requestData,
      userId,
      mockTransactionResult
    );

    assert.equal(promptAssemblySource, 'legacy');
    assert.deepEqual(geminiMessages, [{ role: 'user', content: 'Explain quantum computing' }]);
  });

  test('Fallback on invalid mode: falls back to legacy prompt if prompt string exists', () => {
    const requestData = {
      mentorContext: {
        mode: 'invalid_mode_xyz' // will cause assembleSystemPrompt to throw
      },
      prompt: 'Fallback legacy prompt'
    };

    const { geminiMessages, promptAssemblySource } = resolveGeminiMessages(
      requestData,
      userId,
      mockTransactionResult
    );

    assert.equal(promptAssemblySource, 'legacy');
    assert.deepEqual(geminiMessages, [{ role: 'user', content: 'Fallback legacy prompt' }]);
  });

  test('Fallback on invalid mode without legacy fallback: throws informative HttpsError', () => {
    const requestData = {
      mentorContext: {
        mode: 'invalid_mode_xyz'
      }
      // No prompt or clientMessages
    };

    assert.throws(
      () => resolveGeminiMessages(requestData, userId, mockTransactionResult),
      (err) => {
        return err.message && err.message.includes('Failed to assemble mentor prompt');
      }
    );
  });
});
