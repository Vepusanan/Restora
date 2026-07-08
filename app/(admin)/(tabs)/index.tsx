import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import {
  BarChart3,
  Bot,
  Package,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react-native';

import { Card } from '@/src/components/ui/Card';
import { QuickAction } from '@/src/components/ui/QuickAction';
import { Screen } from '@/src/components/ui/Screen';
import { StatCard } from '@/src/components/ui/StatCard';
import { formatCurrency, MOCK_ADMIN_STATS, MOCK_NOTIFICATIONS } from '@/src/data/mock';
import { useSession } from '@/src/context/SessionProvider';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useSession();
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-steel">Good evening</Text>
          <Text className="text-2xl font-semibold tracking-tight text-ink">
            {user?.displayName ?? 'Admin'}
          </Text>
          <Text className="text-sm text-mint-deep">{user?.restaurantName}</Text>
        </View>
        <View className="items-end">
          <Text className="text-caption text-stone">Code: {user?.restaurantCode}</Text>
          <Text className="mt-1 text-caption font-medium text-ink" onPress={() => logout()}>
            Sign out
          </Text>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-3">
        <StatCard
          label="Inventory Value"
          value={formatCurrency(MOCK_ADMIN_STATS.totalInventoryValue)}
          icon={Wallet}
          trend="+4.2% vs last week"
          trendUp
          accent="#00b48a"
        />
        <StatCard
          label="Waste This Week"
          value={formatCurrency(MOCK_ADMIN_STATS.wasteThisWeek)}
          icon={TrendingDown}
          trend="-12% vs last week"
          trendUp={false}
          accent="#d45656"
        />
        <StatCard
          label="Expiring Soon"
          value={String(MOCK_ADMIN_STATS.expiringItems)}
          icon={Package}
          accent="#c37d0d"
        />
        <StatCard
          label="Active Staff"
          value={String(MOCK_ADMIN_STATS.activeStaff)}
          icon={Users}
          accent="#1ba673"
        />
      </View>

      {unread > 0 ? (
        <Card
          title="Attention needed"
          subtitle={`${unread} unread notifications`}
          className="mb-4 border-warning/25 bg-warning/[0.08]">
          <Text className="text-sm text-ink">
            Items expiring soon and pending staff approvals require your review.
          </Text>
        </Card>
      ) : null}

      <Text className="mb-3 text-base font-semibold text-ink">Quick Actions</Text>
      <QuickAction
        label="View Inventory"
        icon={Package}
        onPress={() => router.push('/(admin)/(tabs)/inventory')}
      />
      <QuickAction
        label="Analytics Dashboard"
        icon={BarChart3}
        onPress={() => router.push('/(admin)/(tabs)/analytics')}
      />
      <QuickAction
        label="Manage Staff"
        icon={Users}
        onPress={() => router.push('/(admin)/staff')}
      />
      <QuickAction
        label="Log Waste"
        icon={Trash2}
        onPress={() => router.push('/(admin)/waste-log')}
      />
      <QuickAction label="AI Assistant" icon={Bot} onPress={() => router.push('/(admin)/ai')} />

      <Card title="Weekly Insight" subtitle="Powered by Restora AI" className="mt-2">
        <View className="flex-row items-start gap-2">
          <TrendingUp size={18} color="#1ba673" />
          <Text className="flex-1 text-sm leading-5 text-steel">
            Protein waste is up 18% this week. Consider adjusting chicken prep quantities and
            prioritizing FIFO batches expiring Jul 9.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
