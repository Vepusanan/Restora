import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { getExpiryLabel, getExpiryTone } from '@utils/expiry';
import type { ExpiryTone } from '@/types';

const TONE_STYLES: Record<ExpiryTone, { bg: string; fg: string; label: string }> = {
  green: { bg: '#DCFCE7', fg: colors.success, label: 'Fresh' },
  amber: { bg: '#FEF3C7', fg: colors.warning, label: 'Soon' },
  red: { bg: colors.dangerLight, fg: colors.danger, label: 'Expired' },
};

type Props = {
  expiryDate: string;
  now?: Date;
};

export function ExpiryBadge({ expiryDate, now = new Date() }: Props) {
  const tone = getExpiryTone(expiryDate, now);
  const style = TONE_STYLES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>
        {style.label} · {getExpiryLabel(expiryDate, now)}
      </Text>
    </View>
  );
}

export function ExpiryToneChip({
  tone,
  selected,
  onPress,
}: {
  tone: ExpiryTone;
  selected: boolean;
  onPress: () => void;
}) {
  const style = TONE_STYLES[tone];
  return (
    <Text
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? style.bg : colors.surface,
          borderColor: selected ? style.fg : colors.border,
          color: selected ? style.fg : colors.textSecondary,
        },
      ]}
    >
      {style.label}
    </Text>
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
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
});
