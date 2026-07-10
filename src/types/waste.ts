export type WasteReason = 'Expired' | 'Burnt' | 'Prep Waste' | 'Leftovers';

export type WasteLog = {
  id: string;
  restaurantId: string;
  batchId: string;
  ingredientName: string;
  ingredientKey: string;
  quantityWasted: number;
  unit: string;
  wasteReason: WasteReason;
  unitCost: number;
  costLoss: number;
  loggedBy: string;
  loggedByName: string;
  timestamp: string;
  voided: boolean;
  voidedAt: string | null;
  voidedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWasteInput = {
  batchId: string;
  quantityWasted: number;
  wasteReason: WasteReason;
};

export type WasteVisibilityFilter = 'active' | 'voided' | 'all';

export type WasteFilters = {
  search: string;
  wasteReason: WasteReason | null;
  loggedBy: string | null;
  batchId: string | null;
  visibility: WasteVisibilityFilter;
  dateFrom: string | null;
  dateTo: string | null;
};

export type WasteSummary = {
  totalEvents: number;
  activeEvents: number;
  voidedEvents: number;
  totalCostLoss: number;
  quantityWasted: number;
};
