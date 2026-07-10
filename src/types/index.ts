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

export type AiGenerateRequest = {
  prompt: string;
};

export type AiGenerateResponse = {
  text: string;
  model: string;
};
