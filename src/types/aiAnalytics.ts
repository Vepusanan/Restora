export type AiInsightSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type AiInsightCategory =
  | 'Inventory'
  | 'Waste'
  | 'Cost'
  | 'Expiry'
  | 'Operations';

export type AiInsightItem = {
  category: AiInsightCategory;
  severity: AiInsightSeverity;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
};

export type AiRecommendationItem = {
  action: string;
  reason: string;
  priority: AiInsightSeverity;
};

export type AiAnalyticsReport = {
  restaurantId: string;
  summary: string;
  insights: AiInsightItem[];
  recommendations: AiRecommendationItem[];
  model: string;
  generatedAt: string;
  dataRange: { startDate: string; endDate: string };
  createdBy?: string;
  expiresAt?: string;
};

export const AI_ANALYTICS_TIMEOUT_MS = 45_000;
