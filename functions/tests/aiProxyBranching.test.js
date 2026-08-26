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

  test('Orchestrator path: constructs homework Socratic prompt with history when mode is homework for ULTRA user', () => {
    const ultraTransactionResult = {
      plan: 'ULTRA',
      isProSoftCapped: false,
      updatedUsageCount: 0
    };

    const requestData = {
      mentorContext: {
        mode: 'homework',
        contextId: 'course_1_node_2',
        lessonTitle: 'Основы массивов',
        lessonContent: 'Массивы в JavaScript хранят упорядоченные коллекции...',
        homeworkTask: {
          prompt: 'Напишите функцию фильтрации четных чисел',
          rubric: [{ criterion: 'Использовать метод filter', weight: 30 }]
        },
        courseLanguage: 'ru',
        recentHistory: [
          { role: 'user', content: 'С чего мне начать?' },
          { role: 'assistant', content: 'Подумай об операторе остатка от деления %' }
        ]
      },
      userQuery: 'Как проверить число на четность?'
    };

    const { geminiMessages, promptAssemblySource } = resolveGeminiMessages(
      requestData,
      userId,
      ultraTransactionResult
    );

    assert.equal(promptAssemblySource, 'orchestrator');
    assert.ok(Array.isArray(geminiMessages));
    assert.equal(geminiMessages[0].role, 'system');
    assert.match(geminiMessages[0].content, /MODE: SOCRATIC HOMEWORK MENTOR/);
    assert.match(geminiMessages[0].content, /Напишите функцию фильтрации четных чисел/);
    assert.match(geminiMessages[0].content, /EVALUATION CRITERIA/);
    assert.match(geminiMessages[0].content, /Использовать метод filter/);
    assert.match(geminiMessages[0].content, /CRITICAL SOCRATIC INSTRUCTIONS/);

    // History check
    assert.equal(geminiMessages[1].role, 'user');
    assert.equal(geminiMessages[1].content, 'С чего мне начать?');
    assert.equal(geminiMessages[2].role, 'assistant');
    assert.equal(geminiMessages[2].content, 'Подумай об операторе остатка от деления %');

    // Query check
    const lastMsg = geminiMessages[geminiMessages.length - 1];
    assert.equal(lastMsg.role, 'user');
    assert.equal(lastMsg.content, 'Как проверить число на четность?');
  });

  test('Security: non-ULTRA user (FREE/PRO) requesting mode="homework" throws permission-denied HttpsError', () => {
    const freeTransactionResult = {
      plan: 'FREE',
      isProSoftCapped: false,
      updatedUsageCount: 0
    };

    const requestData = {
      mentorContext: {
        mode: 'homework',
        contextId: 'course_1_node_2',
        lessonTitle: 'Основы массивов',
        lessonContent: 'Массивы...',
        homeworkTask: { prompt: 'Сделай задание' }
      },
      userQuery: 'Помоги с кодом'
    };

    assert.throws(
      () => {
        resolveGeminiMessages(requestData, userId, freeTransactionResult);
      },
      (err) => {
        assert.equal(err.code, 'permission-denied');
        assert.match(err.message, /HOMEWORK_MENTOR_REQUIRES_ULTRA_PLAN/);
        return true;
      }
    );
  });

  test('Orchestrator path: constructs global mentor prompt with interactive briefing for ULTRA user', () => {
    const ultraTransactionResult = {
      plan: 'ULTRA',
      isProSoftCapped: false,
      updatedUsageCount: 0
    };

    const requestData = {
      mentorContext: {
        mode: 'global',
        contextId: 'session_ultra_123',
        userProfile: {
          name: 'Даниил',
          firstName: 'Даниил',
          streakDays: 7,
          enrolledCourses: [{ title: 'React с нуля', level: 'Intermediate', progress: 65 }]
        },
        courseLanguage: 'ru',
        recentHistory: [
          { role: 'user', content: 'Привет' },
          { role: 'assistant', content: 'Привет, Даниил! Чем могу помочь?' }
        ]
      },
      userQuery: 'Хочу подтянуть Go для backend-разработки'
    };

    const { geminiMessages, promptAssemblySource, tools } = resolveGeminiMessages(
      requestData,
      userId,
      ultraTransactionResult
    );

    assert.equal(promptAssemblySource, 'orchestrator');
    assert.ok(Array.isArray(geminiMessages));
    assert.equal(geminiMessages[0].role, 'system');
    assert.match(geminiMessages[0].content, /MODE: GLOBAL MENTOR/);
    assert.match(geminiMessages[0].content, /ULTRA SUBSCRIBER SPECIAL ABILITY - INTERACTIVE ROADMAP BRIEFING/);
    assert.match(geminiMessages[0].content, /React с нуля/);

    // Tools check for ULTRA global mode
    assert.ok(Array.isArray(tools));
    assert.equal(tools.length, 2);
    assert.equal(tools[0].function.name, 'propose_course');
    assert.equal(tools[1].function.name, 'generate_course');

    const lastMsg = geminiMessages[geminiMessages.length - 1];
    assert.equal(lastMsg.role, 'user');
    assert.equal(lastMsg.content, 'Хочу подтянуть Go для backend-разработки');
  });

  test('Orchestrator path: constructs global mentor prompt with direct course proposal for PRO user', () => {
    const proTransactionResult = {
      plan: 'PRO',
      isProSoftCapped: false,
      updatedUsageCount: 2
    };

    const requestData = {
      mentorContext: {
        mode: 'global',
        userProfile: {
          name: 'Алексей',
          streakDays: 3,
          enrolledCourses: []
        },
        courseLanguage: 'ru',
        recentHistory: []
      },
      userQuery: 'Составь курс по Docker'
    };

    const { geminiMessages, promptAssemblySource, tools } = resolveGeminiMessages(
      requestData,
      userId,
      proTransactionResult
    );

    assert.equal(promptAssemblySource, 'orchestrator');
    assert.ok(Array.isArray(geminiMessages));
    assert.equal(geminiMessages[0].role, 'system');
    assert.match(geminiMessages[0].content, /MODE: GLOBAL MENTOR/);
    assert.match(geminiMessages[0].content, /PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL/);

    // Tools check for PRO global mode
    assert.ok(Array.isArray(tools));
    assert.equal(tools.length, 2);
    assert.equal(tools[0].function.name, 'propose_course');
    assert.equal(tools[1].function.name, 'generate_course');

    const lastMsg = geminiMessages[geminiMessages.length - 1];
    assert.equal(lastMsg.role, 'user');
    assert.equal(lastMsg.content, 'Составь курс по Docker');
  });

  test('Orchestrator path: tools are undefined for FREE global mode or non-global modes', () => {
    const freeResult = { plan: 'FREE', updatedUsageCount: 0 };
    const globalFree = resolveGeminiMessages({
      mentorContext: { mode: 'global' },
      userQuery: 'Привет'
    }, userId, freeResult);
    assert.equal(globalFree.tools, undefined);

    const lessonPro = resolveGeminiMessages({
      mentorContext: { mode: 'lesson', contextId: 'les_1', lessonTitle: 'CSS' },
      userQuery: 'Что такое flexbox?'
    }, userId, { plan: 'PRO', updatedUsageCount: 0 });
    assert.equal(lessonPro.tools, undefined);
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

  test('Security: invalid mode with mentorContext throws HttpsError instead of unsafe legacy fallback', () => {
    const requestData = {
      mentorContext: {
        mode: 'invalid_mode_xyz'
      },
      prompt: 'Attempted prompt bypass'
    };

    assert.throws(
      () => resolveGeminiMessages(requestData, userId, mockTransactionResult),
      (err) => {
        return err.message && err.message.includes('Failed to assemble mentor prompt safely');
      }
    );
  });

  test('Tool Call response parsing: parses propose_course function call arguments accurately', () => {
    const mockChoiceMessage = {
      content: 'Я составил для тебя программу курса по Go:',
      tool_calls: [
        {
          id: 'call_123',
          type: 'function',
          function: {
            name: 'propose_course',
            arguments: JSON.stringify({
              topic: 'Go для backend-разработки',
              difficulty: 'Intermediate',
              modules: ['Синтаксис', 'Горутины', 'Web API'],
              preferences: { dailyTime: '45m', duration: '2 months' }
            })
          }
        }
      ]
    };

    let toolCall = null;
    if (Array.isArray(mockChoiceMessage.tool_calls) && mockChoiceMessage.tool_calls.length > 0) {
      const rawTool = mockChoiceMessage.tool_calls[0].function;
      if (rawTool?.name) {
        toolCall = {
          name: rawTool.name,
          args: JSON.parse(rawTool.arguments)
        };
      }
    }

    assert.ok(toolCall);
    assert.equal(toolCall.name, 'propose_course');
    assert.equal(toolCall.args.topic, 'Go для backend-разработки');
    assert.equal(toolCall.args.difficulty, 'Intermediate');
    assert.deepEqual(toolCall.args.modules, ['Синтаксис', 'Горутины', 'Web API']);
  });

  test('Tool Call response parsing: parses generate_course function call arguments accurately', () => {
    const mockChoiceMessage = {
      content: 'Отлично! Запускаю генерацию роудмапа.',
      tool_calls: [
        {
          id: 'call_456',
          type: 'function',
          function: {
            name: 'generate_course',
            arguments: JSON.stringify({
              topic: 'Docker и Kubernetes',
              difficulty: 'Advanced',
              preferences: { dailyTime: '30m', duration: '1 month' }
            })
          }
        }
      ]
    };

    let toolCall = null;
    if (Array.isArray(mockChoiceMessage.tool_calls) && mockChoiceMessage.tool_calls.length > 0) {
      const rawTool = mockChoiceMessage.tool_calls[0].function;
      if (rawTool?.name) {
        toolCall = {
          name: rawTool.name,
          args: JSON.parse(rawTool.arguments)
        };
      }
    }

    assert.ok(toolCall);
    assert.equal(toolCall.name, 'generate_course');
    assert.equal(toolCall.args.topic, 'Docker и Kubernetes');
    assert.equal(toolCall.args.difficulty, 'Advanced');
  });
});
