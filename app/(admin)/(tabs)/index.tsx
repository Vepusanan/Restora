import { useEffect, useMemo, useState } from 'react';
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
import { MetricCard, PeriodPills, QuickAction } from '@components/dashboard/MetricCard';
import { Icon } from '@components/ui/Icon';
import { LoadingState } from '@components/ui/LoadingState';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
import { useFinancialDashboard } from '@hooks/useFinancialDashboard';
import { useInventory } from '@hooks/useInventory';
import { useRestaurantSettings } from '@hooks/useRestaurantSettings';
import { useRestaurantStaff } from '@hooks/useRestaurantStaff';
import { useUnreadNotificationCount } from '@hooks/useUnreadNotificationCount';
import { getExpiryTone } from '@utils/expiry';
import { formatMoney } from '@utils/financial';
import { homePeriodRange, type HomePeriod } from '@utils/homePeriod';
import { colors, radius, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId;
  const unread = useUnreadNotificationCount();
  const inventory = useInventory(restaurantId);
  const finance = useFinancialDashboard(restaurantId);
  const settings = useRestaurantSettings(restaurantId);
  const staff = useRestaurantStaff(restaurantId);
  const [period, setPeriod] = useState<HomePeriod>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const currency = settings.restaurant?.currency ?? 'USD';

  useEffect(() => {
    const range = homePeriodRange(period);
    finance.setWasteRange(range);
    finance.setIngredientRange(range);
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const toneCounts = useMemo(() => {
    let amber = 0;
    let red = 0;
    for (const batch of inventory.batches) {
      if (batch.consumed || batch.archived) continue;
      const tone = getExpiryTone(batch.expiryDate, inventory.now, inventory.amberDays);
      if (tone === 'amber') amber += 1;
      if (tone === 'red') red += 1;
    }
    return { amber, red, attention: amber + red };
  }, [inventory.batches, inventory.now, inventory.amberDays]);

  const onRefresh = () => {
    setRefreshing(true);
    inventory.refreshExpiry();
    setTimeout(() => setRefreshing(false), 600);
  };

  if (!profile) return <LoadingState />;

  return (
    <View style={styles.root}>
      <HeroHeader
        greeting={`Hello, ${profile.displayName?.split(' ')[0] || 'Admin'}`}
        subtitle={profile.restaurantName}
        unreadCount={unread}
        onBellPress={() => router.push('/(admin)/(tabs)/inbox')}
        onAvatarPress={() => router.push('/(admin)/settings')}
        displayName={profile.displayName}
        avatarId={profile.avatarId}
        photoURL={profile.photoURL}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroOverlap}>
          <MetricHero
            label="Inventory value"
            value={formatMoney(finance.valuation.totalValue, currency)}
            icon="wallet-outline"
          >
            <View style={styles.heroMeta}>
              <Icon name="cube-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroMetaText}>
                {finance.valuation.batchCount} active batches
              </Text>
            </View>
          </MetricHero>
        </View>

        <View style={styles.periodRow}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <PeriodPills value={period} onChange={setPeriod} />
        </View>

        <View style={styles.grid}>
          <MetricCard
            label="Expiring soon"
            value={String(toneCounts.amber)}
            icon="time-outline"
            tone={toneCounts.amber > 0 ? 'warning' : 'default'}
            onPress={() => router.push('/(admin)/(tabs)/inventory')}
          />
          <MetricCard
            label="Expired"
            value={String(toneCounts.red)}
            icon="alert-circle-outline"
            tone={toneCounts.red > 0 ? 'danger' : 'default'}
            onPress={() => router.push('/(admin)/(tabs)/inventory')}
          />
          <MetricCard
            label="Waste loss"
            value={formatMoney(finance.wasteLoss.totalLoss, currency)}
            icon="trash-outline"
            onPress={() => router.push('/(admin)/waste-loss')}
            hint={period}
          />
          <MetricCard
            label="Consumption"
            value={formatMoney(finance.consumptionCost.totalCost, currency)}
            icon="restaurant-outline"
            onPress={() => router.push('/(admin)/(tabs)/usage')}
            hint={period}
          />
          <MetricCard
            label="Pending staff"
            value={String(staff.pendingCount)}
            icon="people-outline"
            tone={staff.pendingCount > 0 ? 'warning' : 'success'}
            onPress={() => router.push('/(admin)/staff')}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actions}
        >
          <QuickAction
            label="Add batch"
            icon="add-circle-outline"
            onPress={() => router.push('/(admin)/add-batch')}
          />
          <QuickAction
            label="Log usage"
            icon="restaurant-outline"
            onPress={() => router.push('/(admin)/log-usage')}
          />
          <QuickAction
            label="Log waste"
            icon="trash-outline"
            onPress={() => router.push('/(admin)/log-waste')}
          />
          <QuickAction
            label="Usage history"
            icon="list-outline"
            onPress={() => router.push('/(admin)/(tabs)/usage')}
          />
          <QuickAction
            label="Staff"
            icon="people-outline"
            onPress={() => router.push('/(admin)/staff')}
          />
          <QuickAction
            label="Cost"
            icon="cash-outline"
            onPress={() => router.push('/(admin)/cost')}
          />
          <QuickAction
            label="Analytics"
            icon="bar-chart-outline"
            onPress={() => router.push('/(admin)/(tabs)/analytics')}
          />
          <QuickAction
            label="AI"
            icon="sparkles-outline"
            onPress={() => router.push('/(admin)/(tabs)/ai')}
          />
        </ScrollView>

        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <Icon name="key-outline" size={18} color={colors.forest} />
            <Text style={styles.codeLabel}>Restaurant code</Text>
          </View>
          <Text style={styles.code}>{profile.restaurantCode}</Text>
          <Text style={styles.codeHelp}>
            Share with staff so they can register. New staff stay pending until you approve them.
          </Text>
        </View>

        <Button
          title="Manage staff"
          icon="people-outline"
          onPress={() => router.push('/(admin)/staff')}
        />
        <Button
          title="Audit history"
          variant="secondary"
          icon="document-text-outline"
          onPress={() => router.push('/(admin)/audit')}
        />

        {toneCounts.attention > 0 ? (
          <Pressable
            style={styles.alertBanner}
            onPress={() => router.push('/(admin)/(tabs)/inventory')}
          >
            <Icon name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.alertText}>
              {toneCounts.attention} batch{toneCounts.attention === 1 ? '' : 'es'} need attention
            </Text>
            <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
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
  heroOverlap: {
    marginTop: -spacing.md,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '500',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  actions: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  code: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.forest,
    letterSpacing: 1,
  },
  codeHelp: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  alertText: {
    flex: 1,
    fontWeight: '600',
    color: colors.text,
  },
});
