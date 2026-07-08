import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

// Mintlify: black-pill primary dominates; mint pill for brand-emphasis;
// outlined pill for secondary; rectangular ghost for tertiary.
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-charcoal',
  accent: 'bg-mint active:bg-mint-deep',
  secondary: 'border border-hairline bg-transparent active:bg-surface',
  outline: 'border border-hairline bg-transparent active:bg-surface',
  ghost: 'bg-transparent active:bg-surface',
  danger: 'bg-danger active:opacity-90',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-on-primary',
  accent: 'text-primary',
  secondary: 'text-ink',
  outline: 'text-ink',
  ghost: 'text-ink',
  danger: 'text-on-primary',
};

const spinnerColor: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  accent: '#0a0a0a',
  secondary: '#0a0a0a',
  outline: '#0a0a0a',
  ghost: '#0a0a0a',
  danger: '#ffffff',
};

// Pill buttons (rounded-full) universally; ghost uses rounded-md.
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 min-h-[36px]',
  md: 'px-5 py-3 min-h-[44px]',
  lg: 'px-6 py-3.5 min-h-[52px]',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;
  const radius = variant === 'ghost' ? 'rounded-md' : 'rounded-full';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${radius} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-40' : ''} ${className ?? ''}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        <>
          {icon}
          <Text className={`text-sm font-medium ${textClasses[variant]} ${icon ? 'ml-2' : ''}`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
