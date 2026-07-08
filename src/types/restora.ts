export type ChartDataPoint = {
  label: string;
  value: number;
};

export type GeminiMessage = {
  role: 'user' | 'model';
  content: string;
};

export type UserRole = 'admin' | 'staff';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ExpiryStatus = 'safe' | 'expiring' | 'expired';

export type InventoryBatch = {
  id: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  receivedDate: string;
  expiryDate: string;
  expiryStatus: ExpiryStatus;
  isFifo: boolean;
};

export type IngredientGroup = {
  id: string;
  name: string;
  category: string;
  unit: string;
  totalQuantity: number;
  batches: InventoryBatch[];
};

export type WasteLogEntry = {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  reason: string;
  costLoss: number;
  loggedBy: string;
  loggedAt: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: ApprovalStatus;
  joinedAt: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: 'expiry' | 'waste' | 'staff' | 'system';
  read: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type DashboardStats = {
  totalInventoryValue: number;
  wasteThisWeek: number;
  expiringItems: number;
  activeStaff: number;
  lowStockItems: number;
};

export type AnalyticsSummary = {
  wasteTrend: { label: string; value: number }[];
  costByCategory: { label: string; value: number }[];
  topWasted: { label: string; value: number }[];
};

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  restaurantId: string;
  restaurantName: string;
  restaurantCode: string;
};
