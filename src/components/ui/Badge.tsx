import { Text, View } from 'react-native';

import type { ExpiryStatus } from '@/src/types/restora';

type BadgeVariant = ExpiryStatus | 'fifo' | 'default' | 'info' | 'success' | 'warning';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

// Status badges use rounded-full (pill) per the design's badge family.
// Soft tinted background + saturated text keeps the surface flat.
const styles: Record<BadgeVariant, { bg: string; text: string }> = {
  safe: { bg: 'bg-safe/10', text: 'text-safe' },
  expiring: { bg: 'bg-warning/10', text: 'text-warning' },
  expired: { bg: 'bg-danger/10', text: 'text-danger' },
  fifo: { bg: 'bg-mint/15', text: 'text-mint-deep' },
  default: { bg: 'bg-surface', text: 'text-steel' },
  info: { bg: 'bg-tag/15', text: 'text-tag' },
  success: { bg: 'bg-safe/10', text: 'text-safe' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
};

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  const style = styles[variant];
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.bg} ${className ?? ''}`}>
      <Text className={`text-caption font-semibold ${style.text}`}>{label}</Text>
    </View>
  );
}

export function expiryLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'safe':
      return 'Safe';
    case 'expiring':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
  }
}
