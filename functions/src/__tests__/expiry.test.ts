import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getExpiryTone,
  isExpiryTransition,
  shouldSuppressDuplicate,
  buildExpiryNotificationCopy,
  clampExpiryThreshold,
} from '../utils/expiry';

test('getExpiryTone respects configurable amber threshold', () => {
  const now = new Date(2026, 6, 10);
  assert.equal(getExpiryTone('2026-07-15', now, 3), 'green');
  assert.equal(getExpiryTone('2026-07-13', now, 3), 'amber');
  assert.equal(getExpiryTone('2026-07-15', now, 7), 'amber');
  assert.equal(getExpiryTone('2026-07-09', now, 3), 'red');
});

test('isExpiryTransition detects green→amber and amber→red', () => {
  assert.equal(isExpiryTransition('green', 'amber'), true);
  assert.equal(isExpiryTransition('amber', 'red'), true);
  assert.equal(isExpiryTransition('green', 'red'), true);
  assert.equal(isExpiryTransition('amber', 'amber'), false);
  assert.equal(isExpiryTransition('red', 'red'), false);
  assert.equal(isExpiryTransition(null, 'amber'), true);
});

test('shouldSuppressDuplicate blocks same status within 24h', () => {
  const now = new Date('2026-07-10T12:00:00Z');
  assert.equal(
    shouldSuppressDuplicate({
      lastNotifiedTone: 'amber',
      lastNotifiedAt: new Date('2026-07-10T10:00:00Z'),
      nextTone: 'amber',
      now,
    }),
    true,
  );
  assert.equal(
    shouldSuppressDuplicate({
      lastNotifiedTone: 'amber',
      lastNotifiedAt: new Date('2026-07-09T10:00:00Z'),
      nextTone: 'amber',
      now,
    }),
    false,
  );
  assert.equal(
    shouldSuppressDuplicate({
      lastNotifiedTone: 'amber',
      lastNotifiedAt: new Date('2026-07-10T10:00:00Z'),
      nextTone: 'red',
      now,
    }),
    false,
  );
});

test('notification copy includes ingredient and timing', () => {
  const amber = buildExpiryNotificationCopy({
    ingredientName: 'Tomatoes',
    quantity: 20,
    unit: 'kg',
    daysRemaining: 2,
    status: 'amber',
  });
  assert.match(amber.body, /Tomatoes \(20kg\) will expire in 2 days/);

  const red = buildExpiryNotificationCopy({
    ingredientName: 'Milk',
    quantity: 5,
    unit: 'L',
    daysRemaining: -1,
    status: 'red',
  });
  assert.match(red.body, /Milk \(5L\) expired 1 day ago/);
});

test('clampExpiryThreshold bounds values', () => {
  assert.equal(clampExpiryThreshold(0), 1);
  assert.equal(clampExpiryThreshold(99), 30);
  assert.equal(clampExpiryThreshold(5.9), 5);
});
