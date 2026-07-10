import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import type { UserStatus } from '@/types';

const STATUS_STYLES: Record<
  UserStatus,
  { backgroundColor: string; color: string; label: string }
> = {
  pending: { backgroundColor: '#FEF3C7', color: colors.warning, label: 'Pending' },
  approved: { backgroundColor: '#DCFCE7', color: colors.success, label: 'Approved' },
  rejected: { backgroundColor: colors.dangerLight, color: colors.danger, label: 'Rejected' },
  deactivated: { backgroundColor: '#E2E8F0', color: colors.textSecondary, label: 'Deactivated' },
};

type Props = {
  status: UserStatus;
};

export function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.text, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
