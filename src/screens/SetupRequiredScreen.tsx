import { Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@components/auth/BrandHeader';
import { Button } from '@components/ui/Button';
import { colors, spacing } from '@constants/theme';

/**
 * Shown when EXPO_PUBLIC_FIREBASE_* env vars are missing.
 */
export function SetupRequiredScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <BrandHeader subtitle="Configuration required" />
        <Text style={styles.body}>
          Copy `.env.example` to `.env`, add your Firebase web app keys, then restart Expo.
        </Text>
        <Text style={styles.code}>cp .env.example .env</Text>
        <Button
          title="Firebase console"
          variant="secondary"
          onPress={() => Linking.openURL('https://console.firebase.google.com/')}
        />
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
    gap: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  code: {
    fontFamily: 'Courier',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
  },
});
