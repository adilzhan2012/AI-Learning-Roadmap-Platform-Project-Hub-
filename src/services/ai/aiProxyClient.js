import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase.js';

/**
 * Modular client wrapper for Cloud Function aiProxy.
 */
export async function callAiProxy({
  prompt,
  messages,
  systemInstruction,
  usageType = 'ai_question',
  modelName,
  responseSchema,
  responseFormat,
  generationConfig
}) {
  try {
    const aiProxy = httpsCallable(functions, 'aiProxy');
    const payload = {
      usageType
    };

    if (messages && Array.isArray(messages) && messages.length > 0) {
      payload.messages = messages;
    } else if (prompt) {
      payload.prompt = prompt;
    }

    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }

    if (modelName) {
      payload.modelName = modelName;
    }

    if (responseSchema) {
      payload.responseSchema = responseSchema;
    }

    if (responseFormat) {
      payload.responseFormat = responseFormat;
    }

    if (generationConfig) {
      payload.generationConfig = generationConfig;
    }

    const response = await aiProxy(payload);

    if (!response || !response.data || response.data.result === undefined) {
      throw new Error('Empty or invalid response from AI Proxy');
    }

    if (response.data.usageType && typeof response.data.updatedUsageCount === 'number') {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('planUsage:updated', {
          detail: {
            usageType: response.data.usageType,
            updatedUsageCount: response.data.updatedUsageCount
          }
        }));
      }
    }

    return response.data.result;
  } catch (error) {
    console.error("AI Proxy Client Error:", error);
    if (error.code === 'resource-exhausted') {
      throw new Error('API_OVERLOADED');
    }
    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to use AI features.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('Server API key configuration is missing or invalid.');
    }
    throw new Error(error.message || 'AI proxy call failed');
  }
}
