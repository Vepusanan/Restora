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
  InventoryVisibilityFilter,
  InventorySortKey,
  InventoryFilters,
  IngredientGroup,
} from './inventory';

export type {
  AuditAction,
  AuditActionType,
  AuditModule,
  AuditActor,
  AuditTarget,
  AuditLogEntry,
  WriteAuditInput,
  AuditSortOrder,
  AuditFilters,
} from './audit';

export type {
  AppNotification,
  NotificationHistoryEntry,
  ExpiryEvaluationFields,
  NotificationType,
  NotificationPriority,
  DevicePlatform,
  DeviceToken,
  NotificationTypeFilter,
  NotificationInboxFilters,
  RegisterDeviceTokenInput,
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
  UsageCategory,
  InventoryUsageLog,
  CreateUsageInput,
  FifoAllocation,
  UsageVisibilityFilter,
  UsageFilters,
  UsageSummary,
  ConsumptionTrendPoint,
  TopConsumedIngredient,
  ConsumptionByCategoryRow,
  InventoryTurnoverRow,
  ConsumptionCostResult,
} from './consumption';

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

export type {
  AiChatRole,
  AiChatMessage,
  AiHistoryItem,
  AiAskResponse,
} from './ai';

export type {
  AiInsightSeverity,
  AiInsightCategory,
  AiInsightItem,
  AiRecommendationItem,
  AiAnalyticsReport,
} from './aiAnalytics';

export { AI_HISTORY_LIMIT, AI_REQUEST_TIMEOUT_MS } from './ai';
export { AI_ANALYTICS_TIMEOUT_MS } from './aiAnalytics';

export type {
  RestaurantCurrency,
  NotificationPreferences,
  UpdateProfileInput,
  UpdateRestaurantSettingsInput,
  UpdateNotificationPreferencesInput,
} from './settings';

export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
} from './settings';

export type AiGenerateRequest = {
  prompt: string;
};

export type AiGenerateResponse = {
  text: string;
  model: string;
};
