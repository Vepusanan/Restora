import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '@constants/auth';
import { isValidRestaurantCodeFormat, normalizeRestaurantCode } from '@utils/restaurantCode';

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

const emailSchema = z.string().trim().email('Enter a valid email');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const adminRegisterSchema = z
  .object({
    restaurantName: z.string().trim().min(2, 'Restaurant name is required'),
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    avatarId: z.string().nullable().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const staffRegisterSchema = z
  .object({
    restaurantCode: z
      .string()
      .trim()
      .min(1, 'Restaurant code is required')
      .transform(normalizeRestaurantCode)
      .refine(isValidRestaurantCodeFormat, 'Enter a valid restaurant code (e.g. RST-ABC123)'),
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    avatarId: z.string().nullable().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** @deprecated Use adminRegisterSchema or staffRegisterSchema */
export const registerSchema = adminRegisterSchema;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use date format YYYY-MM-DD');

export const createBatchSchema = z
  .object({
    ingredientName: z.string().trim().min(1, 'Ingredient name is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit: z.enum(['kg', 'g', 'L', 'ml', 'pcs', 'box', 'pack', 'dozen']),
    unitCost: z.number().min(0, 'Unit cost cannot be negative'),
    supplier: z.string().trim().min(1, 'Supplier is required'),
    dateReceived: dateOnlySchema,
    expiryDate: dateOnlySchema,
  })
  .refine((data) => data.expiryDate >= data.dateReceived, {
    message: 'Expiry date cannot be before date received',
    path: ['expiryDate'],
  });

export const editBatchSchema = z
  .object({
    supplier: z.string().trim().min(1, 'Supplier is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    dateReceived: dateOnlySchema,
    expiryDate: dateOnlySchema,
  })
  .refine((data) => data.expiryDate >= data.dateReceived, {
    message: 'Expiry date cannot be before date received',
    path: ['expiryDate'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;
export type StaffRegisterFormValues = z.infer<typeof staffRegisterSchema>;
export type RegisterFormValues = AdminRegisterFormValues;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type CreateBatchFormValues = z.infer<typeof createBatchSchema>;
export type EditBatchFormValues = z.infer<typeof editBatchSchema>;
