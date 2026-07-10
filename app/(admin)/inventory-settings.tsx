import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import {
  EXPIRY_AMBER_DAYS,
  EXPIRY_THRESHOLD_MAX,
  EXPIRY_THRESHOLD_MIN,
} from '@constants/inventory';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export default function InventorySettingsScreen() {
  const { profile } = useAuth();
  const { restaurant, loading, amberDays, updateThreshold } = useRestaurantSettings(
    profile?.restaurantId,
  );
  const [value, setValue] = useState(String(EXPIRY_AMBER_DAYS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      setValue(String(restaurant.expiryAlertThreshold ?? EXPIRY_AMBER_DAYS));
    }
  }, [restaurant]);

  const onSave = async () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < EXPIRY_THRESHOLD_MIN || parsed > EXPIRY_THRESHOLD_MAX) {
      setError(`Enter a number between ${EXPIRY_THRESHOLD_MIN} and ${EXPIRY_THRESHOLD_MAX}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateThreshold(parsed);
      Alert.alert('Settings saved', `Amber alerts now trigger at ${Math.floor(parsed)} day(s).`);
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !restaurant) {
    return <LoadingState message="Loading settings…" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Inventory Settings', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Expiry alert threshold</Text>
        <Text style={styles.body}>
          Batches enter Amber status when they have this many days (or fewer) remaining before
          expiry. Default is {EXPIRY_AMBER_DAYS} days. Changes apply immediately to future
          evaluations and inventory badges.
        </Text>

        <InlineError message={error || undefined} />

        <Input
          label={`Amber threshold (days) — current ${amberDays}`}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          placeholder={`${EXPIRY_THRESHOLD_MIN}–${EXPIRY_THRESHOLD_MAX}`}
        />

        <Button title="Save threshold" onPress={() => void onSave()} loading={saving} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How it works</Text>
          <Text style={styles.meta}>Green: more than {value || amberDays} days left</Text>
          <Text style={styles.meta}>Amber: 0 to {value || amberDays} days left</Text>
          <Text style={styles.meta}>Red: expired</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
});
