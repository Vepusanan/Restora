import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@components/ui/EmptyState';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { auditService } from '@services/audit.service';
import { auditActionLabel, auditModuleLabel, diffAuditValues } from '@utils/audit';
import { colors, spacing } from '@constants/theme';
import type { AuditLogEntry, ServiceError } from '@/types';

export default function AuditDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [item, setItem] = useState<AuditLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isAdmin) {
      setLoading(false);
      return;
    }
    void auditService
      .getById(id)
      .then(setItem)
      .catch((err) => setError((err as ServiceError).message))
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

  const diffs = useMemo(
    () => (item ? diffAuditValues(item.before, item.after) : []),
    [item],
  );

  if (!isAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: 'Audit detail', headerShown: true }} />
        <EmptyState title="Admin only" />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Audit detail', headerShown: true }} />
        <LoadingState />
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Stack.Screen options={{ title: 'Audit detail', headerShown: true }} />
        <EmptyState title="Record not found" description={error ?? undefined} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Audit detail', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {error ? <InlineError message={error} /> : null}
        <Text style={styles.module}>{auditModuleLabel(item.module)}</Text>
        <Text style={styles.title}>{auditActionLabel(item.action)}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.box}>
          <Row label="Timestamp" value={item.timestamp.slice(0, 19).replace('T', ' ')} />
          <Row label="Actor" value={`${item.actorName} (${item.actorRole})`} />
          <Row label="Actor ID" value={item.actorId} />
          <Row label="Action type" value={item.actionType} />
          <Row label="Target" value={`${item.targetCollection}/${item.targetDocumentId || '—'}`} />
          <Row label="Target name" value={item.targetName || '—'} />
          <Row label="Platform" value={item.platform || '—'} />
          <Row label="App version" value={item.appVersion || '—'} />
        </View>

        <Text style={styles.section}>Before / After</Text>
        {diffs.length === 0 ? (
          <Text style={styles.emptyDiff}>No field-level changes recorded.</Text>
        ) : (
          diffs.map((diff) => (
            <View key={diff.key} style={[styles.diffRow, diff.changed && styles.diffChanged]}>
              <Text style={styles.diffKey}>{diff.key}</Text>
              <Text style={styles.diffValue}>Before: {formatValue(diff.before)}</Text>
              <Text style={styles.diffValue}>After: {formatValue(diff.after)}</Text>
            </View>
          ))
        )}

        <Text style={styles.section}>Metadata</Text>
        <View style={styles.box}>
          <Text style={styles.metaJson}>{JSON.stringify(item.metadata ?? {}, null, 2)}</Text>
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  module: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  description: { fontSize: 15, color: colors.text, lineHeight: 22 },
  section: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { gap: 2 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  value: { fontSize: 14, color: colors.text },
  diffRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  diffChanged: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  diffKey: { fontWeight: '800', color: colors.text },
  diffValue: { fontSize: 13, color: colors.textSecondary },
  emptyDiff: { color: colors.textSecondary },
  metaJson: { fontFamily: 'Courier', fontSize: 12, color: colors.text },
});
