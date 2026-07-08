import { Text, View } from 'react-native';

import { AnalyticsChart } from '@/src/components/charts/AnalyticsChart';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { formatCurrency, MOCK_ANALYTICS } from '@/src/data/mock';

export default function AdminAnalyticsScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Analytics"
        subtitle="Admin-only financial & operational insights"
      />

      <Card title="Weekly Waste Trend" subtitle="Cost loss (LKR)" className="mb-4">
        <View className="min-h-[280px]">
          <AnalyticsChart data={MOCK_ANALYTICS.wasteTrend} />
        </View>
      </Card>

      <Card title="Inventory Value by Category" subtitle="Percentage split" className="mb-4">
        <View className="min-h-[240px]">
          <AnalyticsChart data={MOCK_ANALYTICS.costByCategory} />
        </View>
      </Card>

      <Card title="Top Wasted Items" subtitle="This week">
        {MOCK_ANALYTICS.topWasted.map((item, index) => (
          <View
            key={item.label}
            className={`flex-row items-center justify-between py-3 ${index > 0 ? 'border-t border-hairline-soft' : ''}`}>
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-danger/10">
                <Text className="text-sm font-bold text-danger">{index + 1}</Text>
              </View>
              <Text className="text-base font-medium text-ink">{item.label}</Text>
            </View>
            <Text className="font-semibold text-ink">{formatCurrency(item.value)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
