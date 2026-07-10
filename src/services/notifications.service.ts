import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { mapAppNotification, mapNotificationHistory } from '@utils/mappers';
import { toServiceError } from '@utils/errors';
import type { AppNotification, NotificationHistoryEntry } from '@/types';

export const notificationService = {
  subscribeForUser(
    userId: string,
    callback: (items: AppNotification[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.notifications),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((item) => mapAppNotification(item.id, item.data())));
      },
      (error) => {
        console.error('Notification listener error', error);
        callback([]);
      },
    );
  },

  subscribeHistory(
    restaurantId: string,
    callback: (items: NotificationHistoryEntry[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(getDb(), COLLECTIONS.notificationHistory),
      where('restaurantId', '==', restaurantId),
      orderBy('triggeredAt', 'desc'),
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

  async markRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(getDb(), COLLECTIONS.notifications, notificationId), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw toServiceError(error, 'Unable to update notification');
    }
  },
};
