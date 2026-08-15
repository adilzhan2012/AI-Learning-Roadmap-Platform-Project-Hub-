const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getLessonPrompt } = require('../../modes/lessonPrompt.js');

describe('modes/lessonPrompt unit tests', () => {
  test('truncates lessonContent to 3000 chars and includes Russian guardrail & checking question', () => {
    const longLesson = 'X'.repeat(4000);
    const prompt = getLessonPrompt({
      mode: 'lesson',
      lessonTitle: 'Основы React Hooks',
      courseTitle: 'React Developer Roadmap',
      lessonContent: longLesson,
      courseLanguage: 'ru'
    });

    assert.match(prompt, /MODE: CONTEXTUAL LESSON MENTOR/);
    assert.match(prompt, /Target Lesson: "Основы React Hooks"/);
    assert.match(prompt, /Course: "React Developer Roadmap"/);
    assert.match(prompt, /Я помогаю только с материалами этого урока/);
    assert.match(prompt, /Понятно ли это место\?/);
    assert.match(prompt, /Strictly respond in Russian/);

    // Verify 3000 chars truncation
    const contentMatch = prompt.match(/LESSON CONTENT FOR CONTEXT:\n([\s\S]*?)\n\nLESSON MODE INSTRUCTIONS:/);
    assert.ok(contentMatch);
    assert.equal(contentMatch[1].length, 3000);
  });

  test('generates English guardrail & checking question when courseLanguage is en', () => {
    const prompt = getLessonPrompt({
      mode: 'lesson',
      lessonTitle: 'Binary Search Trees',
      courseTitle: 'Data Structures in Java',
      lessonContent: 'A BST is a binary tree where...',
      courseLanguage: 'en'
    });

    assert.match(prompt, /I am your personal AI Mentor for this lesson/);
    assert.match(prompt, /Is this clear\? How would you summarize/);
    assert.match(prompt, /Strictly respond in English/);
  });
});
