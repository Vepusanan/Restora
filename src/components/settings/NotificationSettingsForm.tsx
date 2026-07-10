import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@components/ui/Button';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { SettingsCard, SettingsToggle } from '@components/settings/SettingsCard';
import { useAuth } from '@hooks/useAuth';
import { userService } from '@services/user.service';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export function NotificationSettingsForm() {
  const { user, profile } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [amberAlertsEnabled, setAmberAlertsEnabled] = useState(true);
  const [redAlertsEnabled, setRedAlertsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.notificationPrefs) return;
    setPushEnabled(profile.notificationPrefs.pushEnabled);
    setAmberAlertsEnabled(profile.notificationPrefs.amberAlertsEnabled);
    setRedAlertsEnabled(profile.notificationPrefs.redAlertsEnabled);
  }, [profile?.notificationPrefs]);

  if (!profile || !user) {
    return <LoadingState message="Loading notification settings…" />;
  }

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await userService.updateNotificationPreferences(user.uid, {
        pushEnabled,
        amberAlertsEnabled: pushEnabled ? amberAlertsEnabled : false,
        redAlertsEnabled: pushEnabled ? redAlertsEnabled : false,
      });
      Alert.alert('Preferences saved', 'Expiry push delivery will respect these settings.');
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingsCard title="Push notifications">
        <Text style={styles.body}>
          Control whether this account receives expiry alerts on signed-in devices.
        </Text>
        <InlineError message={error || undefined} />
        <SettingsToggle
          label="Enable push notifications"
          description="Master switch for FCM delivery to your devices."
          value={pushEnabled}
          onChange={setPushEnabled}
        />
        <SettingsToggle
          label="Amber expiry alerts"
          description="Batches approaching expiry within the restaurant threshold."
          value={amberAlertsEnabled}
          onChange={setAmberAlertsEnabled}
          disabled={!pushEnabled}
        />
        <SettingsToggle
          label="Red expiry alerts"
          description="Batches that have already expired."
          value={redAlertsEnabled}
          onChange={setRedAlertsEnabled}
          disabled={!pushEnabled}
        />
        <Button title="Save preferences" onPress={() => void onSave()} loading={saving} />
      </SettingsCard>
    </ScrollView>
  );
}

export default function NotificationSettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
      <NotificationSettingsForm />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
