import {
  buildExpiryNotificationCopy,
  clampExpiryThreshold,
  getExpiryTone,
  isExpiryTransition,
  shouldSuppressDuplicate,
} from '../src/utils/expiry';

describe('FR-021 expiry transitions', () => {
  it('notifies on green→amber, amber→red, and green→red', () => {
    expect(isExpiryTransition('green', 'amber')).toBe(true);
    expect(isExpiryTransition('amber', 'red')).toBe(true);
    expect(isExpiryTransition('green', 'red')).toBe(true);
    expect(isExpiryTransition(null, 'amber')).toBe(true);
  });

  it('does not notify on same-status or recovery transitions', () => {
    expect(isExpiryTransition('amber', 'amber')).toBe(false);
    expect(isExpiryTransition('red', 'red')).toBe(false);
    expect(isExpiryTransition('amber', 'green')).toBe(false);
    expect(isExpiryTransition('red', 'amber')).toBe(false);
  });
});

describe('FR-023 notification content', () => {
  it('builds amber and red copy with ingredient and quantity', () => {
    const amber = buildExpiryNotificationCopy({
      ingredientName: 'Tomatoes',
      quantity: 20,
      unit: 'kg',
      daysRemaining: 2,
      status: 'amber',
    });
    expect(amber.title).toBe('Inventory Expiry Alert');
    expect(amber.body).toBe('Tomatoes (20kg) will expire in 2 days.');

    const red = buildExpiryNotificationCopy({
      ingredientName: 'Milk',
      quantity: 1,
      unit: 'L',
      daysRemaining: -1,
      status: 'red',
    });
    expect(red.body).toBe('Milk (1L) expired 1 day ago.');
  });
});

describe('FR-024 duplicate suppression', () => {
  const now = new Date('2026-07-10T12:00:00.000Z');

  it('suppresses same batch+status within 24 hours', () => {
    expect(
      shouldSuppressDuplicate({
        lastNotifiedTone: 'amber',
        lastNotifiedAt: new Date('2026-07-10T10:00:00.000Z'),
        nextTone: 'amber',
        now,
      }),
    ).toBe(true);
  });

  it('allows amber→red even inside the window', () => {
    expect(
      shouldSuppressDuplicate({
        lastNotifiedTone: 'amber',
        lastNotifiedAt: new Date('2026-07-10T10:00:00.000Z'),
        nextTone: 'red',
        now,
      }),
    ).toBe(false);
  });

  it('allows same status after 24 hours', () => {
    expect(
      shouldSuppressDuplicate({
        lastNotifiedTone: 'amber',
        lastNotifiedAt: new Date('2026-07-09T11:00:00.000Z'),
        nextTone: 'amber',
        now,
      }),
    ).toBe(false);
  });
});

describe('FR-025 threshold configuration', () => {
  it('clamps threshold to 1–30', () => {
    expect(clampExpiryThreshold(0)).toBe(1);
    expect(clampExpiryThreshold(99)).toBe(30);
    expect(clampExpiryThreshold(5.8)).toBe(5);
  });

  it('recalculates tones when threshold changes', () => {
    const now = new Date(2026, 6, 10);
    // Jul 13 = 3 days left → amber at threshold 3, green at threshold 2
    expect(getExpiryTone('2026-07-13', now, 3)).toBe('amber');
    expect(getExpiryTone('2026-07-13', now, 2)).toBe('green');
  });
});
