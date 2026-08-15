const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { processUsageLimitAndCounter } = require('../index.js');

// Mock Firestore Admin FieldValue
const adminMock = {
  firestore: {
    FieldValue: {
      increment: (val) => ({ _type: 'increment', value: val }),
      serverTimestamp: () => ({ _type: 'timestamp' })
    }
  },
  auth: () => ({
    getUser: async () => ({
      metadata: { creationTime: new Date().toISOString() }
    })
  })
};

// In-Memory Transactional Firestore Mock
function createTransactionalMockDb(initialDocData = {}) {
  let docStore = { ...initialDocData };

  return {
    getStore: () => docStore,
    collection: (colName) => ({
      doc: (docId) => ({
        collection: (subColName) => ({
          doc: (subDocId) => {
            const path = `${colName}/${docId}/${subColName}/${subDocId}`;
            return {
              path,
              get: async () => ({
                exists: docStore[path] !== undefined,
                data: () => docStore[path] || {}
              })
            };
          }
        })
      })
    }),
    runTransaction: async (updateFunction) => {
      // Snapshot state at start of transaction
      const txn = {
        get: async (docRef) => {
          const path = docRef.path;
          const exists = docStore[path] !== undefined;
          const data = exists ? JSON.parse(JSON.stringify(docStore[path])) : {};
          return { exists, data: () => data };
        },
        set: (docRef, updates, options = {}) => {
          const path = docRef.path;
          const current = docStore[path] || {};
          const merged = { ...current };

          for (const [key, val] of Object.entries(updates)) {
            if (val && val._type === 'increment') {
              merged[key] = (merged[key] || 0) + val.value;
            } else {
              merged[key] = val;
            }
          }
          docStore[path] = merged;
        }
      };

      return await updateFunction(txn);
    }
  };
}

describe('processUsageLimitAndCounter - ULTRA tokens daily reset unit tests', () => {
  const userId = 'ultra_test_user';
  const subDocPath = `users/${userId}/subscription/details`;
  const todayStr = '2026-08-15';
  const yesterdayStr = '2026-08-14';
  const monthStr = '2026-08';

  test('Scenario 1: ULTRA user makes request on the same day (accumulates tokens without reset)', async () => {
    const mockDb = createTransactionalMockDb({
      [subDocPath]: {
        plan: 'ULTRA',
        ultraTokensUsed: 120000,
        mentorMessagesUsed: 4,
        lastMentorDate: todayStr,
        mentorMonthStart: monthStr
      }
    });

    const result = await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'mentor_message',
      todayStr,
      monthStr
    );

    assert.equal(result.plan, 'ULTRA');
    assert.equal(result.updatedUsageCount, 5, 'mentorMessagesUsed should increment to 5');

    const updatedDoc = mockDb.getStore()[subDocPath];
    assert.equal(updatedDoc.lastMentorDate, todayStr);
    assert.equal(updatedDoc.mentorMessagesUsed, 5);
    // ultraTokensUsed should not be reset to 0 because date is still today
    assert.equal(updatedDoc.ultraTokensUsed, 120000);
  });

  test('Scenario 2: ULTRA user makes request on next day (resets ultraTokensUsed to 0)', async () => {
    const mockDb = createTransactionalMockDb({
      [subDocPath]: {
        plan: 'ULTRA',
        ultraTokensUsed: 295000, // almost exhausted yesterday
        mentorMessagesUsed: 35,
        lastMentorDate: yesterdayStr, // yesterday
        mentorMonthStart: monthStr
      }
    });

    const result = await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'mentor_message',
      todayStr,
      monthStr
    );

    assert.equal(result.plan, 'ULTRA');
    assert.equal(result.updatedUsageCount, 1, 'mentorMessagesUsed resets to 1 on new day');

    const updatedDoc = mockDb.getStore()[subDocPath];
    assert.equal(updatedDoc.lastMentorDate, todayStr, 'Date must be updated to today');
    assert.equal(updatedDoc.mentorMessagesUsed, 1);
    assert.equal(updatedDoc.ultraTokensUsed, 0, 'ultraTokensUsed must be reset to 0 in transaction');
  });

  test('Scenario 3: Previously blocked user (>= 300k tokens from old day) is unblocked on new day', async () => {
    const mockDb = createTransactionalMockDb({
      [subDocPath]: {
        plan: 'ULTRA',
        ultraTokensUsed: 450000, // blocked on old day!
        mentorMessagesUsed: 50,
        lastMentorDate: yesterdayStr,
        mentorMonthStart: monthStr
      }
    });

    // Should NOT throw PLAN_LIMIT_EXCEEDED because yesterday tokens are not counted for today
    const result = await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'mentor_message',
      todayStr,
      monthStr
    );

    assert.equal(result.plan, 'ULTRA');
    assert.equal(result.updatedUsageCount, 1);

    const updatedDoc = mockDb.getStore()[subDocPath];
    assert.equal(updatedDoc.ultraTokensUsed, 0, 'Tokens reset to 0 on new day');
  });

  test('Scenario 4: Limit exceeded on the same day throws PLAN_LIMIT_EXCEEDED', async () => {
    const mockDb = createTransactionalMockDb({
      [subDocPath]: {
        plan: 'ULTRA',
        ultraTokensUsed: 300000, // limit reached TODAY
        mentorMessagesUsed: 20,
        lastMentorDate: todayStr,
        mentorMonthStart: monthStr
      }
    });

    await assert.rejects(
      async () => {
        await processUsageLimitAndCounter(
          mockDb,
          adminMock,
          userId,
          'mentor_message',
          todayStr,
          monthStr
        );
      },
      (err) => {
        assert.equal(err.code, 'failed-precondition');
        assert.equal(err.message, 'PLAN_LIMIT_EXCEEDED');
        return true;
      }
    );
  });

  test('Scenario 5: Two sequential requests after midnight correctly increment without resetting twice', async () => {
    const mockDb = createTransactionalMockDb({
      [subDocPath]: {
        plan: 'ULTRA',
        ultraTokensUsed: 280000,
        lastMentorDate: yesterdayStr,
        mentorMonthStart: monthStr
      }
    });

    // First request of the new day
    await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'mentor_message',
      todayStr,
      monthStr
    );

    // Simulate post-API token increment for request 1
    const store = mockDb.getStore();
    store[subDocPath].ultraTokensUsed += 500; // 0 + 500 = 500

    // Second request on the same day
    await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'mentor_message',
      todayStr,
      monthStr
    );

    // Simulate post-API token increment for request 2
    store[subDocPath].ultraTokensUsed += 700; // 500 + 700 = 1200

    const finalDoc = mockDb.getStore()[subDocPath];
    assert.equal(finalDoc.lastMentorDate, todayStr);
    assert.equal(finalDoc.mentorMessagesUsed, 2);
    assert.equal(finalDoc.ultraTokensUsed, 1200, 'Tokens should accumulate to 1200 without being reset again');
  });

  test('Scenario 6: First request of the day is homework_review, followed by mentor_message', async () => {
    const mockDb = createTransactionalMockDb({
      [subDocPath]: {
        plan: 'ULTRA',
        ultraTokensUsed: 290000, // yesterday tokens
        lastMentorDate: yesterdayStr,
        homeworkReviewsUsed: 2,
        homeworkMonthStart: monthStr
      }
    });

    // Step 1: User does homework_review as their first action of the new day
    await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'homework_review',
      todayStr,
      monthStr
    );

    const afterHwDoc = mockDb.getStore()[subDocPath];
    assert.equal(afterHwDoc.lastMentorDate, todayStr, 'lastMentorDate must be updated to today');
    assert.equal(afterHwDoc.ultraTokensUsed, 0, 'ultraTokensUsed must be reset to 0 during homework_review');
    assert.equal(afterHwDoc.homeworkReviewsUsed, 3);

    // Step 2: User subsequently calls mentor_message later the same day
    const mentorResult = await processUsageLimitAndCounter(
      mockDb,
      adminMock,
      userId,
      'mentor_message',
      todayStr,
      monthStr
    );

    assert.equal(mentorResult.plan, 'ULTRA');
    assert.equal(mentorResult.updatedUsageCount, 1);

    // Simulate post-API token increment for the mentor message
    const store = mockDb.getStore();
    store[subDocPath].ultraTokensUsed += 600;

    const finalDoc = mockDb.getStore()[subDocPath];
    assert.equal(finalDoc.ultraTokensUsed, 600, 'Final tokens should be 600, not 290600');
  });
});
