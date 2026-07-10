import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { NOTIFICATION_PAGE_SIZE } from '@constants/notifications';
import { mapAppNotification, mapNotificationHistory } from '@utils/mappers';
import {
  isNotificationUnread,
  isWithinNotificationRetention,
  notificationRetentionCutoff,
} from '@utils/notifications';
import { toServiceError } from '@utils/errors';
import type { AppNotification, NotificationHistoryEntry } from '@/types';

function withinRetention(items: AppNotification[]): AppNotification[] {
  return items.filter((item) => isWithinNotificationRetention(item.createdAt));
}

async function writeNotificationAudit(input: {
  action: 'notification_read' | 'notification_opened';
  userId: string;
  notificationId: string;
  restaurantId?: string;
}): Promise<void> {
  try {
    await addDoc(collection(getDb(), COLLECTIONS.auditLogs), {
      action: input.action,
      restaurantId: input.restaurantId ?? '',
      batchId: '',
      userId: input.userId,
      notificationId: input.notificationId,
      deviceId: null,
      previousValues: null,
      newValues: { action: input.action },
      timestamp: serverTimestamp(),
    });
  } catch {
    // Audit is best-effort; inbox UX must not fail if rules block the write.
  }
}

/**
 * FR-052 — in-app notification inbox (realtime + pagination helpers).
 * Documents are created only by Cloud Functions / Admin SDK.
 */
export const notificationService = {
  subscribeForUser(
    userId: string,
    callback: (items: AppNotification[]) => void,
  ): Unsubscribe {
    const cutoff = notificationRetentionCutoff();
    const q = query(
      collection(getDb(), COLLECTIONS.notifications),
      where('userId', '==', userId),
      where('createdAt', '>=', cutoff),
      orderBy('createdAt', 'desc'),
      limit(200),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(withinRetention(snap.docs.map((item) => mapAppNotification(item.id, item.data()))));
      },
      (error) => {
        console.error('Notification listener error', error);
        callback([]);
      },
    );
  },

  subscribeUnreadCount(userId: string, callback: (count: number) => void): Unsubscribe {
    return this.subscribeForUser(userId, (items) => {
      callback(items.filter((item) => isNotificationUnread(item, userId)).length);
    });
  },

  subscribeHistory(
    restaurantId: string,
    callback: (items: NotificationHistoryEntry[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.notificationHistory),
      where('restaurantId', '==', restaurantId),
      orderBy('triggeredAt', 'desc'),
      limit(100),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapNotificationHistory(item.id, item.data())));
      },
      (error) => {
        console.error('Notification history listener error', error);
        callback([]);
      },
    );
  },

  async fetchPage(input: {
    userId: string;
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
  }): Promise<{
    items: AppNotification[];
    cursor: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    const pageSize = input.pageSize ?? NOTIFICATION_PAGE_SIZE;
    const cutoff = notificationRetentionCutoff();
    const constraints = [
      where('userId', '==', input.userId),
      where('createdAt', '>=', cutoff),
      orderBy('createdAt', 'desc'),
      ...(input.cursor ? [startAfter(input.cursor)] : []),
      limit(pageSize),
    ];

    try {
      const snap = await getDocs(query(collection(getDb(), COLLECTIONS.notifications), ...constraints));
      const items = withinRetention(
        snap.docs.map((item) => mapAppNotification(item.id, item.data())),
      );
      const nextCursor =
        snap.docs.length > 0 ? (snap.docs[snap.docs.length - 1] ?? null) : null;
      return {
        items,
        cursor: nextCursor,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (error) {
      throw toServiceError(error, 'Unable to load notifications');
    }
  },

  async markRead(notificationId: string, userId: string, restaurantId?: string): Promise<void> {
    try {
      await updateDoc(doc(getDb(), COLLECTIONS.notifications, notificationId), {
        read: true,
        readBy: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
      await writeNotificationAudit({
        action: 'notification_read',
        userId,
        notificationId,
        restaurantId,
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to update notification');
    }
  },

  async markAllRead(userId: string, items: AppNotification[]): Promise<number> {
    const unread = items.filter((item) => isNotificationUnread(item, userId));
    if (unread.length === 0) return 0;

    try {
      const db = getDb();
      let pending = writeBatch(db);
      let ops = 0;
      let total = 0;

      for (const item of unread) {
        pending.update(doc(db, COLLECTIONS.notifications, item.id), {
          read: true,
          readBy: arrayUnion(userId),
          updatedAt: serverTimestamp(),
        });
        ops += 1;
        total += 1;
        if (ops >= 400) {
          await pending.commit();
          pending = writeBatch(db);
          ops = 0;
        }
      }

      if (ops > 0) await pending.commit();
      return total;
    } catch (error) {
      throw toServiceError(error, 'Unable to mark notifications as read');
    }
  },

  async markOpened(
    notificationId: string,
    userId: string,
    restaurantId?: string,
  ): Promise<void> {
    await writeNotificationAudit({
      action: 'notification_opened',
      userId,
      notificationId,
      restaurantId,
    });
  },
};
