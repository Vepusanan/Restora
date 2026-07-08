import { useEffect, useState } from 'react';

import {
  addNotificationReceivedListener,
  registerForPushNotificationsAsync,
} from '@/src/services/notifications.service';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync()
      .then((token) => {
        if (isMounted) {
          setExpoPushToken(token);
        }
      })
      .catch((notificationError) => {
        if (isMounted) {
          setError(
            notificationError instanceof Error
              ? notificationError.message
              : 'Failed to register for push notifications',
          );
        }
      });

    const subscription = addNotificationReceivedListener(() => {
      // Hook consumers can extend this for in-app notification UI.
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return { expoPushToken, error };
}
