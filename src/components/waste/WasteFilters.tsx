import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Input } from '@components/ui/Input';
import { SelectField } from '@components/ui/SelectField';
import { WASTE_REASON_OPTIONS } from '@constants/waste';
import { colors, spacing } from '@constants/theme';
import type { WasteFilters, WasteVisibilityFilter } from '@/types';

type LoggerOption = { id: string; name: string };

type Props = {
  filters: WasteFilters;
  loggers: LoggerOption[];
  onChange: (next: WasteFilters) => void;
};

const VISIBILITY_OPTIONS: { value: WasteVisibilityFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'voided', label: 'Voided' },
  { value: 'all', label: 'All' },
];

export function WasteFiltersBar({ filters, loggers, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Input
        label="Search"
        value={filters.search}
        onChangeText={(search) => onChange({ ...filters, search })}
        placeholder="Ingredient, reason, user, batch…"
        autoCapitalize="none"
      />

      <SelectField
        label="Status"
        value={filters.visibility}
        options={VISIBILITY_OPTIONS}
        onChange={(visibility) => onChange({ ...filters, visibility })}
      />

      <Text style={styles.label}>Waste reason</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.chip, !filters.wasteReason && styles.chipSelected]}
          onPress={() => onChange({ ...filters, wasteReason: null })}
        >
          <Text style={[styles.chipText, !filters.wasteReason && styles.chipTextSelected]}>
            Any
          </Text>
        </Pressable>
        {WASTE_REASON_OPTIONS.map((option) => {
          const selected = filters.wasteReason === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange({ ...filters, wasteReason: option.value })}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loggers.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>Logged by</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.chip, !filters.loggedBy && styles.chipSelected]}
              onPress={() => onChange({ ...filters, loggedBy: null })}
            >
              <Text style={[styles.chipText, !filters.loggedBy && styles.chipTextSelected]}>
                Anyone
              </Text>
            </Pressable>
            {loggers.map((logger) => {
              const selected = filters.loggedBy === logger.id;
              return (
                <Pressable
                  key={logger.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => onChange({ ...filters, loggedBy: logger.id })}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {logger.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.dates}>
        <View style={styles.dateGrow}>
          <Input
            label="From (YYYY-MM-DD)"
            value={filters.dateFrom ?? ''}
            onChangeText={(dateFrom) =>
              onChange({ ...filters, dateFrom: dateFrom.trim() || null })
            }
            placeholder="2026-07-01"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.dateGrow}>
          <Input
            label="To (YYYY-MM-DD)"
            value={filters.dateTo ?? ''}
            onChangeText={(dateTo) => onChange({ ...filters, dateTo: dateTo.trim() || null })}
            placeholder="2026-07-31"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  section: { marginBottom: spacing.md },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: colors.primaryDark },
  dates: { flexDirection: 'row', gap: spacing.sm },
  dateGrow: { flex: 1 },
});
