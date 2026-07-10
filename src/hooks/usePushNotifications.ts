import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { deviceTokenService } from '@services/device-token.service';
import { notificationService } from '@services/notifications.service';
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
  if (status !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry Alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('restora-alerts', {
      name: 'Restora Alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    return typeof deviceToken.data === 'string' ? deviceToken.data : null;
  } catch (error) {
    console.warn('FCM token refresh failed', error);
    return null;
  }
}

/**
 * FR-048 / FR-051 — registers FCM device tokens for approved users,
 * refreshes on token change, and deep-links expiry taps.
 */
export function usePushNotifications() {
  const { user, profile, isAdmin, isStaff } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user?.uid || !profile?.restaurantId || profile.status !== 'approved') {
      registeredRef.current = false;
      return;
    }

    let cancelled = false;
    let tokenSub: { remove: () => void } | null = null;

    const register = async (token: string | null) => {
      if (!token || cancelled) return;
      try {
        const deviceId = await deviceTokenService.getOrCreateDeviceId();
        const payload = deviceTokenService.buildRegistrationPayload({
          userId: user.uid,
          restaurantId: profile.restaurantId,
          fcmToken: token,
          deviceId,
        });
        const docId = await deviceTokenService.register(payload);
        registeredRef.current = true;
        await deviceTokenService.touchLastActive(docId);
      } catch (error) {
        console.warn('FCM registration skipped', error);
      }
    };

    const bootstrap = async () => {
      const token = await resolveDevicePushToken();
      await register(token);
    };

    void bootstrap();

    // FR-048 — automatically update Firestore when the OS rotates the token.
    tokenSub = Notifications.addPushTokenListener((token) => {
      const value = typeof token.data === 'string' ? token.data : null;
      void register(value);
    });

    const onAppState = (state: AppStateStatus) => {
      if (state !== 'active' || !registeredRef.current) return;
      const active = deviceTokenService.getActiveRegistration();
      if (active?.docId) {
        void deviceTokenService.touchLastActive(active.docId);
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      const notificationId = data?.notificationId;
      if (notificationId && user.uid) {
        void notificationService.markOpened(notificationId, user.uid, profile.restaurantId);
        void notificationService.markRead(notificationId, user.uid, profile.restaurantId);
      }

      const batchId = data?.batchId;
      if (!batchId) {
        if (isAdmin) router.push('/(admin)/(tabs)/inbox');
        else if (isStaff) router.push('/(staff)/(tabs)/inbox');
        return;
      }
      if (isAdmin) router.push(`/(admin)/batch/${batchId}`);
      else if (isStaff) router.push(`/(staff)/batch/${batchId}`);
    });

    return () => {
      cancelled = true;
      tokenSub?.remove();
      responseSub.remove();
      appSub.remove();
    };
  }, [user?.uid, profile?.restaurantId, profile?.status, isAdmin, isStaff]);
}
