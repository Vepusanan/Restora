import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';

type Props = {
  title?: string;
  subtitle?: string;
};

export function BrandHeader({
  title = 'Restora',
  subtitle = 'Restaurant inventory, simplified',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
