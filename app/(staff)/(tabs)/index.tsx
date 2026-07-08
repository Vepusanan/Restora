import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AlertTriangle, Bot, Package, Plus, Trash2 } from 'lucide-react-native';

import { Card } from '@/src/components/ui/Card';
import { QuickAction } from '@/src/components/ui/QuickAction';
import { Screen } from '@/src/components/ui/Screen';
import { StatCard } from '@/src/components/ui/StatCard';
import { MOCK_INGREDIENTS, MOCK_STAFF_STATS } from '@/src/data/mock';
import { useSession } from '@/src/context/SessionProvider';

export default function StaffDashboard() {
  const router = useRouter();
  const { user, logout } = useSession();

  const expiringBatches = MOCK_INGREDIENTS.flatMap((i) =>
    i.batches.filter((b) => b.expiryStatus !== 'safe').map((b) => ({ ...b, ingredient: i.name })),
  );

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-steel">Kitchen operations</Text>
          <Text className="text-2xl font-semibold tracking-tight text-ink">
            {user?.displayName ?? 'Staff'}
          </Text>
          <Text className="text-sm text-mint-deep">{user?.restaurantName}</Text>
        </View>
        <Text className="text-caption font-medium text-ink" onPress={() => logout()}>
          Sign out
        </Text>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-3">
        <StatCard
          label="Expiring Soon"
          value={String(MOCK_STAFF_STATS.expiringItems)}
          icon={AlertTriangle}
          accent="#c37d0d"
        />
        <StatCard
          label="Low Stock"
          value={String(MOCK_STAFF_STATS.lowStockItems)}
          icon={Package}
          accent="#d45656"
        />
        <StatCard
          label="Batches Today"
          value={String(MOCK_STAFF_STATS.batchesLoggedToday)}
          icon={Plus}
          accent="#1ba673"
        />
        <StatCard
          label="Waste Logged"
          value={String(MOCK_STAFF_STATS.wasteLoggedToday)}
          icon={Trash2}
          accent="#5a5a5c"
        />
      </View>

      {expiringBatches.length > 0 ? (
        <Card title="Use FIFO First" subtitle="Priority batches" className="mb-4 border-warning/25">
          {expiringBatches.slice(0, 3).map((batch) => (
            <View key={batch.id} className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-ink">{batch.ingredient}</Text>
              <Text className="text-sm text-warning">
                {batch.quantity} {batch.unit}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Text className="mb-3 text-base font-semibold text-ink">Quick Actions</Text>
      <QuickAction
        label="View Inventory"
        icon={Package}
        onPress={() => router.push('/(staff)/(tabs)/inventory')}
      />
      <QuickAction
        label="Add Inventory Batch"
        icon={Plus}
        onPress={() => router.push('/(staff)/add-batch')}
      />
      <QuickAction
        label="Log Waste"
        icon={Trash2}
        onPress={() => router.push('/(staff)/waste-log')}
      />
      <QuickAction label="Ask AI Assistant" icon={Bot} onPress={() => router.push('/(staff)/(tabs)/ai')} />

      <Card title="Staff Access" className="mt-2">
        <Text className="text-sm leading-5 text-steel">
          Financial data, analytics, and cost breakdowns are restricted to admin accounts per
          restaurant policy.
        </Text>
      </Card>
    </Screen>
  );
}
