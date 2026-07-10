import { StyleSheet, View } from 'react-native';
import { DateField } from '@components/ui/DateField';
import { colors, spacing } from '@constants/theme';
import { parseDateOnly } from '@utils/expiry';
import type { FinancialDateRange } from '@/types';

type Props = {
  range: FinancialDateRange;
  onChange: (range: FinancialDateRange) => void;
};

export function DateRangeFields({ range, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.grow}>
        <DateField
          label="Start date"
          value={range.startDate}
          onChange={(startDate) => onChange({ ...range, startDate })}
          maximumDate={range.endDate ? parseDateOnly(range.endDate) : undefined}
        />
      </View>
      <View style={styles.grow}>
        <DateField
          label="End date"
          value={range.endDate}
          onChange={(endDate) => onChange({ ...range, endDate })}
          minimumDate={range.startDate ? parseDateOnly(range.startDate) : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  grow: { flex: 1 },
});
