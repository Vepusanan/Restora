import { GoogleGenerativeAI } from '@google/generative-ai';

import { env } from '@/src/config/env';

let client: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!env.gemini.apiKey) {
    throw new Error(
      'Gemini API key is missing. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.',
    );
  }

  if (!client) {
    client = new GoogleGenerativeAI(env.gemini.apiKey);
  }

  return client;
}

export async function generateGeminiResponse(prompt: string, context?: string) {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const fullPrompt = context
    ? `Context:\n${context}\n\nUser question:\n${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

export async function generateRestoraInsight(userQuery: string, appContext: string) {
  const systemContext = [
    'You are Restora, a supportive recovery and wellness assistant.',
    'Give concise, practical, and empathetic responses.',
    appContext,
  ].join('\n');

  return generateGeminiResponse(userQuery, systemContext);
}

export function isGeminiConfigured() {
  return Boolean(env.gemini.apiKey);
}
