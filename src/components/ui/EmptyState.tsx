import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@constants/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'file-tray-outline',
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={32} color={colors.forest} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" icon="add" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
