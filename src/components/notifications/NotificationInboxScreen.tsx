import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@components/ui/EmptyState';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { NotificationCard } from '@components/notifications/NotificationCard';
import { NotificationFilters } from '@components/notifications/NotificationFilters';
import { useNotifications } from '@hooks/useNotifications';
import { useAuth } from '@hooks/useAuth';
import { isNotificationUnread } from '@utils/notifications';
import { colors, spacing } from '@constants/theme';

type Props = {
  role: 'admin' | 'staff';
};

export function NotificationInboxScreen({ role }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const {
    items,
    loading,
    refreshing,
    error,
    filters,
    unreadCount,
    hasMore,
    setTypeFilter,
    setUnreadOnly,
    loadMore,
    refresh,
    markAllRead,
    openNotification,
  } = useNotifications();

  if (loading) {
    return <LoadingState message="Loading notifications…" />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Inbox</Text>
                <Text style={styles.subtitle}>
                  Last 30 days · {unreadCount} unread
                </Text>
              </View>
              {unreadCount > 0 ? (
                <Pressable style={styles.markAll} onPress={() => void markAllRead()}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </Pressable>
              ) : null}
            </View>
            <NotificationFilters
              filters={filters}
              onTypeChange={setTypeFilter}
              onUnreadOnlyChange={setUnreadOnly}
            />
            {error ? <InlineError message={error} /> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No notifications"
            description="Expiry alerts and system messages from the last 30 days appear here."
          />
        }
        renderItem={({ item }) => {
          const unread = user?.uid ? isNotificationUnread(item, user.uid) : false;
          return (
            <NotificationCard
              item={item}
              unread={unread}
              onPress={() => {
                void openNotification(item);
                const detailPath =
                  role === 'admin'
                    ? `/(admin)/notification/${item.id}`
                    : `/(staff)/notification/${item.id}`;
                router.push(detailPath as never);
              }}
            />
          );
        }}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.loadMore} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  markAll: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  loadMore: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadMoreText: { color: colors.primary, fontWeight: '700' },
});
