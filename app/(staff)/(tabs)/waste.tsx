import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { formatDateTime, MOCK_WASTE_LOGS } from '@/src/data/mock';

export default function StaffWasteScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader
        title="Waste Log"
        subtitle="Record spoilage and disposal"
        rightAction={
          <Pressable
            onPress={() => router.push('/(staff)/waste-log')}
            className="flex-row items-center gap-1 rounded-full bg-primary px-4 py-2 active:bg-charcoal">
            <Plus size={16} color="#ffffff" />
            <Text className="text-sm font-medium text-on-primary">Log</Text>
          </Pressable>
        }
      />

      {MOCK_WASTE_LOGS.length === 0 ? (
        <EmptyState
          title="No waste logged"
          message="Record waste events to help track operational efficiency."
          actionLabel="Log Waste"
          onAction={() => router.push('/(staff)/waste-log')}
        />
      ) : (
        MOCK_WASTE_LOGS.map((entry) => (
          <Card key={entry.id} className="mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink">{entry.ingredientName}</Text>
                <Text className="mt-1 text-sm text-steel">
                  {entry.quantity} {entry.unit} · {entry.reason}
                </Text>
                <Text className="mt-1 text-caption text-stone">
                  {entry.loggedBy} · {formatDateTime(entry.loggedAt)}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
