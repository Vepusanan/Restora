import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { SelectField } from '@components/ui/SelectField';
import { SettingsCard } from '@components/settings/SettingsCard';
import { useAuth } from '@hooks/useAuth';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import {
  EXPIRY_AMBER_DAYS,
  EXPIRY_THRESHOLD_MAX,
  EXPIRY_THRESHOLD_MIN,
} from '@constants/inventory';
import { SUPPORTED_CURRENCIES } from '@/types';
import { validateRestaurantName } from '@utils/settings';
import { colors, spacing } from '@constants/theme';
import type { RestaurantCurrency, ServiceError } from '@/types';

export function RestaurantSettingsForm() {
  const { profile, isAdmin } = useAuth();
  const { restaurant, loading, updateSettings } = useRestaurantSettings(
    profile?.restaurantId,
  );
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<RestaurantCurrency>('USD');
  const [threshold, setThreshold] = useState(String(EXPIRY_AMBER_DAYS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    setName(restaurant.name);
    setCurrency(restaurant.currency);
    setThreshold(String(restaurant.expiryAlertThreshold ?? EXPIRY_AMBER_DAYS));
  }, [restaurant]);

  if (!isAdmin) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>Only restaurant admins can edit these settings.</Text>
      </ScrollView>
    );
  }

  if (loading && !restaurant) {
    return <LoadingState message="Loading restaurant settings…" />;
  }

  const onSave = async () => {
    const nextNameError = validateRestaurantName(name);
    setNameError(nextNameError);
    const parsed = Number(threshold);
    if (
      !Number.isFinite(parsed) ||
      parsed < EXPIRY_THRESHOLD_MIN ||
      parsed > EXPIRY_THRESHOLD_MAX
    ) {
      setError(`Amber threshold must be ${EXPIRY_THRESHOLD_MIN}–${EXPIRY_THRESHOLD_MAX} days.`);
      return;
    }
    if (nextNameError) return;

    setSaving(true);
    setError(null);
    try {
      await updateSettings({
        name,
        currency,
        expiryAlertThreshold: Math.floor(parsed),
      });
      Alert.alert('Settings saved', 'Restaurant settings were updated.');
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingsCard title="Restaurant">
        <Text style={styles.body}>
          Changes apply immediately to expiry badges, notifications, cost, and analytics.
        </Text>
        <InlineError message={error || undefined} />
        <Input
          label="Restaurant name"
          value={name}
          onChangeText={setName}
          error={nameError || undefined}
        />
        <SelectField
          label="Currency"
          value={currency}
          options={SUPPORTED_CURRENCIES.map((code) => ({
            value: code,
            label: code,
          }))}
          onChange={setCurrency}
        />
        <Input
          label={`Amber alert threshold (days)`}
          value={threshold}
          onChangeText={setThreshold}
          keyboardType="number-pad"
          placeholder={`${EXPIRY_THRESHOLD_MIN}–${EXPIRY_THRESHOLD_MAX}`}
        />
        <Text style={styles.meta}>
          Green: more than {threshold || EXPIRY_AMBER_DAYS} days · Amber: 0–
          {threshold || EXPIRY_AMBER_DAYS} days · Red: expired
        </Text>
        <Button title="Save restaurant settings" onPress={() => void onSave()} loading={saving} />
      </SettingsCard>
    </ScrollView>
  );
}

export default function RestaurantSettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Restaurant settings', headerShown: true }} />
      <RestaurantSettingsForm />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  meta: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
