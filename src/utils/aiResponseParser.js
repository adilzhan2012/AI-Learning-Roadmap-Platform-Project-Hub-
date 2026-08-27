export class AIParsingError extends Error {
  constructor(message, rawText, cause = null) {
    super(message);
    this.name = "AIParsingError";
    this.rawText = rawText;
    this.cause = cause;
    this.userMessage = "Не удалось обработать ответ от ИИ. Пожалуйста, попробуйте снова.";
  }
}

export function parseAIJson(text) {
  if (!text || typeof text !== "string") {
    throw new AIParsingError("Ответ от ИИ пуст или не является строкой", text);
  }

  let clean = text.trim();

  // Extract from markdown code block ```json ... ``` or ``` ... ``` if present anywhere
  const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    clean = fenceMatch[1].trim();
  }

  // Strip leading/trailing code fences if still present
  clean = clean
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Find outer JSON boundaries: object { ... } or array [ ... ]
  const firstBrace = clean.indexOf("{");
  const firstBracket = clean.indexOf("[");

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = clean.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = clean.lastIndexOf("]");
  }

  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.substring(start, end + 1);
  }

  // Sanitize unescaped control characters (like newlines) inside JSON string values
  let inString = false;
  let isEscaped = false;
  let sanitized = '';
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inString) {
      if (char === '"' && !isEscaped) {
        inString = false;
        sanitized += char;
      } else if (char === '\\') {
        isEscaped = !isEscaped;
        sanitized += char;
      } else if (char === '\n') {
        sanitized += '\\n';
        isEscaped = false;
      } else if (char === '\r') {
        sanitized += '\\r';
        isEscaped = false;
      } else if (char === '\t') {
        sanitized += '\\t';
        isEscaped = false;
      } else if (char.charCodeAt(0) < 32) {
        // Strip other unescaped control characters that are invalid in JSON strings
        isEscaped = false;
      } else {
        isEscaped = false;
        sanitized += char;
      }
    } else {
      if (char === '"') {
        inString = true;
        isEscaped = false;
      }
      sanitized += char;
    }
  }
  clean = sanitized;

  try {
    return JSON.parse(clean);
  } catch (cause) {
    throw new AIParsingError("Не удалось распарсить JSON из ответа ИИ", text, cause);
  }
}
