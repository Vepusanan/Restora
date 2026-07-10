export type UserRole = 'admin' | 'staff';

export type AuthUser = {
  uid: string;
  email?: string;
};

export type UserProfile = {
  uid: string;
  role: UserRole;
  status: string;
  restaurantId: string;
  restaurantName: string;
  displayName: string;
};

export type InventoryContextItem = {
  ingredientName: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: 'active' | 'consumed' | 'archived' | 'expired';
  unitCost?: number;
};

export type WasteContextItem = {
  ingredientName: string;
  quantityWasted: number;
  unit: string;
  wasteReason: string;
  date: string;
  costLoss?: number;
};

export type FinancialContext = {
  inventoryValue: number;
  wasteLossTotal: number;
  ingredientCostMtd?: number;
};

export type RestaurantAiContext = {
  restaurantId: string;
  restaurantName: string;
  role: UserRole;
  asOf: string;
  inventory: InventoryContextItem[];
  waste: WasteContextItem[];
  financial: FinancialContext | null;
  notes: string[];
};

/** Compact analytics payload for Gemini (admin AI insights). */
export type AiAnalyticsContext = {
  restaurantId: string;
  restaurantName: string;
  currency: string;
  amberThresholdDays: number;
  asOf: string;
  range: { startDate: string; endDate: string };
  inventory: {
    valuation: number;
    activeBatchCount: number;
    expiredBatchCount: number;
    amberBatchCount: number;
    greenBatchCount: number;
    expiringSoon: Array<{
      ingredientName: string;
      quantity: number;
      unit: string;
      expiryDate: string;
      daysUntilExpiry: number;
      unitCost: number;
    }>;
    lowStock: Array<{
      ingredientName: string;
      quantity: number;
      unit: string;
    }>;
    highValueItems: Array<{
      ingredientName: string;
      quantity: number;
      unit: string;
      lineValue: number;
    }>;
  };
  waste: {
    totalLossInRange: number;
    eventCountInRange: number;
    byReason: Array<{ reason: string; totalLoss: number; eventCount: number }>;
    topIngredients: Array<{
      ingredientName: string;
      totalLoss: number;
      eventCount: number;
      percentage: number;
    }>;
    dailyTrend: Array<{ date: string; totalLoss: number }>;
  };
  cost: {
    inventoryValue: number;
    ingredientSpendInRange: number;
    wasteLossRatioPercent: number | null;
  };
  notes: string[];
};

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

export type AiAnalyticsResult = {
  summary: string;
  insights: AiInsightItem[];
  recommendations: AiRecommendationItem[];
  model: string;
  generatedAt: string;
  dataRange: { startDate: string; endDate: string };
  restaurantId: string;
};
