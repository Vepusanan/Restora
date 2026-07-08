import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SelectField } from '@/src/components/ui/SelectField';
import { formatCurrency, MOCK_INGREDIENTS, WASTE_REASONS } from '@/src/data/mock';
import { useIsAdmin } from '@/src/context/SessionProvider';

export default function WasteLogScreen() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [ingredient, setIngredient] = useState(MOCK_INGREDIENTS[0]?.name ?? '');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(WASTE_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const estimatedCost = quantity ? Number(quantity) * 640 : 0;

  async function handleSubmit() {
    if (!quantity) {
      Alert.alert('Missing quantity', 'Enter the wasted quantity.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    Alert.alert('Waste Logged', 'Waste event recorded successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader title="Log Waste" subtitle="Track spoilage and cost loss" showBack />

      <View className="gap-4">
        <SelectField
          label="Ingredient"
          value={ingredient}
          onChange={setIngredient}
          options={MOCK_INGREDIENTS.map((i) => ({ label: i.name, value: i.name }))}
        />
        <Input
          label="Quantity Wasted *"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <SelectField
          label="Reason"
          value={reason}
          onChange={setReason}
          options={WASTE_REASONS.map((r) => ({ label: r, value: r }))}
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details..."
          multiline
          numberOfLines={3}
          className="min-h-[80px]"
        />

        {isAdmin && quantity ? (
          <View className="rounded-md border border-danger/20 bg-danger/[0.06] p-4">
            <Text className="text-sm font-medium text-danger">Estimated Cost Loss</Text>
            <Text className="mt-1 text-xl font-semibold text-danger">{formatCurrency(estimatedCost)}</Text>
          </View>
        ) : null}

        {!isAdmin ? (
          <Text className="text-caption text-stone">
            Cost calculations are hidden for staff accounts per RBAC policy.
          </Text>
        ) : null}

        <Button label="Submit Waste Log" onPress={handleSubmit} loading={loading} fullWidth variant="danger" />
      </View>
    </Screen>
  );
}
