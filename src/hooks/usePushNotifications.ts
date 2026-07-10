import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { userService } from '@services/user.service';
import { useAuth } from '@hooks/useAuth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function resolveDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice && Platform.OS !== 'web') {
    console.warn('Push notifications require a physical device');
    return null;
  }

  if (Platform.OS === 'web') {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry Alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  // Native FCM/APNs device token for Admin SDK messaging.
  const deviceToken = await Notifications.getDevicePushTokenAsync();
  return typeof deviceToken.data === 'string' ? deviceToken.data : null;
}

/**
 * Registers FCM device tokens for approved users and handles expiry deep links.
 */
export function usePushNotifications() {
  const { user, profile, isAdmin, isStaff } = useAuth();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid || profile?.status !== 'approved') return;

    let cancelled = false;

    const register = async () => {
      try {
        const token = await resolveDevicePushToken();
        if (!token || cancelled) return;
        tokenRef.current = token;
        await userService.registerFcmToken(user.uid, token);
      } catch (error) {
        console.warn('FCM registration skipped', error);
      }
    };

    void register();

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      const batchId = data?.batchId;
      if (!batchId) {
        if (isAdmin) router.push('/(admin)/(tabs)/inventory');
        else if (isStaff) router.push('/(staff)/(tabs)/inventory');
        return;
      }
      if (isAdmin) router.push(`/(admin)/batch/${batchId}`);
      else if (isStaff) router.push(`/(staff)/batch/${batchId}`);
    });

    return () => {
      cancelled = true;
      responseSub.remove();
    };
  }, [user?.uid, profile?.status, isAdmin, isStaff]);

  useEffect(() => {
    return () => {
      // Token cleanup on logout is handled when profile clears; best-effort remove.
      if (user?.uid && tokenRef.current) {
        void userService.removeFcmToken(user.uid, tokenRef.current).catch(() => undefined);
      }
    };
  }, [user?.uid]);
}
