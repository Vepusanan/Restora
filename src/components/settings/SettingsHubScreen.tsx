import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Avatar } from '@components/auth/AvatarPicker';
import { HeaderBackButton } from '@components/chrome/HeaderBackButton';
import { Button } from '@components/ui/Button';
import { SettingsCard } from '@components/settings/SettingsCard';
import { useAuth } from '@hooks/useAuth';
import { colors, spacing, TAB_BAR_CLEARANCE } from '@constants/theme';

type Props = {
  role: 'admin' | 'staff';
};

export function SettingsHubScreen({ role }: Props) {
  const { profile } = useAuth();
  const router = useRouter();
  const prefix = role === 'admin' ? '/(admin)' : '/(staff)';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          ...(role === 'admin'
            ? { headerLeft: () => <HeaderBackButton /> }
            : null),
        }}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          role === 'staff' ? { paddingBottom: TAB_BAR_CLEARANCE + spacing.lg } : null,
        ]}
      >
        <SettingsCard title="Account">
          <View style={styles.preview}>
            <Avatar
              displayName={profile?.displayName ?? 'User'}
              avatarId={profile?.avatarId}
              photoURL={profile?.photoURL}
              size={56}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.displayName}</Text>
              <Text style={styles.meta}>{profile?.email}</Text>
              <Text style={styles.meta}>{profile?.restaurantName}</Text>
            </View>
          </View>
          <Button
            title="Edit profile"
            icon="person-outline"
            onPress={() => router.push(`${prefix}/profile` as never)}
          />
          <Button
            title="Notification preferences"
            variant="secondary"
            icon="notifications-outline"
            onPress={() => router.push(`${prefix}/notification-settings` as never)}
          />
          {role === 'staff' ? (
            <Button
              title="AI Assistant"
              variant="secondary"
              icon="sparkles-outline"
              onPress={() => router.push('/(staff)/(tabs)/ai' as never)}
            />
          ) : null}
        </SettingsCard>

        {role === 'admin' ? (
          <SettingsCard title="Restaurant">
            <Text style={styles.body}>
              Name, currency, and amber expiry threshold for your restaurant.
            </Text>
            <Button
              title="Restaurant settings"
              variant="secondary"
              icon="storefront-outline"
              onPress={() => router.push('/(admin)/restaurant-settings' as never)}
            />
          </SettingsCard>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  preview: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
