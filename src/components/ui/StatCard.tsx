import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accent = '#00d4a4',
}: StatCardProps) {
  return (
    <View className="min-w-[46%] flex-1 rounded-card border border-hairline bg-canvas p-4">
      <View
        className="mb-3 h-9 w-9 items-center justify-center rounded-md"
        style={{ backgroundColor: `${accent}1a` }}>
        <Icon size={18} color={accent} />
      </View>
      <Text className="text-micro font-semibold uppercase tracking-[0.5px] text-steel">
        {label}
      </Text>
      <Text className="mt-1 text-xl font-semibold text-ink">{value}</Text>
      {trend ? (
        <Text className={`mt-1 text-caption font-medium ${trendUp ? 'text-safe' : 'text-danger'}`}>
          {trend}
        </Text>
      ) : null}
    </View>
  );
}
