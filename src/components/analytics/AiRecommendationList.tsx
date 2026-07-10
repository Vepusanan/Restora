import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@components/ui/Icon';
import { colors, radius, spacing } from '@constants/theme';
import type { AiRecommendationItem, AiInsightSeverity } from '@/types';

const PRIORITY_COLOR: Record<AiInsightSeverity, string> = {
  Critical: colors.danger,
  High: colors.warning,
  Medium: colors.forest,
  Low: colors.textSecondary,
};

type Props = {
  items: AiRecommendationItem[];
};

export function AiRecommendationList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Recommended actions</Text>
      {items.map((item, index) => (
        <View key={`${item.action}-${index}`} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon name="checkmark-circle-outline" size={18} color={colors.forest} />
          </View>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={styles.action}>{item.action}</Text>
              <Text style={[styles.priority, { color: PRIORITY_COLOR[item.priority] }]}>
                {item.priority}
              </Text>
            </View>
            <Text style={styles.reason}>{item.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  action: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  priority: { fontSize: 11, fontWeight: '800' },
  reason: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
