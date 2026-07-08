import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { SelectField } from '@/src/components/ui/SelectField';
import { INGREDIENT_CATEGORIES } from '@/src/data/mock';

type AddBatchFormProps = {
  showCost?: boolean;
  onSuccess: () => void;
};

export function AddBatchForm({ showCost = false, onSuccess }: AddBatchFormProps) {
  const [ingredient, setIngredient] = useState('');
  const [category, setCategory] = useState(INGREDIENT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!ingredient || !quantity || !supplier || !expiryDate) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    Alert.alert('Batch Added', `${quantity} ${unit} of ${ingredient} recorded.`, [
      { text: 'OK', onPress: onSuccess },
    ]);
  }

  return (
    <View className="gap-4">
      <Input label="Ingredient Name *" value={ingredient} onChangeText={setIngredient} placeholder="e.g. Chicken Breast" />
      <SelectField
        label="Category"
        value={category}
        onChange={setCategory}
        options={INGREDIENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input label="Quantity *" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="0" />
        </View>
        <View className="w-24">
          <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="kg" />
        </View>
      </View>
      {showCost ? (
        <Input
          label="Cost per Unit (LKR)"
          value={costPerUnit}
          onChangeText={setCostPerUnit}
          keyboardType="decimal-pad"
          placeholder="0.00"
          hint="Admin only — stored in Firestore"
        />
      ) : null}
      <Input label="Supplier *" value={supplier} onChangeText={setSupplier} placeholder="Supplier name" />
      <Input
        label="Expiry Date *"
        value={expiryDate}
        onChangeText={setExpiryDate}
        placeholder="YYYY-MM-DD"
        hint="Format: 2026-07-15"
      />
      <Text className="text-caption text-stone">
        Firebase placeholder: batch will sync to Firestore inventory_batches collection.
      </Text>
      <Button label="Save Batch" onPress={handleSubmit} loading={loading} fullWidth />
    </View>
  );
}
