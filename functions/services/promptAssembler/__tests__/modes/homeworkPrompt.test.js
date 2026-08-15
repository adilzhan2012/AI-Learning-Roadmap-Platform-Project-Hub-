const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getHomeworkPrompt } = require('../../modes/homeworkPrompt.js');

describe('modes/homeworkPrompt unit tests', () => {
  test('enforces Socratic instructions: prohibits direct answers and code solutions', () => {
    const prompt = getHomeworkPrompt({
      mode: 'homework',
      lessonTitle: 'Алгоритмы сортировки',
      lessonContent: 'Быстрая сортировка использует выбор опорного элемента...',
      homeworkTask: {
        prompt: 'Напишите partition функцию на Python.'
      },
      courseLanguage: 'ru'
    });

    assert.match(prompt, /MODE: SOCRATIC HOMEWORK MENTOR/);
    assert.match(prompt, /CRITICAL SOCRATIC INSTRUCTIONS:/);
    assert.match(prompt, /DO NOT solve the homework for the user/);
    assert.match(prompt, /DO NOT give them the direct answer or complete code solution/);
    assert.match(prompt, /give them hints, point out where to look/);
    assert.match(prompt, /Напишите partition функцию на Python/);
    assert.match(prompt, /Answer in Russian/);
  });

  test('generates English instructions when courseLanguage is en', () => {
    const prompt = getHomeworkPrompt({
      mode: 'homework',
      lessonTitle: 'Dynamic Programming',
      homeworkTask: { prompt: 'Solve 0/1 Knapsack problem.' },
      courseLanguage: 'en'
    });

    assert.match(prompt, /Answer in English/);
  });
});
