import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@constants/theme';

type Props = {
  title?: string;
  subtitle?: string;
  /** Forest block for auth shell (login/register). */
  variant?: 'light' | 'dark';
};

export function BrandHeader({
  title = 'Restora',
  subtitle = 'Restaurant inventory, simplified',
  variant = 'light',
}: Props) {
  const dark = variant === 'dark';

  return (
    <View style={[styles.wrap, dark ? styles.wrapDark : null]}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Restora logo"
          />
        </View>
        <Text style={[styles.brand, dark ? styles.brandDark : null]}>{title}</Text>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, dark ? styles.subtitleDark : null]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  wrapDark: {
    marginBottom: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.forest,
    letterSpacing: -0.5,
  },
  brandDark: {
    color: colors.textOnDark,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginLeft: 64,
    fontSize: 15,
    color: colors.textSecondary,
  },
  subtitleDark: {
    color: 'rgba(255,255,255,0.72)',
    marginLeft: 0,
    marginTop: spacing.md,
  },
});
