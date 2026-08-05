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

  // Strip markdown code fences if present
  const fenceJsonStart = new RegExp("^```json\\s*", "i");
  const fenceStart = new RegExp("^```\\s*", "i");
  const fenceEnd = new RegExp("```\\s*$", "i");

  clean = clean.replace(fenceJsonStart, "").replace(fenceEnd, "").trim();
  clean = clean.replace(fenceStart, "").replace(fenceEnd, "").trim();

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

  try {
    return JSON.parse(clean);
  } catch (cause) {
    throw new AIParsingError("Не удалось распарсить JSON из ответа ИИ", text, cause);
  }
}
