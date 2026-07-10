import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Avatar } from '@components/auth/AvatarPicker';
import { Button } from '@components/ui/Button';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { EmptyState } from '@components/ui/EmptyState';
import { StatusBadge } from '@components/ui/StatusBadge';
import { InlineError } from '@components/ui/InlineError';
import { useAuth } from '@hooks/useAuth';
import { staffService } from '@services/staff.service';
import { colors, spacing } from '@constants/theme';
import type { ServiceError, StaffMember, UserStatus } from '@/types';

type DialogState =
  | { type: 'approve' | 'reject' | 'deactivate'; member: StaffMember }
  | null;

export default function StaffManagementScreen() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile?.restaurantId) return;

    setLoading(true);
    const unsubscribe = staffService.subscribeStaff(profile.restaurantId, (next) => {
      setStaff(next);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.restaurantId]);

  const pending = useMemo(
    () => staff.filter((member) => member.status === 'pending'),
    [staff],
  );
  const others = useMemo(
    () => staff.filter((member) => member.status !== 'pending'),
    [staff],
  );

  const runAction = async () => {
    if (!dialog) return;
    setBusy(true);
    setError(null);
    try {
      if (dialog.type === 'deactivate') {
        await staffService.deactivate(dialog.member.uid, {
          restaurantId: profile?.restaurantId ?? '',
          staffName: dialog.member.displayName,
        });
      } else {
        const status: Extract<UserStatus, 'approved' | 'rejected'> =
          dialog.type === 'approve' ? 'approved' : 'rejected';
        await staffService.setStatus(dialog.member.uid, status, {
          restaurantId: profile?.restaurantId ?? '',
          staffName: dialog.member.displayName,
        });
      }
      setDialog(null);
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setBusy(false);
    }
  };

  const renderMember = (member: StaffMember, showActions: boolean) => (
    <View key={member.uid} style={styles.card}>
      <View style={styles.row}>
        <Avatar
          displayName={member.displayName}
          avatarId={member.avatarId}
          photoURL={member.photoURL}
          size={48}
        />
        <View style={styles.meta}>
          <Text style={styles.name}>{member.displayName}</Text>
          <Text style={styles.email}>{member.email}</Text>
          <StatusBadge status={member.status} />
        </View>
      </View>

      {showActions && member.status === 'pending' ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              title="Approve"
              onPress={() => setDialog({ type: 'approve', member })}
            />
          </View>
          <View style={styles.action}>
            <Button
              title="Reject"
              variant="secondary"
              onPress={() => setDialog({ type: 'reject', member })}
            />
          </View>
        </View>
      ) : null}

      {showActions && member.status === 'approved' ? (
        <Button
          title="Deactivate"
          variant="secondary"
          onPress={() => setDialog({ type: 'deactivate', member })}
        />
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Staff Management', headerShown: true }} />
      <View style={styles.container}>
        <InlineError message={error || undefined} />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={[{ key: 'content' }]}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending requests</Text>
                {pending.length === 0 ? (
                  <EmptyState
                    title="No pending staff"
                    description="New staff registrations will appear here for approval."
                  />
                ) : (
                  pending.map((member) => renderMember(member, true))
                )}

                <Text style={[styles.sectionTitle, styles.sectionSpaced]}>All staff</Text>
                {others.length === 0 ? (
                  <EmptyState
                    title="No staff yet"
                    description="Approved, rejected, and deactivated staff will show here."
                  />
                ) : (
                  others.map((member) => renderMember(member, true))
                )}
              </View>
            }
            renderItem={() => null}
          />
        )}
      </View>

      <ConfirmDialog
        visible={dialog?.type === 'approve'}
        title="Approve staff?"
        message={`Approve ${dialog?.member.displayName ?? 'this staff member'}? They will get access immediately.`}
        confirmLabel="Approve"
        loading={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void runAction()}
      />

      <ConfirmDialog
        visible={dialog?.type === 'reject'}
        title="Reject request?"
        message={`Reject ${dialog?.member.displayName ?? 'this staff member'}? They will not be able to access Restora.`}
        confirmLabel="Reject"
        destructive
        loading={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void runAction()}
      />

      <ConfirmDialog
        visible={dialog?.type === 'deactivate'}
        title="Deactivate staff?"
        message={`Deactivate ${dialog?.member.displayName ?? 'this staff member'}? Their sessions will be revoked and access removed.`}
        confirmLabel="Deactivate"
        destructive
        loading={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void runAction()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { gap: spacing.md },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSpaced: { marginTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  meta: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
