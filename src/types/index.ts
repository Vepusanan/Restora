export type {
  AuthUser,
  UserProfile,
  UserRole,
  UserStatus,
  Restaurant,
  StaffMember,
  AsyncStatus,
  ServiceError,
  AvatarOption,
} from './auth';

export type {
  InventoryUnit,
  ExpiryTone,
  InventoryBatch,
  CreateBatchInput,
  EditBatchInput,
  AuditAction,
  AuditLogEntry,
  InventoryVisibilityFilter,
  InventorySortKey,
  InventoryFilters,
  IngredientGroup,
} from './inventory';

export type {
  AppNotification,
  NotificationHistoryEntry,
  ExpiryEvaluationFields,
} from './notifications';

export type {
  WasteReason,
  WasteLog,
  CreateWasteInput,
  WasteVisibilityFilter,
  WasteFilters,
  WasteSummary,
} from './waste';

export type {
  IngredientCostRow,
  WasteLossRow,
  InventoryValuationResult,
  IngredientCostResult,
  WasteLossResult,
  FinancialDateRange,
} from './financial';

export type {
  AggregationPeriod,
  WasteTrendPoint,
  TopWastedIngredient,
  IngredientCostShare,
  AnalyticsExportFormat,
  AnalyticsDashboardSnapshot,
} from './analytics';

export type AiGenerateRequest = {
  prompt: string;
};

export type AiGenerateResponse = {
  text: string;
  model: string;
};
