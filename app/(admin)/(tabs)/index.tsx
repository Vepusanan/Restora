import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
import { colors, spacing } from '@constants/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile, logout, status, lastRestaurantCode } = useAuth();
  const code = profile?.restaurantCode || lastRestaurantCode;

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Welcome, {profile?.displayName}</Text>
      <Text style={styles.subtitle}>{profile?.restaurantName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Restaurant code</Text>
        <Text style={styles.code}>{code ?? '—'}</Text>
        <Text style={styles.help}>
          Share this code with staff so they can register. New staff stay pending until you
          approve them.
        </Text>
      </View>

      <Button title="Manage staff" onPress={() => router.push('/(admin)/staff')} />
      <Button title="Cost overview" variant="secondary" onPress={() => router.push('/(admin)/cost')} />
      <Button title="Sign out" variant="ghost" onPress={() => void logout()} loading={status === 'loading'} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  code: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  help: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
