import { Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';

import { Badge, expiryLabel } from '@/src/components/ui/Badge';
import { formatCurrency, formatDate } from '@/src/data/mock';
import type { IngredientGroup } from '@/src/types/restora';
import { useIsAdmin } from '@/src/context/SessionProvider';

type IngredientCardProps = {
  ingredient: IngredientGroup;
};

export function IngredientCard({ ingredient }: IngredientCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isAdmin = useIsAdmin();

  return (
    <View className="mb-3 overflow-hidden rounded-card border border-hairline bg-canvas">
      <View
        className="flex-row items-center justify-between p-4"
        onTouchEnd={() => setExpanded((v) => !v)}>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink">{ingredient.name}</Text>
          <Text className="mt-0.5 text-sm text-steel">
            {ingredient.category} · {ingredient.totalQuantity} {ingredient.unit} total
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={20} color="#888888" />
        ) : (
          <ChevronDown size={20} color="#888888" />
        )}
      </View>

      {expanded ? (
        <View className="border-t border-hairline-soft px-4 pb-4">
          {ingredient.batches.map((batch) => (
            <View
              key={batch.id}
              className="mt-3 rounded-md border border-hairline bg-surface p-3">
              <View className="mb-2 flex-row flex-wrap gap-2">
                {batch.isFifo ? <Badge label="FIFO" variant="fifo" /> : null}
                <Badge label={expiryLabel(batch.expiryStatus)} variant={batch.expiryStatus} />
              </View>
              <View className="gap-1">
                <Text className="text-sm font-medium text-ink">
                  {batch.quantity} {batch.unit} · {batch.supplier}
                </Text>
                <Text className="text-caption text-steel">
                  Received {formatDate(batch.receivedDate)} · Expires {formatDate(batch.expiryDate)}
                </Text>
                {isAdmin ? (
                  <Text className="text-caption font-semibold text-ink">
                    {formatCurrency(batch.quantity * batch.costPerUnit)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
