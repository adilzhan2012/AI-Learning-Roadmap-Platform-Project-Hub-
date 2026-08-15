import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fetchUserSubscription } from '../../sources/subscription.js';

describe('sources/subscription unit tests', () => {
  test('returns default FREE plan when DB document does not exist', async () => {
    const mockDb = {
      getDocData: async () => null
    };

    const { plan, usage } = await fetchUserSubscription('user_free_1', { dbInstance: mockDb });

    assert.equal(plan, 'FREE');
    assert.equal(usage.mentorMessagesUsed, 0);
    assert.equal(usage.ultraTokensUsed, 0);
    assert.equal(usage.homeworkReviewsUsed, 0);
  });

  test('correctly fetches PRO plan and normalizes daily rollover counters', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = '2020-01-01';

    const mockDb = {
      getDocData: async (path) => {
        if (path === 'users/user_pro_1/subscription/details') {
          return {
            plan: 'PRO',
            mentorMessagesUsed: 15,
            lastMentorDate: yesterdayStr, // yesterday -> active daily count should be 0
            aiQuestionsUsed: 4,
            lastQuestionDate: todayStr,   // today -> active daily count is 4
            homeworkReviewsUsed: 5,
            homeworkMonthStart: todayStr.substring(0, 7)
          };
        }
        return null;
      }
    };

    const { plan, usage } = await fetchUserSubscription('user_pro_1', { dbInstance: mockDb });

    assert.equal(plan, 'PRO');
    assert.equal(usage.mentorMessagesUsed, 0, 'Yesterday mentor count must be reset to 0');
    assert.equal(usage.aiQuestionsUsed, 4, 'Today question count must be preserved');
    assert.equal(usage.homeworkReviewsUsed, 5);
  });

  test('calculates isFreeOnboarding when userCreationTime is within 7 days', async () => {
    const creationTime = Date.now() - (2 * 24 * 60 * 60 * 1000); // 2 days ago
    const { usage } = await fetchUserSubscription('user_new', {
      userCreationTime: creationTime,
      dbInstance: { getDocData: async () => null }
    });

    assert.equal(usage.isFreeOnboarding, true);
  });
});
