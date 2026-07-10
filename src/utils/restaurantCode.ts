import {
  RESTAURANT_CODE_LENGTH,
  RESTAURANT_CODE_PREFIX,
} from '@constants/auth';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRestaurantCode(): string {
  let body = '';
  for (let i = 0; i < RESTAURANT_CODE_LENGTH; i += 1) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${RESTAURANT_CODE_PREFIX}-${body}`;
}

export function normalizeRestaurantCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidRestaurantCodeFormat(code: string): boolean {
  const normalized = normalizeRestaurantCode(code);
  const pattern = new RegExp(
    `^${RESTAURANT_CODE_PREFIX}-[A-Z0-9]{${RESTAURANT_CODE_LENGTH}}$`,
  );
  return pattern.test(normalized);
}
