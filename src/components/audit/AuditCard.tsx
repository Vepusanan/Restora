import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { auditActionLabel, auditModuleLabel } from '@utils/audit';
import type { AuditLogEntry } from '@/types';

type Props = {
  item: AuditLogEntry;
  onPress: () => void;
};

export function AuditCard({ item, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.row}>
        <Text style={styles.time}>{item.timestamp.slice(0, 19).replace('T', ' ')}</Text>
        <Text style={styles.module}>{auditModuleLabel(item.module)}</Text>
      </View>
      <Text style={styles.action}>{auditActionLabel(item.action)}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.meta}>
        {item.actorName} · {item.actorRole}
        {item.targetName ? ` · ${item.targetName}` : ''}
      </Text>
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
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  time: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  module: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  action: { fontSize: 16, fontWeight: '700', color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
