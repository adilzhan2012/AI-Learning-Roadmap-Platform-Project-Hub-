const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { stripActionBlocks } = require('../stripActionBlocks.js');

describe('stripActionBlocks unit tests', () => {
  test('strips ```json { action: "propose_course" } ``` markdown blocks', () => {
    const raw = `Я составил для вас программу обучения.
\`\`\`json
{
  "action": "propose_course",
  "topic": "Python для начинающих",
  "modules": ["Основы", "Функции", "ООП"]
}
\`\`\`
Посмотрите, всё ли вам подходит?`;

    const cleaned = stripActionBlocks(raw);
    assert.match(cleaned, /Я составил для вас программу обучения\./);
    assert.match(cleaned, /Посмотрите, всё ли вам подходит\?/);
    assert.equal(cleaned.includes('"action": "propose_course"'), false);
    assert.equal(cleaned.includes('```json'), false);
  });

  test('strips ```json { action: "generate_course" } ``` markdown blocks', () => {
    const raw = `Отлично! Начинаю генерацию курса.
\`\`\`json
{
  "action": "generate_course",
  "topic": "Go",
  "level": "Intermediate"
}
\`\`\`
Перенаправляю вас в граф курса...`;

    const cleaned = stripActionBlocks(raw);
    assert.match(cleaned, /Отлично! Начинаю генерацию курса\./);
    assert.match(cleaned, /Перенаправляю вас в граф курса\.\.\./);
    assert.equal(cleaned.includes('"action": "generate_course"'), false);
  });

  test('strips raw inline { "action": "propose_course" } blocks', () => {
    const raw = `Вот черновик курса: {"action": "propose_course", "topic": "Docker"}. Как вам?`;
    const cleaned = stripActionBlocks(raw);
    assert.equal(cleaned.includes('"action"'), false);
    assert.match(cleaned, /Вот черновик курса:/);
  });

  test('does not strip normal code blocks or unrelated JSON', () => {
    const codeBlock = 'Here is an example:\n```javascript\nconst a = { x: 1, y: 2 };\n```\nDoes this help?';
    assert.equal(stripActionBlocks(codeBlock), codeBlock.trim());
  });

  test('handles null, undefined, or empty string safely', () => {
    assert.equal(stripActionBlocks(null), '');
    assert.equal(stripActionBlocks(undefined), '');
    assert.equal(stripActionBlocks(''), '');
  });
});
