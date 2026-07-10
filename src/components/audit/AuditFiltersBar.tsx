import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DateField } from '@components/ui/DateField';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_TYPES,
  AUDIT_MODULE_LABELS,
  AUDIT_MODULES,
} from '@constants/audit';
import { fieldBorder, webTextInputReset } from '@constants/inputStyles';
import { colors, spacing } from '@constants/theme';
import type {
  AuditAction,
  AuditActionType,
  AuditFilters,
  AuditModule,
} from '@/types';

type ActorOption = { id: string; name: string };

type Props = {
  filters: AuditFilters;
  actors: ActorOption[];
  onChange: (patch: Partial<AuditFilters>) => void;
};

const ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[];

export function AuditFiltersBar({ filters, actors, onChange }: Props) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.search, webTextInputReset, searchFocused ? styles.searchFocused : null]}
        placeholder="Search user, entity, action…"
        placeholderTextColor={colors.textSecondary}
        value={filters.search}
        onChangeText={(search) => onChange({ search })}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          label="Newest"
          active={filters.sort === 'newest'}
          onPress={() => onChange({ sort: 'newest' })}
        />
        <Chip
          label="Oldest"
          active={filters.sort === 'oldest'}
          onPress={() => onChange({ sort: 'oldest' })}
        />
        <Chip
          label="All modules"
          active={filters.module === 'all'}
          onPress={() => onChange({ module: 'all' })}
        />
        {AUDIT_MODULES.map((module) => (
          <Chip
            key={module}
            label={AUDIT_MODULE_LABELS[module]}
            active={filters.module === module}
            onPress={() => onChange({ module: module as AuditModule })}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          label="All actions"
          active={filters.action === 'all'}
          onPress={() => onChange({ action: 'all' })}
        />
        {ACTIONS.slice(0, 12).map((action) => (
          <Chip
            key={action}
            label={AUDIT_ACTION_LABELS[action]}
            active={filters.action === action}
            onPress={() => onChange({ action })}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          label="All types"
          active={filters.actionType === 'all'}
          onPress={() => onChange({ actionType: 'all' })}
        />
        {AUDIT_ACTION_TYPES.map((type) => (
          <Chip
            key={type}
            label={type}
            active={filters.actionType === type}
            onPress={() => onChange({ actionType: type as AuditActionType })}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          label="All users"
          active={filters.actorId === 'all'}
          onPress={() => onChange({ actorId: 'all' })}
        />
        {actors.map((actor) => (
          <Chip
            key={actor.id}
            label={actor.name}
            active={filters.actorId === actor.id}
            onPress={() => onChange({ actorId: actor.id })}
          />
        ))}
      </ScrollView>

      <View style={styles.dates}>
        <View style={styles.dateCol}>
          <DateField
            label="From"
            value={filters.dateFrom}
            onChange={(dateFrom) => onChange({ dateFrom })}
          />
        </View>
        <View style={styles.dateCol}>
          <DateField
            label="To"
            value={filters.dateTo}
            onChange={(dateTo) => onChange({ dateTo })}
          />
        </View>
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  search: {
    borderWidth: 1.5,
    borderColor: fieldBorder.idle,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  searchFocused: {
    borderColor: fieldBorder.focused,
  },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark },
  dates: { flexDirection: 'row', gap: spacing.sm },
  dateCol: { flex: 1 },
});
