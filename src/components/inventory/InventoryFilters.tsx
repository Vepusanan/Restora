import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ExpiryToneChip } from '@components/inventory/ExpiryBadge';
import { fieldBorder, webTextInputReset } from '@constants/inputStyles';
import { colors, spacing } from '@constants/theme';
import { toggleTone } from '@utils/inventory';
import type {
  ExpiryTone,
  InventoryFilters,
  InventorySortKey,
  InventoryVisibilityFilter,
} from '@/types';

type Props = {
  filters: InventoryFilters;
  suppliers: string[];
  onChange: (next: InventoryFilters) => void;
};

const VISIBILITY: { value: InventoryVisibilityFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'consumed', label: 'Consumed' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

const SORTS: { value: InventorySortKey; label: string }[] = [
  { value: 'dateReceived', label: 'Received' },
  { value: 'expiryDate', label: 'Expiry' },
  { value: 'ingredientName', label: 'Name' },
  { value: 'quantity', label: 'Qty' },
];

const TONES: ExpiryTone[] = ['green', 'amber', 'red'];

export function InventoryFiltersBar({ filters, suppliers, onChange }: Props) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        value={filters.search}
        onChangeText={(search) => onChange({ ...filters, search })}
        placeholder="Search ingredient…"
        placeholderTextColor={colors.textSecondary}
        style={[styles.search, webTextInputReset, searchFocused ? styles.searchFocused : null]}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />

      <Text style={styles.section}>Visibility</Text>
      <View style={styles.row}>
        {VISIBILITY.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => onChange({ ...filters, visibility: item.value })}
            style={[styles.chip, filters.visibility === item.value && styles.chipOn]}
          >
            <Text
              style={[styles.chipText, filters.visibility === item.value && styles.chipTextOn]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Expiry</Text>
      <View style={styles.row}>
        {TONES.map((tone) => (
          <ExpiryToneChip
            key={tone}
            tone={tone}
            selected={filters.expiryTones.includes(tone)}
            onPress={() =>
              onChange({
                ...filters,
                expiryTones: toggleTone(filters.expiryTones, tone),
              })
            }
          />
        ))}
      </View>

      <Text style={styles.section}>Sort</Text>
      <View style={styles.row}>
        {SORTS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => onChange({ ...filters, sort: item.value })}
            style={[styles.chip, filters.sort === item.value && styles.chipOn]}
          >
            <Text style={[styles.chipText, filters.sort === item.value && styles.chipTextOn]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {suppliers.length > 0 ? (
        <>
          <Text style={styles.section}>Supplier</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => onChange({ ...filters, supplier: null })}
              style={[styles.chip, !filters.supplier && styles.chipOn]}
            >
              <Text style={[styles.chipText, !filters.supplier && styles.chipTextOn]}>All</Text>
            </Pressable>
            {suppliers.map((supplier) => (
              <Pressable
                key={supplier}
                onPress={() => onChange({ ...filters, supplier })}
                style={[styles.chip, filters.supplier === supplier && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipText,
                    filters.supplier === supplier && styles.chipTextOn,
                  ]}
                >
                  {supplier}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  search: {
    borderWidth: 1.5,
    borderColor: fieldBorder.idle,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchFocused: {
    borderColor: fieldBorder.focused,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextOn: {
    color: colors.primaryDark,
  },
});
