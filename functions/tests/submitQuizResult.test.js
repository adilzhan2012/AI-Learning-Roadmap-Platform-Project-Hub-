const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('submitQuizResult Server Evaluation Logic', () => {
  const sampleQuestions = [
    {
      question: 'What is JSX?',
      options: ['JavaScript XML', 'JSON Syntax Extension', 'Java Standard XML', 'None of above'],
      correctIndex: 0,
      sectionHeading: 'JSX Basics'
    },
    {
      question: 'How do you define a React hook?',
      options: ['Function starting with use', 'Class method', 'Component starting with Hook', 'XML tag'],
      correctIndex: 0,
      sectionHeading: 'React Hooks'
    },
    {
      question: 'What does useEffect do?',
      options: ['Manages side effects', 'Compiles JSX', 'Renders HTML directly', 'Creates state'],
      correctAnswer: 0, // tests correctAnswer fallback
      sectionHeading: 'React Hooks'
    },
    {
      question: 'What is Virtual DOM?',
      options: ['Browser engine', 'In-memory representation of real DOM', 'Database engine', 'CSS parser'],
      correctIndex: 1,
      sectionHeading: 'Virtual DOM'
    },
    {
      question: 'Which prop is required for list items in React?',
      options: ['id', 'key', 'name', 'index'],
      correctIndex: 1,
      sectionHeading: 'Lists and Keys'
    }
  ];

  function evaluateQuizOnServer(questions, userAnswers) {
    let rawScore = 0;
    const total = Array.isArray(questions) ? questions.length : 0;
    const failedDetails = [];
    const failedConceptsSummary = {};

    if (total > 0) {
      questions.forEach((q, i) => {
        const correctIdx = typeof q.correctIndex === 'number'
          ? q.correctIndex
          : (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);

        const userAns = userAnswers != null
          ? (userAnswers[i] !== undefined ? userAnswers[i] : userAnswers[String(i)])
          : undefined;
        const isCorrect = userAns !== undefined && userAns !== null && Number(userAns) === correctIdx;

        if (isCorrect) {
          rawScore++;
        } else {
          const qText = q.question || q.questionText || q.prompt || q.title || `Question ${i + 1}`;
          const correctOption = Array.isArray(q.options) ? (q.options[correctIdx] || '') : '';
          const userOption = (Array.isArray(q.options) && userAns !== undefined && userAns !== null && q.options[Number(userAns)] !== undefined)
            ? q.options[Number(userAns)]
            : 'no answer';
          const sectionHeading = q.sectionHeading || '';

          failedDetails.push({
            questionText: qText,
            userAnswer: userOption,
            correctAnswer: correctOption,
            sectionHeading
          });

          const conceptKey = sectionHeading || qText.substring(0, 40);
          failedConceptsSummary[conceptKey] = (failedConceptsSummary[conceptKey] || 0) + 1;
        }
      });
    }

    const scorePercentage = total > 0 ? Math.round((rawScore / total) * 100) : 0;
    const passed = total > 0 ? (rawScore / total) >= 0.6 : false;

    return {
      rawScore,
      total,
      scorePercentage,
      passed,
      failedDetails,
      failedConceptsSummary
    };
  }

  test('Perfect Score: calculates 5/5 (100%) when all answers match correctIndex', () => {
    const userAnswers = [0, 0, 0, 1, 1];
    const result = evaluateQuizOnServer(sampleQuestions, userAnswers);

    assert.equal(result.rawScore, 5);
    assert.equal(result.total, 5);
    assert.equal(result.scorePercentage, 100);
    assert.equal(result.passed, true);
    assert.equal(result.failedDetails.length, 0);
    assert.deepEqual(result.failedConceptsSummary, {});
  });

  test('Passing Score: calculates 3/5 (60%) as passed', () => {
    const userAnswers = [0, 0, 0, 0, 0]; // Questions 3 and 4 are wrong
    const result = evaluateQuizOnServer(sampleQuestions, userAnswers);

    assert.equal(result.rawScore, 3);
    assert.equal(result.total, 5);
    assert.equal(result.scorePercentage, 60);
    assert.equal(result.passed, true);
    assert.equal(result.failedDetails.length, 2);
    assert.equal(result.failedConceptsSummary['Virtual DOM'], 1);
    assert.equal(result.failedConceptsSummary['Lists and Keys'], 1);
  });

  test('Failing Score: calculates 2/5 (40%) as failed', () => {
    const userAnswers = [0, 1, 1, 1, 0]; // 3 wrong answers
    const result = evaluateQuizOnServer(sampleQuestions, userAnswers);

    assert.equal(result.rawScore, 2);
    assert.equal(result.total, 5);
    assert.equal(result.scorePercentage, 40);
    assert.equal(result.passed, false);
    assert.equal(result.failedDetails.length, 3);
    assert.equal(result.failedConceptsSummary['React Hooks'], 2);
    assert.equal(result.failedConceptsSummary['Lists and Keys'], 1);
  });

  test('Object with Numeric Keys: handles { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1 } correctly', () => {
    const userAnswers = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1 };
    const result = evaluateQuizOnServer(sampleQuestions, userAnswers);

    assert.equal(result.rawScore, 5);
    assert.equal(result.passed, true);
  });

  test('Object with String Keys: handles { "0": 0, "1": 0, "2": 0, "3": 1, "4": 1 } correctly', () => {
    const userAnswers = { "0": 0, "1": 0, "2": 0, "3": 1, "4": 1 };
    const result = evaluateQuizOnServer(sampleQuestions, userAnswers);

    assert.equal(result.rawScore, 5);
    assert.equal(result.passed, true);
  });

  test('Skipped / Missing answers: safely treated as incorrect with "no answer"', () => {
    const userAnswers = { 0: 0 }; // Only answered first question
    const result = evaluateQuizOnServer(sampleQuestions, userAnswers);

    assert.equal(result.rawScore, 1);
    assert.equal(result.total, 5);
    assert.equal(result.passed, false);
    assert.equal(result.failedDetails.length, 4);
    assert.equal(result.failedDetails[0].userAnswer, 'no answer');
  });

  test('Empty questions: returns 0 score without throwing error', () => {
    const result = evaluateQuizOnServer([], {});
    assert.equal(result.rawScore, 0);
    assert.equal(result.total, 0);
    assert.equal(result.scorePercentage, 0);
    assert.equal(result.passed, false);
  });
});
