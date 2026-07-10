import { GoogleGenerativeAI } from '@google/generative-ai';
import { serverEnv } from '../config';
import type { RestaurantAiContext } from '../types';

const SYSTEM_PROMPT = `You are Restora AI Assistant for a restaurant inventory and waste system.
Rules:
1. Answer ONLY using the provided restaurantContext JSON. Never invent numbers.
2. You are READ-ONLY. Never suggest you changed inventory, waste, or cost records.
3. If context is missing data, say you do not have enough information.
4. If role is staff, never reveal costs, unit prices, monetary loss, or valuations.
5. Be concise and practical for kitchen/ops staff.
6. Prefer short bullet points when listing items.
7. Dates are ISO (YYYY-MM-DD). Currency display as plain numbers with $ if financial data is present.`;

const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
];

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('too many requests')
  );
}

export async function askGemini(input: {
  query: string;
  context: RestaurantAiContext;
}): Promise<{ text: string; model: string }> {
  const genAI = new GoogleGenerativeAI(serverEnv.geminiApiKey);
  const payload = {
    userQuery: input.query,
    role: input.context.role,
    restaurantContext: input.context,
  };
  const prompt = `Answer this restaurant operations question using only the JSON context.\n\n${JSON.stringify(payload)}`;

  const models = [
    serverEnv.geminiModel,
    ...FALLBACK_MODELS.filter((name) => name !== serverEnv.geminiModel),
  ];

  let lastError: unknown;

  for (const modelName of models) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), serverEnv.requestTimeoutMs);
    });

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const text = result.response.text()?.trim();
      if (!text) {
        throw new Error('Empty Gemini response');
      }
      return { text, model: modelName };
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message === 'timeout') {
        throw error;
      }
      // Try next model on quota/not-found; otherwise stop.
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      const retryable =
        isQuotaError(error) || message.includes('404') || message.includes('not found');
      if (!retryable) throw error;
      console.warn(`Gemini model failed, trying fallback: ${modelName}`, message.slice(0, 160));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini request failed');
}
