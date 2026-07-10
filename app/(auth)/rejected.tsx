import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@components/auth/BrandHeader';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
import { useAccessControl } from '@hooks/useAccessControl';
import { routes } from '@navigation/routes';
import { colors, spacing } from '@constants/theme';

export default function RejectedScreen() {
  const access = useAccessControl();
  const { logout, status } = useAuth();

  if (access.state === 'unauthenticated' || access.state === 'deactivated') {
    return <Redirect href={routes.login} />;
  }

  if (access.state === 'pending') {
    return <Redirect href={routes.pending} />;
  }

  if (access.state === 'authenticated') {
    return (
      <Redirect
        href={access.role === 'admin' ? routes.adminHome : routes.staffInventory}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <BrandHeader subtitle="Registration declined" />
        <Text style={styles.body}>
          An admin rejected your staff registration request. Contact your restaurant manager if
          you believe this was a mistake.
        </Text>
        <Button title="Sign out" onPress={() => void logout()} loading={status === 'loading'} />
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
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
