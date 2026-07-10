import {
  generateRestaurantCode,
  isValidRestaurantCodeFormat,
  normalizeRestaurantCode,
} from '../src/utils/restaurantCode';
import {
  adminRegisterSchema,
  loginSchema,
  staffRegisterSchema,
} from '../src/utils/validators';
import { canAccessModule } from '../src/utils/rbac';

describe('restaurant codes', () => {
  it('generates RST-XXXXXX codes', () => {
    const code = generateRestaurantCode();
    expect(isValidRestaurantCodeFormat(code)).toBe(true);
  });

  it('normalizes codes', () => {
    expect(normalizeRestaurantCode(' rst-abc123 ')).toBe('RST-ABC123');
  });
});

describe('auth validators', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'chef@restora.app',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('requires 8+ character passwords for admin registration', () => {
    const result = adminRegisterSchema.safeParse({
      restaurantName: 'Spice Garden',
      displayName: 'Alex',
      email: 'alex@restora.app',
      password: 'short',
      confirmPassword: 'short',
      avatarId: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid restaurant codes for staff registration', () => {
    const result = staffRegisterSchema.safeParse({
      restaurantCode: 'BAD',
      displayName: 'Sam',
      email: 'sam@restora.app',
      password: 'password12',
      confirmPassword: 'password12',
      avatarId: null,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid staff registration payload', () => {
    const result = staffRegisterSchema.safeParse({
      restaurantCode: 'RST-ABC123',
      displayName: 'Sam',
      email: 'sam@restora.app',
      password: 'password12',
      confirmPassword: 'password12',
      avatarId: 'chef',
    });
    expect(result.success).toBe(true);
  });
});

describe('RBAC helpers', () => {
  it('allows staff inventory but denies cost/analytics', () => {
    expect(canAccessModule('staff', 'inventory')).toBe(true);
    expect(canAccessModule('staff', 'waste')).toBe(true);
    expect(canAccessModule('staff', 'cost')).toBe(false);
    expect(canAccessModule('staff', 'analytics')).toBe(false);
    expect(canAccessModule('staff', 'financial')).toBe(false);
  });

  it('allows admin full module access', () => {
    expect(canAccessModule('admin', 'cost')).toBe(true);
    expect(canAccessModule('admin', 'analytics')).toBe(true);
    expect(canAccessModule('admin', 'staff')).toBe(true);
  });
});
