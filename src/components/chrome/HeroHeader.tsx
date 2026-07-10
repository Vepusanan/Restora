import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@components/ui/Icon';
import { colors, elevation, radius, spacing } from '@constants/theme';
import { Avatar } from '@components/auth/AvatarPicker';

type Props = {
  greeting: string;
  subtitle?: string;
  onBellPress?: () => void;
  unreadCount?: number;
  onAvatarPress?: () => void;
  displayName?: string;
  avatarId?: string | null;
  photoURL?: string | null;
  rightSlot?: ReactNode;
};

/** Forest hero header used on Home dashboards. */
export function HeroHeader({
  greeting,
  subtitle,
  onBellPress,
  unreadCount = 0,
  onAvatarPress,
  displayName,
  avatarId,
  photoURL,
  rightSlot,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {rightSlot}
          {onBellPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={onBellPress}
              style={styles.iconBtn}
            >
              <Icon name="notifications-outline" size={22} color={colors.textOnDark} />
              {unreadCount > 0 ? (
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          {onAvatarPress ? (
            <Pressable accessibilityRole="button" onPress={onAvatarPress} hitSlop={8}>
              <Avatar
                displayName={displayName ?? greeting}
                avatarId={avatarId}
                photoURL={photoURL}
                size={40}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

type MetricHeroProps = {
  label: string;
  value: string;
  icon?: IconName;
  children?: ReactNode;
};

export function MetricHero({ label, value, icon = 'wallet-outline', children }: MetricHeroProps) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}>
          <Icon name={icon} size={20} color={colors.lime} />
        </View>
        <Text style={styles.heroLabel}>{label}</Text>
      </View>
      <Text style={styles.heroValue}>{value}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.forest,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  greeting: {
    color: colors.textOnDark,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    color: colors.textOnLime,
    fontSize: 9,
    fontWeight: '800',
  },
  heroCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.forestMid,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...elevation.e1,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(200,232,106,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroValue: {
    color: colors.textOnDark,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});
