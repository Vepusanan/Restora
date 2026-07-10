import type { UserRole } from '@/types';

export function canAccessModule(
  role: UserRole | null | undefined,
  module: 'inventory' | 'waste' | 'cost' | 'analytics' | 'staff' | 'financial',
): boolean {
  if (!role) return false;
  if (role === 'admin') return true;

  // Staff operational modules only (FR-008)
  return module === 'inventory' || module === 'waste';
}
