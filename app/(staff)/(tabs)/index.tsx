import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HeroHeader, MetricHero } from '@components/chrome/HeroHeader';
import { QuickAction } from '@components/dashboard/MetricCard';
import { Button } from '@components/ui/Button';
import { Icon } from '@components/ui/Icon';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { useInventory } from '@hooks/useInventory';
import { useUnreadNotificationCount } from '@hooks/useUnreadNotificationCount';
import { daysUntilExpiry, getExpiryLabel, getExpiryTone } from '@utils/expiry';
import { colors, radius, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';

export default function StaffHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const inventory = useInventory(profile?.restaurantId);
  const unread = useUnreadNotificationCount();
  const [refreshing, setRefreshing] = useState(false);

  const attention = useMemo(() => {
    const items = inventory.batches
      .filter((batch) => !batch.consumed && !batch.archived)
      .map((batch) => {
        const tone = getExpiryTone(batch.expiryDate, inventory.now, inventory.amberDays);
        return { batch, tone, days: daysUntilExpiry(batch.expiryDate, inventory.now) };
      })
      .filter((item) => item.tone === 'amber' || item.tone === 'red')
      .sort((a, b) => a.days - b.days);

    return {
      count: items.length,
      top: items.slice(0, 5),
    };
  }, [inventory.batches, inventory.now, inventory.amberDays]);

  if (!profile) return <LoadingState />;

  return (
    <View style={styles.root}>
      <HeroHeader
        greeting={`Hello, ${profile.displayName?.split(' ')[0] || 'there'}`}
        subtitle={profile.restaurantName}
        unreadCount={unread}
        onBellPress={() => router.push('/(staff)/(tabs)/inbox')}
        onAvatarPress={() => router.push('/(staff)/(tabs)/settings')}
        displayName={profile.displayName}
        avatarId={profile.avatarId}
        photoURL={profile.photoURL}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              inventory.refreshExpiry();
              setTimeout(() => setRefreshing(false), 600);
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroOverlap}>
          <MetricHero
            label="Needs attention"
            value={String(attention.count)}
            icon="alert-circle-outline"
          >
            <View style={styles.ctaRow}>
              <Button
                title="Log usage"
                icon="restaurant-outline"
                onPress={() => router.push('/(staff)/log-usage')}
                style={styles.ctaFlex}
              />
              <Button
                title="Log waste"
                variant="onDark"
                icon="trash-outline"
                onPress={() => router.push('/(staff)/log-waste')}
                style={styles.ctaFlex}
              />
            </View>
          </MetricHero>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actions}>
          <QuickAction
            label="Add batch"
            icon="add-circle-outline"
            onPress={() => router.push('/(staff)/add-batch')}
          />
          <QuickAction
            label="Log usage"
            icon="restaurant-outline"
            onPress={() => router.push('/(staff)/log-usage')}
          />
          <QuickAction
            label="Usage log"
            icon="list-outline"
            onPress={() => router.push('/(staff)/(tabs)/usage')}
          />
          <QuickAction
            label="Waste log"
            icon="trash-outline"
            onPress={() => router.push('/(staff)/(tabs)/waste')}
          />
          <QuickAction
            label="Inbox"
            icon="mail-outline"
            onPress={() => router.push('/(staff)/(tabs)/inbox')}
          />
          <QuickAction
            label="AI help"
            icon="sparkles-outline"
            onPress={() => router.push('/(staff)/(tabs)/ai')}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Expiring soon</Text>
          <Pressable onPress={() => router.push('/(staff)/(tabs)/inventory')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {attention.top.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="checkmark-circle-outline" size={28} color={colors.success} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySub}>No amber or expired batches right now.</Text>
          </View>
        ) : (
          attention.top.map(({ batch, tone }) => (
            <Pressable
              key={batch.id}
              style={styles.batchRow}
              onPress={() => router.push(`/(staff)/batch/${batch.id}`)}
            >
              <View
                style={[
                  styles.toneDot,
                  { backgroundColor: tone === 'red' ? colors.danger : colors.warning },
                ]}
              />
              <View style={styles.batchCopy}>
                <Text style={styles.batchName}>{batch.ingredientName}</Text>
                <Text style={styles.batchMeta}>
                  {batch.quantity} {batch.unit} · {getExpiryLabel(batch.expiryDate, inventory.now)}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE + spacing.lg,
    gap: spacing.md,
  },
  heroOverlap: { marginTop: -spacing.md },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ctaFlex: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  seeAll: {
    color: colors.forest,
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontWeight: '700', color: colors.text, fontSize: 16 },
  emptySub: { color: colors.textSecondary, textAlign: 'center' },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  batchCopy: { flex: 1 },
  batchName: { fontWeight: '700', color: colors.text, fontSize: 15 },
  batchMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 13 },
});
