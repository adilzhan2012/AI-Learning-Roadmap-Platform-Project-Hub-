import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMessage } from '../normalizeMessage.js';

describe('normalizeMessage unit tests', () => {
  test('normalizes standard user message', () => {
    const input = { role: 'user', content: 'What is React?' };
    assert.deepEqual(normalizeMessage(input), {
      role: 'user',
      content: 'What is React?'
    });
  });

  test('normalizes assistant message with id', () => {
    const input = { id: 'msg_101', role: 'assistant', content: 'React is a library...' };
    assert.deepEqual(normalizeMessage(input), {
      id: 'msg_101',
      role: 'assistant',
      content: 'React is a library...'
    });
  });

  test('handles case-insensitive roles and defaults unknown role to user', () => {
    assert.equal(normalizeMessage({ role: 'ASSISTANT', content: 'Hi' }).role, 'assistant');
    assert.equal(normalizeMessage({ role: 'admin', content: 'Hi' }).role, 'user');
    assert.equal(normalizeMessage({ role: '', content: 'Hi' }).role, 'user');
  });

  test('converts non-string content to string safely', () => {
    assert.equal(normalizeMessage({ role: 'user', content: 12345 }).content, '12345');
    assert.equal(normalizeMessage({ role: 'user', content: null }).content, '');
    assert.equal(normalizeMessage({ role: 'user', content: undefined }).content, '');
  });

  test('returns null for null, undefined, or primitive input', () => {
    assert.equal(normalizeMessage(null), null);
    assert.equal(normalizeMessage(undefined), null);
    assert.equal(normalizeMessage('string'), null);
    assert.equal(normalizeMessage(123), null);
  });
});
