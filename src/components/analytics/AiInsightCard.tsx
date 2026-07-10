import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@components/ui/Icon';
import { colors, radius, spacing } from '@constants/theme';
import type { AiInsightItem, AiInsightSeverity } from '@/types';

const CATEGORY_ICONS: Record<string, IconName> = {
  Inventory: 'cube-outline',
  Waste: 'trash-outline',
  Cost: 'cash-outline',
  Expiry: 'time-outline',
  Operations: 'construct-outline',
};

const SEVERITY_STYLE: Record<
  AiInsightSeverity,
  { bg: string; fg: string }
> = {
  Critical: { bg: colors.dangerLight, fg: colors.danger },
  High: { bg: colors.warningLight, fg: colors.warning },
  Medium: { bg: colors.limeSoft, fg: colors.forest },
  Low: { bg: colors.mist, fg: colors.textSecondary },
};

type Props = {
  insight: AiInsightItem;
};

export function AiInsightCard({ insight }: Props) {
  const severity = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.Medium;
  const icon = CATEGORY_ICONS[insight.category] ?? 'sparkles-outline';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={colors.forest} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.category}>{insight.category}</Text>
          <Text style={styles.title}>{insight.title}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: severity.bg }]}>
          <Text style={[styles.badgeText, { color: severity.fg }]}>{insight.severity}</Text>
        </View>
      </View>

      <Text style={styles.body}>{insight.description}</Text>

      {insight.impact ? (
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Impact</Text>
          <Text style={styles.metaText}>{insight.impact}</Text>
        </View>
      ) : null}

      {insight.recommendation ? (
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Recommendation</Text>
          <Text style={styles.metaText}>{insight.recommendation}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  metaBlock: { gap: 2 },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest,
  },
  metaText: { fontSize: 13, color: colors.text, lineHeight: 18 },
});
