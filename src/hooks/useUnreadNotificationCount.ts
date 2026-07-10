import { useEffect, useState } from 'react';
import { notificationService } from '@services/notifications.service';
import { useAuth } from '@hooks/useAuth';

/** Lightweight realtime unread badge for tab bars. */
export function useUnreadNotificationCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setCount(0);
      return;
    }
    return notificationService.subscribeUnreadCount(user.uid, setCount);
  }, [user?.uid]);

  return count;
}
