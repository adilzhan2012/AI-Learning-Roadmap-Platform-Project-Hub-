import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMode } from '../resolveMode.js';

describe('Frontend resolveMode unit tests', () => {
  const sampleProfile = {
    firstName: 'Даниил',
    enrolledCourses: [
      {
        id: 'course_react',
        title: 'React Fundamentals',
        nodes: [
          { id: 'node_hooks', label: 'Хуки в React: useEffect и useState', content: 'Материал по хукам...' }
        ]
      }
    ]
  };

  test('switches to lesson mode on match in global chat', () => {
    const res = resolveMode('Помоги с уроком Хуки в React: useEffect и useState', 'global', null, sampleProfile);
    assert.equal(res.mode, 'lesson');
    assert.equal(res.contextId, 'node_hooks');
    assert.equal(res.lessonTitle, 'Хуки в React: useEffect и useState');
  });

  test('retains global mode when query is general', () => {
    const res = resolveMode('Как написать резюме разработчика?', 'global', 'sess_1', sampleProfile);
    assert.equal(res.mode, 'global');
    assert.equal(res.contextId, 'sess_1');
  });
});
