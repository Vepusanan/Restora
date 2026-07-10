import type { FirebaseError } from 'firebase/app';
import type { ServiceError } from '@/types';

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account already exists with that email.',
  'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/expired-action-code': 'This reset link has expired. Request a new one.',
  'auth/invalid-action-code': 'This reset link is invalid or has already been used.',
  'permission-denied': 'You do not have permission to perform this action.',
  'functions/unauthenticated': 'Please sign in and try again.',
  'functions/permission-denied': 'You do not have permission to perform this action.',
  'functions/not-found': 'Restaurant code not found.',
  'functions/already-exists': 'An account already exists with that email.',
  'functions/invalid-argument': 'Invalid request. Check your details and try again.',
  'functions/resource-exhausted': 'Too many requests. Please wait and try again.',
  'functions/failed-precondition': 'Unable to complete this action right now.',
  'restora/invalid-restaurant-code': 'Invalid restaurant code. Check with your admin.',
  'restora/restaurant-not-found': 'No restaurant found for that code.',
  'restora/account-pending': 'Your account is waiting for admin approval.',
  'restora/account-rejected': 'Your registration was rejected by the admin.',
  'restora/account-deactivated': 'Your account has been deactivated.',
  'restora/invalid-waste-quantity': 'Waste quantity exceeds remaining batch quantity.',
  'restora/batch-not-active': 'This batch is not available for waste logging.',
  'restora/already-voided': 'This waste entry has already been voided.',
  'restora/waste-not-found': 'Waste entry not found.',
};

export function toServiceError(error: unknown, fallback = 'Something went wrong'): ServiceError {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const firebaseError = error as FirebaseError & { details?: unknown };
    const code = String(firebaseError.code ?? 'unknown');
    const mapped = AUTH_MESSAGES[code];
    return {
      code,
      message: mapped ?? firebaseError.message ?? fallback,
    };
  }

  if (error instanceof Error) {
    return { code: 'unknown', message: error.message || fallback };
  }

  return { code: 'unknown', message: fallback };
}

export function createServiceError(code: string, message?: string): ServiceError {
  return {
    code,
    message: message ?? AUTH_MESSAGES[code] ?? 'Something went wrong',
  };
}
