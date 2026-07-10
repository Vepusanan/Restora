import { GoogleGenerativeAI } from '@google/generative-ai';
import { serverEnv } from '../config';
import type {
  AiAnalyticsContext,
  AiAnalyticsResult,
  AiInsightCategory,
  AiInsightItem,
  AiInsightSeverity,
  AiRecommendationItem,
} from '../types';

const ANALYTICS_SYSTEM_PROMPT = `You are Restora AI Analytics for restaurant operations.
You analyze ONLY the provided analyticsContext JSON and return STRICT JSON.

Rules:
1. Never invent numbers, ingredients, or percentages not present in analyticsContext.
2. Never claim you changed inventory, waste, or cost records — you are read-only.
3. If data is sparse, say so clearly in summary and keep insights few.
4. Prioritize business impact: Critical > High > Medium > Low.
5. Categories must be one of: Inventory, Waste, Cost, Expiry, Operations.
6. Severity must be one of: Critical, High, Medium, Low.
7. Recommendations must be actionable for a restaurant admin.
8. Prefer 3–7 insights and 2–5 recommendations.
9. Currency is in analyticsContext.currency — reference it when discussing money.
10. Output MUST be valid JSON matching the schema. No markdown fences.`;

const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
];

const SEVERITIES: AiInsightSeverity[] = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES: AiInsightCategory[] = [
  'Inventory',
  'Waste',
  'Cost',
  'Expiry',
  'Operations',
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

function asSeverity(value: unknown): AiInsightSeverity {
  const text = String(value || '');
  return SEVERITIES.includes(text as AiInsightSeverity)
    ? (text as AiInsightSeverity)
    : 'Medium';
}

function asCategory(value: unknown): AiInsightCategory {
  const text = String(value || '');
  return CATEGORIES.includes(text as AiInsightCategory)
    ? (text as AiInsightCategory)
    : 'Operations';
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() || trimmed;
}

/** Validate and normalize Gemini JSON into AiAnalyticsResult fields. */
export function parseAiAnalyticsResponse(raw: string): {
  summary: string;
  insights: AiInsightItem[];
  recommendations: AiRecommendationItem[];
} {
  const parsed = JSON.parse(stripFences(raw)) as Record<string, unknown>;
  const summary = String(parsed.summary || '').trim();
  if (!summary) {
    throw new Error('AI analytics response missing summary');
  }

  const insightsRaw = Array.isArray(parsed.insights) ? parsed.insights : [];
  const insights: AiInsightItem[] = insightsRaw
    .map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      return {
        category: asCategory(row.category),
        severity: asSeverity(row.severity),
        title: String(row.title || '').trim(),
        description: String(row.description || '').trim(),
        impact: String(row.impact || '').trim(),
        recommendation: String(row.recommendation || '').trim(),
      };
    })
    .filter((item) => item.title && item.description)
    .slice(0, 10);

  const recsRaw = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  const recommendations: AiRecommendationItem[] = recsRaw
    .map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      return {
        action: String(row.action || '').trim(),
        reason: String(row.reason || '').trim(),
        priority: asSeverity(row.priority),
      };
    })
    .filter((item) => item.action && item.reason)
    .slice(0, 8);

  return { summary, insights, recommendations };
}

export async function generateAiAnalytics(input: {
  context: AiAnalyticsContext;
  timeoutMs?: number;
}): Promise<Omit<AiAnalyticsResult, 'restaurantId'>> {
  const genAI = new GoogleGenerativeAI(serverEnv.geminiApiKey);
  const timeoutMs = input.timeoutMs ?? serverEnv.requestTimeoutMs;
  const userPrompt = `Analyze this restaurant analyticsContext and return JSON with keys:
summary (string),
insights (array of {category, severity, title, description, impact, recommendation}),
recommendations (array of {action, reason, priority}).

analyticsContext:
${JSON.stringify(input.context)}`;

  const models = [
    serverEnv.geminiModel,
    ...FALLBACK_MODELS.filter((name) => name !== serverEnv.geminiModel),
  ];

  let lastError: unknown;

  for (const modelName of models) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: ANALYTICS_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await Promise.race([
        model.generateContent(userPrompt),
        timeoutPromise,
      ]);
      const text = result.response.text()?.trim();
      if (!text) throw new Error('Empty Gemini analytics response');

      const parsed = parseAiAnalyticsResponse(text);
      return {
        ...parsed,
        model: modelName,
        generatedAt: new Date().toISOString(),
        dataRange: input.context.range,
      };
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message === 'timeout') throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      const retryable =
        isQuotaError(error) ||
        message.includes('404') ||
        message.includes('not found') ||
        message.includes('json') ||
        message.includes('mime');
      if (!retryable) throw error;
      console.warn(
        `Gemini analytics model failed, trying fallback: ${modelName}`,
        message.slice(0, 160),
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini analytics failed');
}
