import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLessonHistory } from '../../sources/lessonHistory.js';

describe('sources/lessonHistory unit tests', () => {
  test('truncates lessonContent to 3000 chars and reads in-memory history', async () => {
    const longContent = 'B'.repeat(4500);
    const inMemoryHistory = [
      { id: '1', role: 'user', content: 'What does this function return?' }
    ];

    const mockDb = {
      getDocData: async (path) => {
        if (path === 'users/user_1/lessonUsage/node_test') {
          return { messagesUsed: 2 };
        }
        return null;
      }
    };

    const result = await fetchLessonHistory('user_1', 'node_test', {
      lessonContent: longContent,
      historyOverride: inMemoryHistory,
      dbInstance: mockDb
    });

    assert.equal(result.lessonContent.length, 3000);
    assert.deepEqual(result.history, [{ id: '1', role: 'user', content: 'What does this function return?' }]);
    assert.equal(result.lessonMessagesUsed, 2);
  });

  test('handles null lessonContent and empty history gracefully', async () => {
    const result = await fetchLessonHistory('user_1', null, {
      lessonContent: null,
      dbInstance: { getDocData: async () => null }
    });

    assert.equal(result.lessonContent, null);
    assert.deepEqual(result.history, []);
    assert.equal(result.lessonMessagesUsed, 0);
  });
});
