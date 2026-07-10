import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { notificationTypeLabel } from '@utils/notifications';
import type { AppNotification } from '@/types';

type Props = {
  item: AppNotification;
  unread: boolean;
  onPress: () => void;
};

export function NotificationCard({ item, unread, onPress }: Props) {
  const tone =
    item.status === 'red' ? colors.danger : item.status === 'amber' ? colors.warning : colors.primary;

  return (
    <Pressable
      style={[styles.card, unread && styles.unread]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: unread }}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: unread ? tone : colors.border }]} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.type}>{notificationTypeLabel(item.type)}</Text>
          </View>
          <Text style={styles.text} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={styles.meta}>
            {item.createdAt.slice(0, 16).replace('T', ' ')}
            {item.ingredientName ? ` · ${item.ingredientName}` : ''}
            {item.priority === 'high' || item.priority === 'critical'
              ? ` · ${item.priority}`
              : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  unread: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  body: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  type: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
