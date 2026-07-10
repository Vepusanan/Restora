export type AggregationPeriod = 'day' | 'week' | 'month';

export type WasteTrendPoint = {
  key: string;
  label: string;
  totalLoss: number;
};

export type TopWastedIngredient = {
  rank: number;
  ingredientName: string;
  ingredientKey: string;
  totalLoss: number;
  percentage: number;
  eventCount: number;
};

export type IngredientCostShare = {
  ingredientName: string;
  ingredientKey: string;
  totalCost: number;
  percentage: number;
  batchCount: number;
  totalQuantity: number;
  unit: string;
};

export type AnalyticsExportFormat = 'csv' | 'pdf';

export type AnalyticsDashboardSnapshot = {
  restaurantName: string;
  range: { startDate: string; endDate: string };
  period: AggregationPeriod;
  generatedAt: string;
  inventoryValue: number;
  totalWasteCost: number;
  totalConsumptionCost: number;
  totalIngredientCost: number;
  wasteTrends: WasteTrendPoint[];
  consumptionTrends: import('./consumption').ConsumptionTrendPoint[];
  topWasted: TopWastedIngredient[];
  topConsumed: import('./consumption').TopConsumedIngredient[];
  consumptionByCategory: import('./consumption').ConsumptionByCategoryRow[];
  inventoryTurnover: import('./consumption').InventoryTurnoverRow[];
  ingredientBreakdown: IngredientCostShare[];
};
