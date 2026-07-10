import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@components/auth/BrandHeader';
import { Avatar } from '@components/auth/AvatarPicker';
import { Button } from '@components/ui/Button';
import { LoadingState } from '@components/ui/LoadingState';
import { useAuth } from '@hooks/useAuth';
import { useAccessControl } from '@hooks/useAccessControl';
import { routes } from '@navigation/routes';
import { colors, spacing } from '@constants/theme';

export default function PendingScreen() {
  const access = useAccessControl();
  const { profile, logout, status } = useAuth();

  if (access.state === 'loading') {
    return <LoadingState message="Checking approval status…" />;
  }

  if (access.state === 'authenticated') {
    return (
      <Redirect
        href={access.role === 'admin' ? routes.adminHome : routes.staffInventory}
      />
    );
  }

  if (access.state === 'rejected') {
    return <Redirect href={routes.rejected} />;
  }

  if (access.state === 'unauthenticated' || access.state === 'deactivated') {
    return <Redirect href={routes.login} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <BrandHeader subtitle="Waiting for approval" />
        {profile ? (
          <View style={styles.card}>
            <Avatar
              displayName={profile.displayName}
              avatarId={profile.avatarId}
              photoURL={profile.photoURL}
              size={64}
            />
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.meta}>{profile.restaurantName}</Text>
            <Text style={styles.code}>Code: {profile.restaurantCode}</Text>
            <Text style={styles.body}>
              Your account is pending admin approval. You will get access automatically once
              approved — no need to sign in again.
            </Text>
          </View>
        ) : null}
        <Button title="Sign out" variant="secondary" onPress={() => void logout()} loading={status === 'loading'} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  code: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  body: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
});
