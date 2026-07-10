import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS } from '@constants/notifications';
import type { NotificationInboxFilters, NotificationTypeFilter } from '@/types';

type Props = {
  filters: NotificationInboxFilters;
  onTypeChange: (type: NotificationTypeFilter) => void;
  onUnreadOnlyChange: (value: boolean) => void;
};

const TYPE_OPTIONS: NotificationTypeFilter[] = ['all', ...NOTIFICATION_TYPES];

export function NotificationFilters({
  filters,
  onTypeChange,
  onUnreadOnlyChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPE_OPTIONS.map((type) => {
          const active = filters.type === type;
          return (
            <Pressable
              key={type}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onTypeChange(type)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {NOTIFICATION_TYPE_LABELS[type]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        style={[styles.chip, filters.unreadOnly && styles.chipActive]}
        onPress={() => onUnreadOnlyChange(!filters.unreadOnly)}
      >
        <Text style={[styles.chipText, filters.unreadOnly && styles.chipTextActive]}>
          Unread only
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
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
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark },
});
