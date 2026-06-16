import { genAI } from '../config/gemini.js';

export class GeminiService {
  async generateCourseContent(nodeTitle, nodeDescription, lang = 'ru') {
    if (!genAI) {
      throw new Error('Gemini API is not initialized. Please verify your GEMINI_API_KEY environment variable.');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const languageName = lang === 'en' ? 'English' : 'Russian';

    const prompt = `
      You are an expert AI professor. Generate a complete, high-fidelity interactive course curriculum in ${languageName} for the topic: "${nodeTitle}" (Description: ${nodeDescription}).
      
      Generate exactly 4 lessons. The lessons should start simple and progress to intermediate/advanced parts of this topic.
      The output MUST be a valid JSON object matching the following structure:
      
      {
        "lessons": [
          {
            "id": "lesson-1",
            "title": "Title of the first lesson",
            "content": "Detailed theoretical content for lesson 1, formatted in beautiful markdown. Write at least 4-5 paragraphs of high-quality material. Include code snippets, lists, or headers where appropriate. Everything must be in ${languageName}.",
            "quiz": {
              "question": "A multiple-choice question testing the knowledge from this lesson's content.",
              "options": [
                "Option A (correct or incorrect)",
                "Option B (correct or incorrect)",
                "Option C (correct or incorrect)",
                "Option D (correct or incorrect)"
              ],
              "correctIndex": 0, // Number between 0 and 3 indicating the index of the correct option
              "explanation": "A detailed explanation of why the correct option is right."
            }
          }
        ]
      }
      
      Remember:
      1. Write all text, theory, quizzes, options, and explanations in ${languageName}.
      2. The theoretical content MUST be comprehensive and helpful, not just brief bullet points.
      3. Options in "quiz.options" must have exactly 4 strings.
      4. Return ONLY the JSON object conforming to the schema.
    `;

    try {
      console.log(`Calling Gemini API to generate course content in ${languageName} for: "${nodeTitle}"...`);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (!parsed.lessons || !Array.isArray(parsed.lessons)) {
        throw new Error('Invalid JSON structure returned from Gemini.');
      }

      parsed.lessons = parsed.lessons.map((lesson, idx) => ({
        ...lesson,
        id: lesson.id || `lesson-${idx + 1}`
      }));

      return parsed;
    } catch (error) {
      console.error('Error in GeminiService.generateCourseContent:', error);
      throw new Error(`Failed to generate course content: ${error.message}`);
    }
  }
}
