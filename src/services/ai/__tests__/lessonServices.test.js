import test, { describe } from 'node:test';
import assert from 'node:assert';
import { parseAndValidateLessonJson, LESSON_JSON_SCHEMA } from '../lessonSchema.js';
import { buildLessonPrompt } from '../lessonPromptBuilder.js';

describe('lessonSchema unit tests', () => {
  test('correctly parses structured lesson object and compiles content', () => {
    const rawObj = {
      title: "Основы React",
      summary: "Краткое введение в компоненты.",
      contentMarkdown: "React — это JavaScript-библиотека для создания пользовательских интерфейсов.",
      mermaidDiagram: "graph TD\n  A[App] --> B[Header]",
      imageQuery: "React JS",
      flashcards: [
        { term: "Component", definition: "Строительный блок UI" },
        { term: "JSX", definition: "Синтаксический сахар для JavaScript" }
      ],
      homework: {
        task: "Создайте компонент Button",
        hint: "Используйте JSX",
        criteria: "Компонент рендерит кнопку"
      }
    };

    const { lessonData, compiledContent } = parseAndValidateLessonJson(rawObj, 'ru');

    assert.strictEqual(lessonData.title, "Основы React");
    assert.strictEqual(lessonData.flashcards.length, 2);
    assert.strictEqual(lessonData.mermaidDiagram, "graph TD\n  A[App] --> B[Header]");
    assert.strictEqual(lessonData.imageQuery, "React JS");
    assert.ok(compiledContent.includes("# Основы React"));
    assert.ok(compiledContent.includes("[IMAGE: React JS]"));
    assert.ok(compiledContent.includes("```mermaid"));
    assert.ok(compiledContent.includes("---FLASHCARD---"));
  });

  test('parses JSON string wrapped in markdown codeblocks', () => {
    const rawJsonStr = `\`\`\`json
{
  "title": "Async/Await в JS",
  "summary": "Изучаем асинхронное программирование.",
  "contentMarkdown": "Async/Await упрощает работу с Promise.",
  "mermaidDiagram": null,
  "imageQuery": "JavaScript Async",
  "flashcards": [],
  "homework": {
    "task": "Напишите async функцию",
    "hint": "Используйте try/catch",
    "criteria": "Функция обрабатывает ошибки"
  }
}
\`\`\``;

    const { lessonData, compiledContent } = parseAndValidateLessonJson(rawJsonStr, 'ru');
    assert.strictEqual(lessonData.title, "Async/Await в JS");
    assert.strictEqual(lessonData.imageQuery, "JavaScript Async");
    assert.ok(compiledContent.includes("# Async/Await в JS"));
  });

  test('gracefully falls back when AI returns raw non-JSON text', () => {
    const rawMarkdownStr = `Отлично! Ниже представлен ваш урок:

# Основы Express.js

[IMAGE: Express.js]

Express — это минималистичный веб-фреймворк для Node.js.

\`\`\`mermaid
graph TD
  A[Client] --> B[Express Server]
\`\`\`

## Практика / Домашнее задание
Создайте простой сервер на Express.

---FLASHCARD---
Term: Express
Def: Веб-фреймворк для Node.js
---`;

    const { lessonData, compiledContent } = parseAndValidateLessonJson(rawMarkdownStr, 'ru');
    assert.strictEqual(lessonData.title, "Основы Express.js");
    assert.strictEqual(lessonData.imageQuery, "Express.js");
    assert.strictEqual(lessonData.flashcards.length, 1);
    assert.strictEqual(lessonData.flashcards[0].term, "Express");
    assert.ok(compiledContent.includes("Основы Express.js"));
  });
});

describe('lessonPromptBuilder unit tests', () => {
  test('builds correct prompt and system instruction for Russian language', () => {
    const { systemInstruction, userPrompt } = buildLessonPrompt({
      courseTitle: "Веб-разработка",
      topicLabel: "Flexbox верстка",
      topicDesc: "Позиционирование элементов",
      language: 'ru',
      preferences: { flashcardCount: 5 }
    });

    assert.ok(systemInstruction.includes("Russian"));
    assert.ok(systemInstruction.includes("EXACTLY 5 flashcard"));
    assert.ok(userPrompt.includes('Course: "Веб-разработка"'));
    assert.ok(userPrompt.includes('Topic: "Flexbox верстка"'));
  });
});
