import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildMentorContext } from '../index.js';

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

function createMockDb(documents = {}, sessions = []) {
  return {
    getDocData: async (path) => documents[path] || null,
    getLatestSessionMessages: async (userId) => sessions
  };
}

describe('buildMentorContext orchestration unit tests', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    globalThis.window = { localStorage: localStorageMock };
    globalThis.localStorage = localStorageMock;
  });

  test('Validation: Throws error when userId is missing or mode is invalid', async () => {
    await assert.rejects(
      async () => buildMentorContext({ userId: '', mode: 'global' }),
      /userId is required/
    );

    await assert.rejects(
      async () => buildMentorContext({ userId: 'user_1', mode: 'unknown_mode' }),
      /Invalid mode/
    );
  });

  test('Scenario 1: FREE user in global mode reads from localStorage', async () => {
    const mockMessages = [
      { id: '1', role: 'user', content: 'Explain event loop' },
      { id: '2', role: 'assistant', content: 'The event loop processes microtasks and macrotasks...' }
    ];
    const timestamp = Date.now() - (2 * 60 * 60 * 1000);
    localStorageMock.setItem('free_mentor_messages', JSON.stringify(mockMessages));
    localStorageMock.setItem('free_mentor_timestamp', timestamp.toString());

    const mockDb = createMockDb({});
    const context = await buildMentorContext('free_user_1', 'global', null, { dbInstance: mockDb });

    assert.equal(context.userId, 'free_user_1');
    assert.equal(context.mode, 'global');
    assert.equal(context.plan, 'FREE');
    assert.equal(context.recentHistory.length, 2);
    assert.deepEqual(context.recentHistory[0], { id: '1', role: 'user', content: 'Explain event loop' });
    assert.equal(context.lessonContent, null);
    assert.equal(context.homeworkTask, null);
  });

  test('Scenario 2: PRO user in lesson mode with lessonContent truncation', async () => {
    const mockDb = createMockDb({
      'users/pro_user_2/subscription/details': {
        plan: 'PRO',
        mentorMessagesUsed: 10
      },
      'users/pro_user_2/lessonUsage/node_redux': {
        messagesUsed: 3
      }
    });

    const inMemoryHistory = [{ role: 'user', content: 'How does dispatch work?' }];
    const longLesson = 'C'.repeat(4000);

    const context = await buildMentorContext({
      userId: 'pro_user_2',
      mode: 'lesson',
      contextId: 'node_redux',
      lessonContent: longLesson,
      historyOverride: inMemoryHistory,
      dbInstance: mockDb
    });

    assert.equal(context.plan, 'PRO');
    assert.equal(context.mode, 'lesson');
    assert.equal(context.usage.lessonMessagesUsed, 3);
    assert.equal(context.lessonContent.length, 3000);
    assert.deepEqual(context.recentHistory, inMemoryHistory);
  });

  test('Scenario 3: ULTRA user in homework mode with Firestore task & history', async () => {
    const hwHistory = [
      { role: 'user', content: 'I am getting index out of bounds.' },
      { role: 'assistant', content: 'Check the upper bound condition in your loop.' }
    ];

    const mockDb = createMockDb({
      'users/ultra_user_3/subscription/details': {
        plan: 'ULTRA',
        ultraTokensUsed: 50000
      },
      'users/ultra_user_3/homeworkSubmissions/course_1_node_1': {
        prompt: 'Implement DFS on graph',
        rubric: [{ criterion: 'Detect cycles', met: true }],
        chatHistory: hwHistory
      }
    });

    const context = await buildMentorContext({
      userId: 'ultra_user_3',
      mode: 'homework',
      contextId: 'course_1_node_1',
      dbInstance: mockDb
    });

    assert.equal(context.plan, 'ULTRA');
    assert.equal(context.mode, 'homework');
    assert.equal(context.usage.ultraTokensUsed, 50000);
    assert.deepEqual(context.recentHistory, hwHistory);
    assert.deepEqual(context.homeworkTask, {
      prompt: 'Implement DFS on graph',
      rubric: [{ criterion: 'Detect cycles', met: true }]
    });
  });
});
