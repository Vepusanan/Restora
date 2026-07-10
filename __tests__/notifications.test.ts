import {
  buildDeviceTokenDocId,
  countUnreadNotifications,
  filterInboxNotifications,
  isNotificationUnread,
  isWithinNotificationRetention,
  notificationRetentionCutoff,
  resolveNotificationType,
} from '../src/utils/notifications';
import type { AppNotification } from '../src/types';

function makeNotification(
  overrides: Partial<AppNotification> & Pick<AppNotification, 'id'>,
): AppNotification {
  return {
    restaurantId: 'r1',
    userId: 'u1',
    batchId: 'b1',
    ingredientName: 'Milk',
    quantity: 2,
    unit: 'L',
    dateReceived: '2026-07-01',
    expiryDate: '2026-07-10',
    daysRemaining: 0,
    status: 'red',
    type: 'expiry',
    priority: 'high',
    title: 'Expired',
    body: 'Milk expired',
    read: false,
    readBy: [],
    deepLink: 'restora://inventory',
    createdBy: 'system',
    metadata: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Module 3.8 — notifications utilities', () => {
  describe('FR-048 device token ids', () => {
    it('builds deterministic ids to prevent duplicate device docs', () => {
      const a = buildDeviceTokenDocId('user-1', 'dev_abc');
      const b = buildDeviceTokenDocId('user-1', 'dev_abc');
      const c = buildDeviceTokenDocId('user-1', 'dev_xyz');
      expect(a).toBe(b);
      expect(a).not.toBe(c);
      expect(a).toContain('user-1');
    });
  });

  describe('FR-052 inbox read / badge / retention', () => {
    it('counts unread using read flag and readBy', () => {
      const items = [
        makeNotification({ id: '1', read: false, readBy: [] }),
        makeNotification({ id: '2', read: true, readBy: ['u1'] }),
        makeNotification({ id: '3', read: false, readBy: ['u2'] }),
      ];
      expect(countUnreadNotifications(items, 'u1')).toBe(2);
      expect(isNotificationUnread(items[2]!, 'u2')).toBe(false);
    });

    it('filters by type, unread, and 30-day retention', () => {
      const old = new Date();
      old.setDate(old.getDate() - 40);
      const items = [
        makeNotification({ id: '1', type: 'expiry', createdAt: new Date().toISOString() }),
        makeNotification({
          id: '2',
          type: 'staff',
          read: true,
          readBy: ['u1'],
          createdAt: new Date().toISOString(),
        }),
        makeNotification({ id: '3', type: 'expiry', createdAt: old.toISOString() }),
      ];

      const filtered = filterInboxNotifications(
        items,
        { type: 'expiry', unreadOnly: true },
        'u1',
      );
      expect(filtered.map((i) => i.id)).toEqual(['1']);
      expect(isWithinNotificationRetention(items[0]!.createdAt)).toBe(true);
      expect(isWithinNotificationRetention(items[2]!.createdAt)).toBe(false);
    });

    it('retention cutoff is 30 days', () => {
      const now = new Date('2026-07-10T12:00:00.000Z');
      const cutoff = notificationRetentionCutoff(now);
      const diffDays = Math.round(
        (now.getTime() - cutoff.getTime()) / (24 * 60 * 60 * 1000),
      );
      expect(diffDays).toBeGreaterThanOrEqual(30);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it('resolves notification types with expiry fallback', () => {
      expect(resolveNotificationType('staff')).toBe('staff');
      expect(resolveNotificationType(undefined, 'amber')).toBe('expiry');
      expect(resolveNotificationType('unknown')).toBe('system');
    });
  });
});
