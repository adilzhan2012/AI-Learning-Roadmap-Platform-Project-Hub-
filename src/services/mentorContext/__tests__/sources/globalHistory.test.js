import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchGlobalHistory, getFreeLocalStorageHistory } from '../../sources/globalHistory.js';

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

describe('sources/globalHistory unit tests', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    globalThis.window = { localStorage: localStorageMock };
    globalThis.localStorage = localStorageMock;
  });

  test('prioritizes historyOverride across any plan when provided', async () => {
    const override = [{ role: 'user', content: 'Custom override' }];
    const history = await fetchGlobalHistory('user_1', null, {
      historyOverride: override,
      plan: 'FREE'
    });

    assert.deepEqual(history, [{ role: 'user', content: 'Custom override' }]);
  });

  test('FREE plan: reads valid messages from localStorage (< 48h TTL)', async () => {
    const rawMessages = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there!' }
    ];
    const timestamp = Date.now() - (10 * 60 * 60 * 1000); // 10 hours ago

    localStorageMock.setItem('free_mentor_messages', JSON.stringify(rawMessages));
    localStorageMock.setItem('free_mentor_timestamp', timestamp.toString());

    const history = await fetchGlobalHistory('user_free', null, { plan: 'FREE' });

    assert.equal(history.length, 2);
    assert.deepEqual(history[0], { id: '1', role: 'user', content: 'Hello' });
  });

  test('FREE plan: ignores expired messages from localStorage (> 48h TTL)', async () => {
    const rawMessages = [{ id: '1', role: 'user', content: 'Old' }];
    const timestamp = Date.now() - (50 * 60 * 60 * 1000); // 50 hours ago

    localStorageMock.setItem('free_mentor_messages', JSON.stringify(rawMessages));
    localStorageMock.setItem('free_mentor_timestamp', timestamp.toString());

    const history = await fetchGlobalHistory('user_free', null, { plan: 'FREE' });
    assert.deepEqual(history, []);
  });

  test('PRO / ULTRA plan: reads from specific mentorSession in Firestore', async () => {
    const sessionMessages = [
      { id: 'm1', role: 'user', content: 'Design microservices' }
    ];

    const mockDb = {
      getDocData: async (path) => {
        if (path === 'users/user_pro/mentorSessions/session_123') {
          return { messages: sessionMessages };
        }
        return null;
      }
    };

    const history = await fetchGlobalHistory('user_pro', 'session_123', {
      plan: 'PRO',
      dbInstance: mockDb
    });

    assert.deepEqual(history, [{ id: 'm1', role: 'user', content: 'Design microservices' }]);
  });

  test('PRO / ULTRA plan: fetches latest session when sessionId is not provided', async () => {
    const latestMessages = [{ id: 'm2', role: 'assistant', content: 'Here is the summary' }];
    const mockDb = {
      getLatestSessionMessages: async () => latestMessages
    };

    const history = await fetchGlobalHistory('user_ultra', null, {
      plan: 'ULTRA',
      dbInstance: mockDb
    });

    assert.deepEqual(history, [{ id: 'm2', role: 'assistant', content: 'Here is the summary' }]);
  });
});
