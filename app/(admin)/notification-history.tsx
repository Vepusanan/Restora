import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { EmptyState } from '@components/ui/EmptyState';
import { useAuth } from '@hooks/useAuth';
import { notificationService } from '@services/notifications.service';
import { colors, spacing } from '@constants/theme';
import type { AppNotification, NotificationHistoryEntry } from '@/types';

export default function NotificationHistoryScreen() {
  const { profile, user, isAdmin } = useAuth();
  const router = useRouter();
  const [mine, setMine] = useState<AppNotification[]>([]);
  const [history, setHistory] = useState<NotificationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubMine = notificationService.subscribeForUser(user.uid, (items) => {
      setMine(items);
      setLoading(false);
    });
    return unsubMine;
  }, [user?.uid]);

  useEffect(() => {
    if (!isAdmin || !profile?.restaurantId) return;
    return notificationService.subscribeHistory(profile.restaurantId, setHistory);
  }, [isAdmin, profile?.restaurantId]);

  return (
    <>
      <Stack.Screen options={{ title: 'Expiry Alerts', headerShown: true }} />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.content}
          data={mine}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Your alerts</Text>
              <Text style={styles.subtitle}>
                Amber and Red expiry notifications for your restaurant devices.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No alerts yet"
              description="When batches enter Amber or Red, alerts appear here and on signed-in devices."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.read && styles.unread]}
              onPress={() => {
                void notificationService.markRead(item.id);
                router.push(`/(admin)/batch/${item.batchId}` as never);
              }}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.meta}>
                {item.status.toUpperCase()} · {item.ingredientName} · {item.expiryDate}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            isAdmin ? (
              <View style={styles.footer}>
                <Text style={styles.title}>Restaurant history</Text>
                {history.length === 0 ? (
                  <Text style={styles.subtitle}>No dispatch history yet.</Text>
                ) : (
                  history.slice(0, 50).map((entry) => (
                    <View key={entry.id} style={styles.card}>
                      <Text style={styles.cardTitle}>
                        {entry.ingredientName} · {entry.status.toUpperCase()}
                      </Text>
                      <Text style={styles.meta}>
                        Sent {entry.successCount}/{entry.recipientCount} · Failed{' '}
                        {entry.failureCount}
                      </Text>
                      <Text style={styles.meta}>{entry.triggeredAt.slice(0, 19).replace('T', ' ')}</Text>
                    </View>
                  ))
                )}
              </View>
            ) : null
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: spacing.md, gap: spacing.xs },
  footer: { marginTop: spacing.xl, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  unread: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textSecondary },
});
