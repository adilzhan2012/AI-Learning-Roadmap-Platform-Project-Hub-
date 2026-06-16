import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('Google Generative AI (Gemini) SDK initialized successfully.');
} else {
  console.warn('WARNING: GEMINI_API_KEY is missing in your environment config (.env). AI course generation will be disabled.');
}

export { genAI };
