import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AuditCard } from '@components/audit/AuditCard';
import { AuditFiltersBar } from '@components/audit/AuditFiltersBar';
import { EmptyState } from '@components/ui/EmptyState';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuditLogs } from '@hooks/useAuditLogs';
import { colors, spacing } from '@constants/theme';

export default function AuditHistoryScreen() {
  const router = useRouter();
  const {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    filters,
    hasMore,
    actors,
    updateFilters,
    refresh,
    loadMore,
    isAdmin,
  } = useAuditLogs();

  if (!isAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: 'Audit history', headerShown: true }} />
        <EmptyState title="Admin only" description="Audit history is restricted to restaurant admins." />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Audit history', headerShown: true }} />
        <LoadingState message="Loading audit history…" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Audit history', headerShown: true }} />
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
            <View>
              <Text style={styles.title}>Activity history</Text>
              <Text style={styles.subtitle}>
                Immutable audit trail for inventory, waste, staff, and system events.
              </Text>
              <AuditFiltersBar filters={filters} actors={actors} onChange={updateFilters} />
              {error ? <InlineError message={error} /> : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No audit records"
              description="Mutating operations will appear here automatically."
            />
          }
          renderItem={({ item }) => (
            <AuditCard
              item={item}
              onPress={() => router.push(`/(admin)/audit/${item.id}` as never)}
            />
          )}
          ListFooterComponent={
            hasMore ? (
              <Pressable style={styles.loadMore} onPress={loadMore} disabled={loadingMore}>
                <Text style={styles.loadMoreText}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Text>
              </Pressable>
            ) : null
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginTop: 4,
    lineHeight: 20,
  },
  loadMore: { alignItems: 'center', paddingVertical: spacing.md },
  loadMoreText: { color: colors.primary, fontWeight: '700' },
});
