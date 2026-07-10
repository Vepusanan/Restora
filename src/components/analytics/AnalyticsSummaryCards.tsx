import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { formatMoney } from '@utils/financial';

type Card = {
  label: string;
  value: number;
  tone?: 'default' | 'danger' | 'primary';
};

type Props = {
  cards: Card[];
  lastUpdated: string;
};

export function AnalyticsSummaryCards({ cards, lastUpdated }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.label}>{card.label}</Text>
            <Text
              style={[
                styles.value,
                card.tone === 'danger' && styles.danger,
                card.tone === 'primary' && styles.primary,
              ]}
            >
              {formatMoney(card.value)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.meta}>Last updated: {lastUpdated.slice(0, 19).replace('T', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  value: { fontSize: 20, fontWeight: '800', color: colors.text },
  danger: { color: colors.danger },
  primary: { color: colors.primary },
  meta: { fontSize: 12, color: colors.textSecondary },
});
