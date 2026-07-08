import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { KeyRound } from 'lucide-react-native';

import { RestoraLogo } from '@/src/components/brand/RestoraLogo';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { useSession } from '@/src/context/SessionProvider';

export default function StaffRegisterScreen() {
  const router = useRouter();
  const { registerStaff, error, clearError } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantCode, setRestaurantCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleRegister() {
    clearError();
    setFormError(null);

    if (!displayName || !email || !password || !restaurantCode) {
      setFormError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerStaff({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        restaurantCode: restaurantCode.trim().toUpperCase(),
      });
      router.replace('/');
    } catch {
      setFormError(error ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-6 py-12" keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Staff Registration" showBack />
        <RestoraLogo size="sm" subtitle="Join your restaurant team" />

        <View className="mt-8 gap-4">
          <Input
            label="Restaurant Code"
            value={restaurantCode}
            onChangeText={setRestaurantCode}
            autoCapitalize="characters"
            placeholder="e.g. SGK-7X2M"
            hint="Ask your manager for the restaurant code"
          />
          <Input
            label="Your Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Full name"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@email.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min. 8 characters"
          />
          {formError || error ? (
            <Text className="text-sm text-danger">{formError ?? error}</Text>
          ) : null}
          <Button label="Request Access" onPress={handleRegister} loading={loading} fullWidth />
        </View>

        <View className="mt-6 flex-row items-start gap-2 rounded-md border border-warning/25 bg-warning/[0.08] p-4">
          <KeyRound size={18} color="#c37d0d" />
          <Text className="flex-1 text-sm leading-5 text-ink">
            Your account requires admin approval before you can access the restaurant dashboard.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
