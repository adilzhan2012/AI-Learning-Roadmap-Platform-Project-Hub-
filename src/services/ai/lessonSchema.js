/**
 * JSON Schema for Structured Outputs (Gemini / Vertex AI)
 */
export const LESSON_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Engaging main lesson title (H1)" },
    summary: { type: "string", description: "Short 2-3 sentence executive summary of the lesson" },
    contentMarkdown: { type: "string", description: "Deep, step-by-step lesson body in rich Markdown with explanations, examples, tables, analogies, and bolding." },
    mermaidDiagram: { type: "string", description: "Valid Mermaid diagram code without backticks wrapper or null if not applicable." },
    imageQuery: { type: "string", description: "1-3 concise English keywords for Unsplash/Wikipedia illustration search." },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          definition: { type: "string" }
        },
        required: ["term", "definition"]
      },
      description: "Array of 3-5 key flashcards for concept retention"
    },
    homework: {
      type: "object",
      properties: {
        task: { type: "string" },
        hint: { type: "string" },
        criteria: { type: "string" }
      },
      required: ["task", "hint", "criteria"],
      description: "Practical homework/exercise for the user"
    }
  },
  required: ["title", "summary", "contentMarkdown", "flashcards", "homework"]
};

/**
 * Fallback parser for non-JSON or plain markdown responses.
 */
function parseRawMarkdownToLesson(rawText, language = 'ru') {
  const text = String(rawText || '').trim();
  
  // Extract Title
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Урок';

  // Extract Image Query
  const imageMatch = text.match(/\[IMAGE:\s*(.*?)\]/i);
  const imageQuery = imageMatch ? imageMatch[1].trim() : '';

  // Extract Mermaid Diagram
  const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)```/i);
  const mermaidDiagram = mermaidMatch ? mermaidMatch[1].trim() : null;

  // Extract Flashcards
  const flashcards = [];
  const flashcardRegex = /---FLASHCARD---\s*(?:Term|Термин)\s*:\s*(.*?)\s*(?:Def|Definition|Определение|Объяснение)\s*:\s*(.*?)(?=\s*---FLASHCARD---|\s*---|\s*##|\s*$)/gi;
  let fcMatch;
  while ((fcMatch = flashcardRegex.exec(text)) !== null) {
    const term = fcMatch[1].replace(/---+$/, '').trim();
    const definition = fcMatch[2].replace(/---+$/, '').trim();
    if (term && definition) {
      flashcards.push({ term, definition });
    }
  }

  // Extract Homework
  const hwMatch = text.match(/##\s+(?:Практика|Домашнее задание|Homework|Practice)([\s\S]*?)(?=---FLASHCARD---|$)/i);
  const homework = hwMatch ? {
    task: hwMatch[1].trim(),
    hint: '',
    criteria: ''
  } : { task: '', hint: '', criteria: '' };

  // Clean body text
  let contentMarkdown = text
    .replace(/^#\s+.+$/m, '')
    .replace(/\[IMAGE:\s*.*?\]/gi, '')
    .replace(/---FLASHCARD---[\s\S]*?(?=(?:---FLASHCARD---|##|\n\s*\n\s*##|$))/gi, '')
    .replace(/\n\s*---\s*$/g, '')
    .trim();

  return {
    lessonData: {
      title,
      summary: '',
      contentMarkdown,
      mermaidDiagram,
      imageQuery,
      flashcards,
      homework
    },
    compiledContent: text
  };
}

/**
 * Safely parses raw AI response into structured lesson object and compiles
 * a backward-compatible content string for legacy components.
 */
export function parseAndValidateLessonJson(rawResponse, language = 'ru') {
  if (!rawResponse) {
    throw new Error('Empty AI response');
  }

  let parsed = null;
  if (typeof rawResponse === 'object' && rawResponse !== null) {
    parsed = rawResponse;
  } else {
    // Clean markdown json fences if any
    const cleaned = String(rawResponse)
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn("Failed to parse JSON response directly, attempting fallback extraction:", e);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
          console.warn("Extracted substring is not valid JSON, falling back to raw markdown parser:", innerErr);
          return parseRawMarkdownToLesson(rawResponse, language);
        }
      } else {
        console.warn("No JSON object found in AI response, falling back to raw markdown parser.");
        return parseRawMarkdownToLesson(rawResponse, language);
      }
    }
  }

  const title = parsed.title || 'Урок';
  const summary = parsed.summary || '';
  const contentMarkdown = parsed.contentMarkdown || parsed.summary || parsed.content || '';
  const mermaidDiagram = parsed.mermaidDiagram ? String(parsed.mermaidDiagram).replace(/^```mermaid\s*/i, '').replace(/```$/i, '').trim() : null;
  const imageQuery = parsed.imageQuery || '';
  const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
  const homework = parsed.homework || { task: '', hint: '', criteria: '' };

  const practiceHeading = language === 'en' ? '## Practice / Homework' : '## Практика / Домашнее задание';
  let compiledMarkdown = `# ${title}\n\n`;
  if (imageQuery) {
    compiledMarkdown += `[IMAGE: ${imageQuery}]\n\n`;
  }
  compiledMarkdown += `${contentMarkdown}\n\n`;

  if (mermaidDiagram) {
    compiledMarkdown += `\`\`\`mermaid\n${mermaidDiagram}\n\`\`\`\n\n`;
  }

  if (homework && homework.task) {
    compiledMarkdown += `${practiceHeading}\n${homework.task}\n\n**Hint:** ${homework.hint || ''}\n\n**Criteria:** ${homework.criteria || ''}\n\n`;
  }

  if (flashcards.length > 0) {
    flashcards.forEach(fc => {
      compiledMarkdown += `---FLASHCARD---\nTerm: ${fc.term}\nDef: ${fc.definition}\n---\n`;
    });
  }

  return {
    lessonData: {
      title,
      summary,
      contentMarkdown,
      mermaidDiagram,
      imageQuery,
      flashcards,
      homework
    },
    compiledContent: compiledMarkdown.trim()
  };
}
