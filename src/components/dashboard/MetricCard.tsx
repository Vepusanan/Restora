import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing } from '@constants/theme';
import { Icon, type IconName } from '@components/ui/Icon';

type Props = {
  label: string;
  value: string;
  icon: IconName;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  onPress?: () => void;
  hint?: string;
};

const TONE_BG = {
  default: colors.surface,
  warning: colors.warningLight,
  danger: colors.dangerLight,
  success: colors.successLight,
} as const;

const TONE_ICON = {
  default: colors.forest,
  warning: colors.warning,
  danger: colors.danger,
  success: colors.success,
} as const;

/** Dashboard metric tile — icon + copy share one left edge. */
export function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
  onPress,
  hint,
}: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: TONE_BG[tone] },
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.limeSoft }]}>
          <Icon name={icon} size={18} color={TONE_ICON[tone]} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {hint ? (
            <Text style={styles.hint} numberOfLines={1}>
              {hint}
            </Text>
          ) : (
            <View style={styles.hintSpacer} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

type QuickActionProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

export function QuickAction({ label, icon, onPress }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
    >
      <View style={styles.actionIcon}>
        <Icon name={icon} size={20} color={colors.forest} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

type Period = '7d' | '30d' | '90d';

type PeriodPillsProps = {
  value: Period;
  onChange: (next: Period) => void;
};

export function PeriodPills({ value, onChange }: PeriodPillsProps) {
  const options: { id: Period; label: string }[] = [
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
  ];

  return (
    <View style={styles.pills}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[styles.pill, active ? styles.pillActive : null]}
          >
            <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Keep a strict 2-column grid even when the last row has one card.
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '48.5%',
    minWidth: 0,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.e1,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  content: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: 108,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
  },
  copy: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: 2,
  },
  value: {
    margin: 0,
    padding: 0,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'left',
    includeFontPadding: false,
  },
  label: {
    margin: 0,
    padding: 0,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'left',
    includeFontPadding: false,
  },
  hint: {
    margin: 0,
    marginTop: 2,
    padding: 0,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'left',
    includeFontPadding: false,
  },
  /** Reserves hint-line height so cards with/without hints share the same bottom padding. */
  hintSpacer: {
    marginTop: 2,
    height: 14,
  },
  action: {
    width: 76,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.mist,
    borderRadius: radius.pill,
    padding: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: colors.lime,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnLime,
  },
});
