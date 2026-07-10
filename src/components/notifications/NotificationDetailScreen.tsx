import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@components/ui/EmptyState';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { notificationService } from '@services/notifications.service';
import { isNotificationUnread, notificationTypeLabel } from '@utils/notifications';
import { colors, spacing } from '@constants/theme';
import type { AppNotification } from '@/types';

type Props = {
  role: 'admin' | 'staff';
};

export function NotificationDetailScreen({ role }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !id) return;
    const unsub = notificationService.subscribeForUser(user.uid, (items) => {
      setItem(items.find((n) => n.id === id) ?? null);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid, id]);

  const unread = useMemo(() => {
    if (!item || !user?.uid) return false;
    return isNotificationUnread(item, user.uid);
  }, [item, user?.uid]);

  if (loading) return <LoadingState />;

  if (!item) {
    return (
      <>
        <Stack.Screen options={{ title: 'Notification', headerShown: true }} />
        <EmptyState title="Notification not found" description="It may have expired after 30 days." />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Notification', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.type}>{notificationTypeLabel(item.type)}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <View style={styles.metaBox}>
          <Text style={styles.meta}>Priority: {item.priority}</Text>
          <Text style={styles.meta}>
            Received: {item.createdAt.slice(0, 19).replace('T', ' ')}
          </Text>
          {item.ingredientName ? (
            <Text style={styles.meta}>Ingredient: {item.ingredientName}</Text>
          ) : null}
          {item.expiryDate ? <Text style={styles.meta}>Expiry: {item.expiryDate}</Text> : null}
          {item.status ? <Text style={styles.meta}>Tone: {item.status.toUpperCase()}</Text> : null}
        </View>

        <View style={styles.actions}>
          {unread ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                if (!user?.uid) return;
                void notificationService.markRead(item.id, user.uid, profile?.restaurantId);
              }}
            >
              <Text style={styles.primaryText}>Mark as read</Text>
            </Pressable>
          ) : (
            <Text style={styles.readLabel}>Read</Text>
          )}

          {item.batchId ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                if (user?.uid) {
                  void notificationService.markOpened(
                    item.id,
                    user.uid,
                    profile?.restaurantId,
                  );
                }
                const path =
                  role === 'admin'
                    ? `/(admin)/batch/${item.batchId}`
                    : `/(staff)/batch/${item.batchId}`;
                router.push(path as never);
              }}
            >
              <Text style={styles.secondaryText}>Open batch</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  type: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text, marginTop: spacing.xs },
  metaBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  meta: { fontSize: 14, color: colors.textSecondary },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  readLabel: { color: colors.success, fontWeight: '700', fontSize: 14 },
});
