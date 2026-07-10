export type IngredientCostRow = {
  ingredientName: string;
  ingredientKey: string;
  batchCount: number;
  totalQuantity: number;
  totalCost: number;
  unit: string;
};

export type WasteLossRow = {
  key: string;
  label: string;
  eventCount: number;
  totalLoss: number;
};

export type InventoryValuationResult = {
  totalValue: number;
  batchCount: number;
  excludedExpired: number;
  excludedConsumed: number;
  excludedArchived: number;
  calculatedAt: string;
};

export type IngredientCostResult = {
  totalCost: number;
  rows: IngredientCostRow[];
  batchCount: number;
};

export type WasteLossResult = {
  totalLoss: number;
  rows: WasteLossRow[];
  eventCount: number;
};

export type FinancialDateRange = {
  startDate: string;
  endDate: string;
};
