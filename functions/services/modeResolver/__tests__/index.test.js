const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { resolveMode } = require('../index.js');

describe('Mode Resolver unit tests', () => {
  const sampleProfile = {
    firstName: 'Даниил',
    enrolledCourses: [
      {
        id: 'course_react',
        title: 'React Fundamentals',
        nodes: [
          { id: 'node_hooks', label: 'Хуки в React: useEffect и useState', content: 'Материал по хукам...' },
          { id: 'node_context', label: 'Контекст и Redux Toolkit', content: 'Материал по стейту...' }
        ]
      },
      {
        id: 'course_docker',
        title: 'Docker & Kubernetes',
        nodes: [
          { id: 'node_compose', label: 'Docker Compose и сети', content: 'Материал по Docker Compose...' }
        ]
      }
    ]
  };

  test('Exact match: switches from global to lesson mode when user mentions lesson title', () => {
    const result = resolveMode(
      'Объясни мне подробнее хуки в react useEffect и useState',
      'global',
      null,
      sampleProfile
    );

    assert.equal(result.mode, 'lesson');
    assert.equal(result.contextId, 'node_hooks');
    assert.equal(result.lessonTitle, 'Хуки в React: useEffect и useState');
    assert.match(result.lessonContent, /Материал по хукам/);
  });

  test('Intent keyword + partial title match: switches to lesson mode', () => {
    const result = resolveMode(
      'Помоги с уроком про docker compose',
      'global',
      null,
      sampleProfile
    );

    assert.equal(result.mode, 'lesson');
    assert.equal(result.contextId, 'node_compose');
    assert.equal(result.lessonTitle, 'Docker Compose и сети');
  });

  test('No match: remains in global mode for general questions', () => {
    const result = resolveMode(
      'Как устроен протокол HTTP/3?',
      'global',
      'session_123',
      sampleProfile
    );

    assert.equal(result.mode, 'global');
    assert.equal(result.contextId, 'session_123');
    assert.equal(result.lessonTitle, null);
  });

  test('Empty courses: remains in global mode safely', () => {
    const result = resolveMode(
      'Объясни хуки в react',
      'global',
      'session_456',
      { enrolledCourses: [] }
    );

    assert.equal(result.mode, 'global');
    assert.equal(result.contextId, 'session_456');
  });

  test('Non-global mode: never switches when already in homework mode', () => {
    const result = resolveMode(
      'Объясни хуки в React',
      'homework',
      'hw_node_1',
      sampleProfile
    );

    assert.equal(result.mode, 'homework');
    assert.equal(result.contextId, 'hw_node_1');
  });

  test('Non-global mode: never switches when already in lesson mode', () => {
    const result = resolveMode(
      'Объясни Docker Compose',
      'lesson',
      'node_hooks',
      sampleProfile
    );

    assert.equal(result.mode, 'lesson');
    assert.equal(result.contextId, 'node_hooks');
  });
});
