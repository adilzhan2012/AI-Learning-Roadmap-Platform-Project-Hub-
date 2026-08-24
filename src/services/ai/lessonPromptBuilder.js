import { sanitizeUserInput } from '../../utils/sanitizeUserInput.js';

/**
 * Builds system instruction and user prompt for structured lesson generation.
 */
export function buildLessonPrompt({ courseTitle, topicLabel, topicDesc, language = 'ru', preferences = {} }) {
  const languageName = language === 'ru' ? 'Russian' : 'English';
  
  let prefString = '';
  let flashcardCount = 6;

  if (preferences.dailyTime || preferences.flashcardCount || preferences.courseStyle) {
    const timeStr = preferences.dailyTime === '15m' ? '15 minutes per day' : preferences.dailyTime === '60m' ? '1 hour per day' : '30 minutes per day';
    const styleStr = preferences.courseStyle === 'Simple' ? 'Simple and explain-like-I-am-5 style' : preferences.courseStyle === 'Gamified' ? 'Gamified / Fantasy style' : 'Friendly and conversational style';
    prefString = `Pace: ${timeStr}. Style: ${styleStr}.`;
    if (preferences.flashcardCount) {
      flashcardCount = preferences.flashcardCount;
    }
  } else if (preferences.focus || preferences.goal || preferences.tone || preferences.stack) {
    prefString = `Focus: ${preferences.focus || 'Theory'}. Goal: ${preferences.goal || 'General'}. Tone: ${preferences.tone || 'Academic'}. Stack: ${preferences.stack || 'Agnostic'}.`;
  }

  const flashcardInstruction = preferences.flashcardCount 
    ? `EXACTLY ${flashcardCount}` 
    : 'between 5 and 7';

  const systemInstruction = `You are a world-class pedagogue and domain expert AI tutor on the YourWay learning platform.
Your task is to generate an in-depth, clear, highly structured lesson strictly formatted as a JSON object.

CRITICAL INSTRUCTIONS:
1. Target Language: ALL textual content (title, summary, contentMarkdown, flashcards, homework) MUST be strictly in ${languageName}.
2. Structural Richness: 'contentMarkdown' must be long, comprehensive, and rich in pedagogical value (at least 400-800 words). Include sub-headings (## and ###), clear step-by-step explanations, analogies, real-world examples, Markdown tables, lists, and bold text for key terms. Do NOT provide an empty or brief text.
3. Diagrams: 'mermaidDiagram' must contain a valid, syntactically clean Mermaid diagram code as a string (e.g. "graph TD\\n  A --> B"), or null if not suitable. Do NOT wrap it in markdown codeblocks.
4. Images: 'imageQuery' must be 1-3 English keywords representing the central concept for image search.
5. Flashcards: Include ${flashcardInstruction} flashcard objects ({ "term": "...", "definition": "..." }) covering core terminology, key concepts, and rationale.
6. Homework: Provide 1 practical assignment in 'homework' object with 'task', 'hint', and 'criteria'.
7. Real-World Application: In 'realWorldApplication', provide 2-3 concrete practical use cases and career applications where this knowledge is used in real life.
8. Output format: Return strictly a valid JSON object matching this schema:
{
  "title": "Engaging lesson title (H1)",
  "summary": "Short 2-3 sentence overview",
  "contentMarkdown": "Deep, multi-section lesson body in rich Markdown with explanations, examples, tables, and analogies",
  "realWorldApplication": "Detailed real-world applications and industry examples",
  "mermaidDiagram": "graph TD\\n  A --> B",
  "imageQuery": "concept keywords in english",
  "flashcards": [
    { "term": "Term 1", "definition": "Clear explanation of term 1" }
  ],
  "homework": {
    "task": "Practical exercise description",
    "hint": "Helpful hint",
    "criteria": "Evaluation criteria"
  }
}
Do NOT include markdown code fences (\`\`\`json), greetings, or text outside the JSON object.`;

  const userPrompt = `Course: "${sanitizeUserInput(courseTitle, 200)}"
Topic: "${sanitizeUserInput(topicLabel, 300)}"
Context: ${sanitizeUserInput(topicDesc, 500)}
${prefString ? `User Preferences: ${prefString}` : ''}

CRITICAL: Output ONLY valid JSON with a detailed, full 'contentMarkdown' section.`.trim();

  return {
    systemInstruction,
    userPrompt
  };
}
