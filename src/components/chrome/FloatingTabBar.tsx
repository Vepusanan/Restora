import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@components/ui/Icon';
import { UnreadBadge } from '@components/notifications/UnreadBadge';
import { colors, elevation, radius, spacing } from '@constants/theme';

export type FabConfig = {
  icon: IconName;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
};

type Props = BottomTabBarProps & {
  fab: FabConfig;
  /** Explicit primary-bar routes (do not rely on href filtering alone). */
  visibleRouteNames: string[];
  /** Route names that show an unread badge (e.g. inbox). */
  badgeRoutes?: Record<string, number>;
};

const ROUTE_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  inventory: { active: 'cube', inactive: 'cube-outline' },
  waste: { active: 'trash', inactive: 'trash-outline' },
  more: { active: 'grid', inactive: 'grid-outline' },
  inbox: { active: 'mail', inactive: 'mail-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

const ROUTE_LABELS: Record<string, string> = {
  index: 'Home',
  inventory: 'Inv',
  waste: 'Waste',
  more: 'More',
  inbox: 'Inbox',
  settings: 'Settings',
};

/**
 * Floating forest pill tab bar with center lime FAB.
 * Active tab uses a fixed-width lime pill (icon + short label) so neighbors never overlap.
 */
export function FloatingTabBar({
  state,
  navigation,
  fab,
  visibleRouteNames,
  badgeRoutes,
}: Props) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = visibleRouteNames
    .map((name) => state.routes.find((route) => route.name === name))
    .filter((route): route is NonNullable<typeof route> => route != null);

  const mid = Math.ceil(visibleRoutes.length / 2);
  const left = visibleRoutes.slice(0, mid);
  const right = visibleRoutes.slice(mid);

  const renderTab = (route: (typeof visibleRoutes)[number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const icons = ROUTE_ICONS[route.name] ?? {
      active: 'ellipse' as IconName,
      inactive: 'ellipse-outline' as IconName,
    };
    const label = ROUTE_LABELS[route.name] ?? route.name;
    const badge = badgeRoutes?.[route.name] ?? 0;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={ROUTE_LABELS[route.name] === 'Inv' ? 'Inventory' : label}
        onPress={onPress}
        style={styles.tab}
        hitSlop={6}
      >
        <View style={[styles.tabInner, focused ? styles.tabActive : null]}>
          <View style={styles.iconWrap}>
            <Icon
              name={focused ? icons.active : icons.inactive}
              size={20}
              color={focused ? colors.textOnLime : 'rgba(255,255,255,0.75)'}
            />
            {badge > 0 ? (
              <View style={styles.badgeAnchor}>
                <UnreadBadge count={badge} />
              </View>
            ) : null}
          </View>
          {focused ? (
            <Text style={styles.tabLabel} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        <View style={styles.side}>{left.map(renderTab)}</View>

        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fab.label}
            onPress={fab.onPress}
            onLongPress={fab.onLongPress}
            style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}
          >
            <Icon name={fab.icon} size={28} color={colors.textOnLime} />
          </Pressable>
        </View>

        <View style={styles.side}>{right.map(renderTab)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forest,
    borderRadius: radius.tabBar,
    paddingHorizontal: 6,
    paddingVertical: 8,
    minHeight: 64,
    ...elevation.e2,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    minWidth: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    maxWidth: 88,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 40,
    minWidth: 40,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  tabActive: {
    backgroundColor: colors.lime,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: colors.textOnLime,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  badgeAnchor: {
    position: 'absolute',
    top: -8,
    right: -10,
  },
  fabSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    zIndex: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.fab,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.mist,
    ...elevation.e2,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: colors.limeDark,
  },
});
