import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsToggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : '#f4f4f5'}
      />
    </View>
  );
}

type CardProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function SettingsCard({ title, children, actionLabel, onAction }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction}>
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text },
  description: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  action: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
