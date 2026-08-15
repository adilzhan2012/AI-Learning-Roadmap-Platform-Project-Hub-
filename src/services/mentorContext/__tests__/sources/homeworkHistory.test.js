import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fetchHomeworkHistory } from '../../sources/homeworkHistory.js';

describe('sources/homeworkHistory unit tests', () => {
  test('fetches chatHistory and homeworkTask from Firestore homeworkSubmissions', async () => {
    const rawChat = [
      { role: 'user', content: 'Where should I place the pointer?' },
      { role: 'assistant', content: 'Start by initializing left=0 and right=n-1.' }
    ];

    const mockDb = {
      getDocData: async (path) => {
        if (path === 'users/user_hw/homeworkSubmissions/course_1_node_2') {
          return {
            prompt: 'Implement quicksort',
            rubric: [{ criterion: 'O(N log N) average runtime' }],
            chatHistory: rawChat
          };
        }
        return null;
      }
    };

    const result = await fetchHomeworkHistory('user_hw', 'course_1_node_2', { dbInstance: mockDb });

    assert.deepEqual(result.history, rawChat);
    assert.deepEqual(result.homeworkTask, {
      prompt: 'Implement quicksort',
      rubric: [{ criterion: 'O(N log N) average runtime' }]
    });
  });

  test('prioritizes explicit options.homeworkTask and options.historyOverride', async () => {
    const customTask = { prompt: 'Custom prompt', rubric: [] };
    const customChat = [{ role: 'user', content: 'My custom question' }];

    const result = await fetchHomeworkHistory('user_hw', 'course_1_node_2', {
      homeworkTask: customTask,
      historyOverride: customChat,
      dbInstance: { getDocData: async () => null }
    });

    assert.deepEqual(result.history, customChat);
    assert.deepEqual(result.homeworkTask, customTask);
  });
});
