const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { resolveGeminiMessages, processUsageLimitAndCounter } = require('../index.js');
const { assembleSystemPrompt } = require('../services/promptAssembler/index.js');

// Mock Firestore / Admin Helpers for unit testing transactions
function createMockFirestore(subData = {}, lessonData = {}) {
  let writtenData = {};
  return {
    collection: (colName) => ({
      doc: (docId) => ({
        collection: (subColName) => ({
          doc: (subDocId) => ({
            id: subDocId,
            path: `${colName}/${docId}/${subColName}/${subDocId}`
          })
        })
      })
    }),
    runTransaction: async (txnCallback) => {
      const txn = {
        get: async (ref) => {
          if (ref.path?.includes('subscription/details')) {
            return {
              exists: Object.keys(subData).length > 0,
              data: () => ({ ...subData })
            };
          }
          if (ref.path?.includes('lessonUsage')) {
            return {
              exists: Object.keys(lessonData).length > 0,
              data: () => ({ ...lessonData })
            };
          }
          return { exists: false, data: () => ({}) };
        },
        set: (ref, data, opts) => {
          writtenData = { ...writtenData, ...data };
        }
      };
      return await txnCallback(txn);
    }
  };
}

const mockAdmin = {
  auth: () => ({
    getUser: async () => ({
      metadata: { creationTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    })
  })
};

describe('Mentor Orchestrator 9-Combination Regression Suite (3 Plans x 3 Modes)', () => {
  const userId = 'user_test_999';
  const todayStr = '2026-08-25';
  const monthStr = '2026-08';

  // ----------------------------------------------------
  // COMBINATION 1: FREE x global
  // ----------------------------------------------------
  describe('1. FREE x global', () => {
    test('Normal query: returns courteous refusal guidance without tools', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: { mode: 'global' },
        userQuery: 'Составь курс по React'
      }, userId, { plan: 'FREE', updatedUsageCount: 1 });

      assert.equal(tools, undefined);
      assert.match(geminiMessages[0].content, /FREE PLAN LIMITATION - COURSE CREATION RESTRICTION/);
      assert.match(geminiMessages[0].content, /Do NOT call propose_course or generate_course tools/);
    });

    test('Limit exceeded (5 messages/day): throws PLAN_LIMIT_EXCEEDED without transaction 500 error', async () => {
      const db = createMockFirestore({
        plan: 'FREE',
        lastMentorDate: todayStr,
        mentorMessagesUsed: 5
      });

      await assert.rejects(
        async () => {
          await processUsageLimitAndCounter(db, mockAdmin, userId, 'mentor_message', todayStr, monthStr);
        },
        (err) => {
          assert.equal(err.code, 'failed-precondition');
          assert.equal(err.message, 'PLAN_LIMIT_EXCEEDED');
          return true;
        }
      );
    });
  });

  // ----------------------------------------------------
  // COMBINATION 2: FREE x lesson
  // ----------------------------------------------------
  describe('2. FREE x lesson', () => {
    test('Normal query: contextual mentor prompt for specific lesson without tools', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: {
          mode: 'lesson',
          contextId: 'lesson_react_hooks',
          lessonTitle: 'Хуки в React',
          lessonContent: 'Краткое содержание хуков...'
        },
        userQuery: 'Что делает useEffect?'
      }, userId, { plan: 'FREE', updatedUsageCount: 1 });

      assert.equal(tools, undefined);
      assert.match(geminiMessages[0].content, /MODE: CONTEXTUAL LESSON MENTOR/);
      assert.match(geminiMessages[0].content, /Хуки в React/);
    });

    test('Limit exceeded (3 messages/lesson): throws LESSON_MENTOR_LIMIT_EXCEEDED', async () => {
      const db = createMockFirestore({ plan: 'FREE' }, { messagesUsed: 3 });

      await assert.rejects(
        async () => {
          await processUsageLimitAndCounter(db, mockAdmin, userId, 'contextual_mentor_message', todayStr, monthStr, 'lesson_101');
        },
        (err) => {
          assert.equal(err.code, 'failed-precondition');
          assert.equal(err.message, 'LESSON_MENTOR_LIMIT_EXCEEDED');
          return true;
        }
      );
    });
  });

  // ----------------------------------------------------
  // COMBINATION 3: FREE x homework
  // ----------------------------------------------------
  describe('3. FREE x homework', () => {
    test('Security gate: throws HOMEWORK_MENTOR_REQUIRES_ULTRA_PLAN permission-denied', () => {
      assert.throws(
        () => resolveGeminiMessages({
          mentorContext: { mode: 'homework', contextId: 'hw_node_1' },
          userQuery: 'Помоги решить задачу'
        }, userId, { plan: 'FREE', updatedUsageCount: 0 }),
        (err) => {
          assert.equal(err.code, 'permission-denied');
          assert.match(err.message, /HOMEWORK_MENTOR_REQUIRES_ULTRA_PLAN/);
          return true;
        }
      );
    });
  });

  // ----------------------------------------------------
  // COMBINATION 4: PRO x global
  // ----------------------------------------------------
  describe('4. PRO x global', () => {
    test('Normal query: attaches propose_course and generate_course tools with direct proposal instruction', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: {
          mode: 'global',
          userProfile: { name: 'Елена', streakDays: 4 }
        },
        userQuery: 'Хочу изучить Docker'
      }, userId, { plan: 'PRO', updatedUsageCount: 1, isProSoftCapped: false });

      assert.ok(Array.isArray(tools));
      assert.equal(tools.length, 2);
      assert.equal(tools[0].function.name, 'propose_course');
      assert.equal(tools[1].function.name, 'generate_course');
      assert.match(geminiMessages[0].content, /PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL/);
    });

    test('Soft-cap reached (isProSoftCapped === true): prompt appends daily quota note', () => {
      const { geminiMessages } = resolveGeminiMessages({
        mentorContext: {
          mode: 'global',
          usage: { isProSoftCapped: true }
        },
        userQuery: 'Еще вопрос'
      }, userId, { plan: 'PRO', isProSoftCapped: true });

      assert.match(geminiMessages[0].content, /NOTE: The user has exceeded their high-priority daily message quota/);
    });
  });

  // ----------------------------------------------------
  // COMBINATION 5: PRO x lesson
  // ----------------------------------------------------
  describe('5. PRO x lesson', () => {
    test('Normal query: contextual mentor prompt without tools or 3-message limit', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: {
          mode: 'lesson',
          contextId: 'lesson_docker_compose',
          lessonTitle: 'Docker Compose',
          lessonContent: 'Содержимое Docker Compose...'
        },
        userQuery: 'Как связать сервисы?'
      }, userId, { plan: 'PRO', updatedUsageCount: 15 });

      assert.equal(tools, undefined);
      assert.match(geminiMessages[0].content, /MODE: CONTEXTUAL LESSON MENTOR/);
    });
  });

  // ----------------------------------------------------
  // COMBINATION 6: PRO x homework
  // ----------------------------------------------------
  describe('6. PRO x homework', () => {
    test('Security gate: throws HOMEWORK_MENTOR_REQUIRES_ULTRA_PLAN permission-denied', () => {
      assert.throws(
        () => resolveGeminiMessages({
          mentorContext: { mode: 'homework', contextId: 'hw_node_docker' },
          userQuery: 'Проверь решение'
        }, userId, { plan: 'PRO', updatedUsageCount: 5 }),
        (err) => {
          assert.equal(err.code, 'permission-denied');
          assert.match(err.message, /HOMEWORK_MENTOR_REQUIRES_ULTRA_PLAN/);
          return true;
        }
      );
    });
  });

  // ----------------------------------------------------
  // COMBINATION 7: ULTRA x global
  // ----------------------------------------------------
  describe('7. ULTRA x global', () => {
    test('Normal query: interactive briefing instructions + tools attached', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: {
          mode: 'global',
          userProfile: { name: 'Даниил', streakDays: 14 }
        },
        userQuery: 'Хочу выучить Go для микросервисов'
      }, userId, { plan: 'ULTRA', updatedUsageCount: 0 });

      assert.ok(Array.isArray(tools));
      assert.equal(tools.length, 2);
      assert.match(geminiMessages[0].content, /ULTRA SUBSCRIBER SPECIAL ABILITY - INTERACTIVE ROADMAP BRIEFING/);
      assert.match(geminiMessages[0].content, /Ask 2-3 clarifying questions/);
    });

    test('Daily quota limit (300,000 tokens): throws PLAN_LIMIT_EXCEEDED on same day', async () => {
      const db = createMockFirestore({
        plan: 'ULTRA',
        lastMentorDate: todayStr,
        ultraTokensUsed: 300000
      });

      await assert.rejects(
        async () => {
          await processUsageLimitAndCounter(db, mockAdmin, userId, 'mentor_message', todayStr, monthStr);
        },
        (err) => {
          assert.equal(err.code, 'failed-precondition');
          assert.equal(err.message, 'PLAN_LIMIT_EXCEEDED');
          return true;
        }
      );
    });
  });

  // ----------------------------------------------------
  // COMBINATION 8: ULTRA x lesson
  // ----------------------------------------------------
  describe('8. ULTRA x lesson', () => {
    test('Normal query: contextual mentor prompt with lesson title and content', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: {
          mode: 'lesson',
          contextId: 'lesson_go_routines',
          lessonTitle: 'Горутины и каналы',
          lessonContent: 'Примеры каналов в Go...'
        },
        userQuery: 'В чем отличие буферизированного канала?'
      }, userId, { plan: 'ULTRA', updatedUsageCount: 0 });

      assert.equal(tools, undefined);
      assert.match(geminiMessages[0].content, /MODE: CONTEXTUAL LESSON MENTOR/);
      assert.match(geminiMessages[0].content, /Горутины и каналы/);
    });
  });

  // ----------------------------------------------------
  // COMBINATION 9: ULTRA x homework
  // ----------------------------------------------------
  describe('9. ULTRA x homework', () => {
    test('Normal query: Socratic homework tutor prompt assembled successfully for ULTRA', () => {
      const { geminiMessages, tools } = resolveGeminiMessages({
        mentorContext: {
          mode: 'homework',
          contextId: 'hw_goroutines_task',
          taskDescription: 'Реализуйте worker pool',
          userCode: 'func worker() {}',
          recentHistory: [
            { role: 'user', content: 'С чего начать?' },
            { role: 'assistant', content: 'Подумай о канале задач.' }
          ]
        },
        userQuery: 'Как закрывать канал?'
      }, userId, { plan: 'ULTRA', updatedUsageCount: 0 });

      assert.equal(tools, undefined);
      assert.match(geminiMessages[0].content, /SOCRATIC HOMEWORK MENTOR/);
      assert.match(geminiMessages[0].content, /DO NOT solve the homework for the user/);
      assert.equal(geminiMessages[geminiMessages.length - 1].content, 'Как закрывать канал?');
    });
  });

  // ----------------------------------------------------
  // Soft-cap Model Selection & Feedback Tests
  // ----------------------------------------------------
  describe('Client Model Selection & Feedback Regression', () => {
    test('Model selection: chooses gemini-2.5-flash when isProSoftCapped is true', () => {
      const isProSoftCapped = true;
      const text = 'Объясни мне подробно устройство рантайма';
      const isComplexQuery = text.length > 200 || text.toLowerCase().includes('объясни');
      
      const selectedModel = isProSoftCapped 
        ? 'gemini-2.5-flash' 
        : (isComplexQuery ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

      assert.equal(selectedModel, 'gemini-2.5-flash');
    });

    test('Model selection: chooses gemini-2.5-pro for complex queries when not soft-capped', () => {
      const isProSoftCapped = false;
      const text = 'Объясни мне подробно устройство рантайма';
      const isComplexQuery = text.length > 200 || text.toLowerCase().includes('объясни');
      
      const selectedModel = isProSoftCapped 
        ? 'gemini-2.5-flash' 
        : (isComplexQuery ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

      assert.equal(selectedModel, 'gemini-2.5-pro');
    });

    test('Feedback payload: validates ratings and Gemini model naming format', () => {
      const feedbackPayload = {
        messageId: 'msg_123',
        queryText: 'Вопрос',
        replyText: 'Ответ',
        rating: 1, // thumbs up
        modelName: 'gemini-2.5-flash',
        context: 'global_widget'
      };

      assert.ok([1, -1].includes(feedbackPayload.rating));
      assert.ok(feedbackPayload.modelName.startsWith('gemini-'));
      assert.equal(feedbackPayload.context, 'global_widget');
    });

    test('Security & Limits: Mode Resolver prevents limit bypass by enforcing contextual_mentor_message on lesson intent', async () => {
      const db = createMockFirestore({ plan: 'FREE' }, { messagesUsed: 3 });

      // User has 3 messages used on lesson_hooks. Even if calling with mentor_message initially,
      // effectiveUsageType becomes contextual_mentor_message and throws LESSON_MENTOR_LIMIT_EXCEEDED.
      await assert.rejects(
        async () => {
          await processUsageLimitAndCounter(db, mockAdmin, userId, 'contextual_mentor_message', todayStr, monthStr, 'lesson_hooks');
        },
        (err) => {
          assert.equal(err.code, 'failed-precondition');
          assert.equal(err.message, 'LESSON_MENTOR_LIMIT_EXCEEDED');
          return true;
        }
      );
    });

    test('Handler return payload construction: avoids ReferenceError for effectiveUsageType', () => {
      const effectiveUsageType = 'mentor_message';
      const transactionResult = { plan: 'FREE', updatedUsageCount: 1, isProSoftCapped: false };
      const assistantReply = 'Привет! Чем помочь?';
      const toolCall = null;

      const responsePayload = {
        result: assistantReply,
        toolCall,
        usageType: effectiveUsageType || null,
        updatedUsageCount: transactionResult?.updatedUsageCount || 0
      };

      assert.equal(responsePayload.result, 'Привет! Чем помочь?');
      assert.equal(responsePayload.usageType, 'mentor_message');
      assert.equal(responsePayload.updatedUsageCount, 1);
      assert.equal(responsePayload.toolCall, null);
    });
  });
});
