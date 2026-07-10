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
