import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Plus } from 'lucide-react-native';

import { IngredientCard } from '@/src/components/inventory/IngredientCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { MOCK_INGREDIENTS } from '@/src/data/mock';

export default function AdminInventoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [loading] = useState(false);
  const [error] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_INGREDIENTS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
    );
  }, [search]);

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Inventory" subtitle="Batch tracking with FIFO" />
        <Text className="text-center text-steel">Loading inventory...</Text>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader title="Inventory" />
        <EmptyState
          title="Could not load inventory"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => {}}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Inventory"
        subtitle={`${MOCK_INGREDIENTS.length} ingredients · FIFO enabled`}
        rightAction={
          <Pressable
            onPress={() => router.push('/(admin)/add-batch')}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary active:bg-charcoal">
            <Plus size={20} color="#ffffff" />
          </Pressable>
        }
      />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search ingredients..." />

      {filtered.length === 0 ? (
        <EmptyState
          title="No ingredients found"
          message="Try a different search or add a new inventory batch."
          actionLabel="Add Batch"
          onAction={() => router.push('/(admin)/add-batch')}
        />
      ) : (
        filtered.map((ingredient) => <IngredientCard key={ingredient.id} ingredient={ingredient} />)
      )}
    </Screen>
  );
}
