import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '@components/ui/Icon';
import { useAuth } from '@hooks/useAuth';
import { colors, radius, spacing, TAB_BAR_CLEARANCE, typography } from '@constants/theme';

type HubItem = {
  title: string;
  subtitle: string;
  icon: IconName;
  href: string;
};

const ITEMS: HubItem[] = [
  {
    title: 'Usage',
    subtitle: 'Kitchen consumption history and log usage',
    icon: 'restaurant-outline',
    href: '/(admin)/(tabs)/usage',
  },
  {
    title: 'Inbox',
    subtitle: 'Expiry alerts and system messages',
    icon: 'mail-outline',
    href: '/(admin)/(tabs)/inbox',
  },
  {
    title: 'Analytics',
    subtitle: 'Trends, waste breakdown, exports',
    icon: 'bar-chart-outline',
    href: '/(admin)/(tabs)/analytics',
  },
  {
    title: 'AI Assistant',
    subtitle: 'Ask about inventory, usage, and waste',
    icon: 'sparkles-outline',
    href: '/(admin)/(tabs)/ai',
  },
  {
    title: 'Cost & expense',
    subtitle: 'Valuation, ingredient cost, waste loss',
    icon: 'cash-outline',
    href: '/(admin)/cost',
  },
  {
    title: 'Staff',
    subtitle: 'Approve, reject, and manage team',
    icon: 'people-outline',
    href: '/(admin)/staff',
  },
  {
    title: 'Audit history',
    subtitle: 'Who changed what, and when',
    icon: 'document-text-outline',
    href: '/(admin)/audit',
  },
  {
    title: 'Settings',
    subtitle: 'Profile, restaurant, notifications',
    icon: 'settings-outline',
    href: '/(admin)/settings',
  },
];

export default function AdminMoreScreen() {
  const router = useRouter();
  const { profile, logout, status } = useAuth();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>{profile?.restaurantName}</Text>

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.href}
            accessibilityRole="button"
            onPress={() => router.push(item.href as never)}
            style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          >
            <View style={styles.iconWrap}>
              <Icon name={item.icon} size={22} color={colors.forest} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.subtitle}</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => void logout()}
        style={({ pressed }) => [styles.signOut, pressed ? styles.pressed : null]}
        disabled={status === 'loading'}
      >
        <Icon name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE + spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.hero, color: colors.text },
  subtitle: { color: colors.textSecondary, marginTop: -spacing.sm },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pressed: { opacity: 0.9 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowSub: { marginTop: 2, fontSize: 13, color: colors.textSecondary },
  signOut: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 16,
  },
});
