import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';
import { colors, radius, spacing } from '@constants/theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'onDark' | 'danger';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
};

export function Button({
  title,
  loading = false,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  disabled,
  style,
  ...props
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'primary' || variant === 'danger'
      ? colors.textOnLime
      : variant === 'onDark'
        ? colors.lime
        : colors.forest;

  const iconColor =
    variant === 'primary' || variant === 'danger'
      ? colors.textOnLime
      : variant === 'onDark'
        ? colors.lime
        : variant === 'ghost'
          ? colors.forest
          : colors.forest;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? undefined : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' ? <Icon name={icon} size={18} color={iconColor} /> : null}
          <Text
            style={[styles.text, styles[`${variant}Text` as const]]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Icon name={icon} size={18} color={iconColor} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: '100%',
  },
  primary: {
    backgroundColor: colors.lime,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  onDark: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.lime,
  },
  danger: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  primaryText: {
    color: colors.textOnLime,
  },
  secondaryText: {
    color: colors.forest,
  },
  ghostText: {
    color: colors.forest,
  },
  onDarkText: {
    color: colors.lime,
  },
  dangerText: {
    color: colors.danger,
  },
});
