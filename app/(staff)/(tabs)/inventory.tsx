import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

import { IngredientCard } from '@/src/components/inventory/IngredientCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { MOCK_INGREDIENTS } from '@/src/data/mock';

export default function StaffInventoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_INGREDIENTS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <Screen>
      <ScreenHeader
        title="Inventory"
        subtitle="View batches and expiry status"
        rightAction={
          <Pressable
            onPress={() => router.push('/(staff)/add-batch')}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary active:bg-charcoal">
            <Plus size={20} color="#ffffff" />
          </Pressable>
        }
      />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search ingredients..." />

      {filtered.length === 0 ? (
        <EmptyState
          title="No ingredients found"
          message="Try a different search term."
          actionLabel="Add Batch"
          onAction={() => router.push('/(staff)/add-batch')}
        />
      ) : (
        filtered.map((ingredient) => <IngredientCard key={ingredient.id} ingredient={ingredient} />)
      )}
    </Screen>
  );
}
