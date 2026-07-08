import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Copy } from 'lucide-react-native';

import { RestoraLogo } from '@/src/components/brand/RestoraLogo';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { useSession } from '@/src/context/SessionProvider';

export default function AdminRegisterScreen() {
  const router = useRouter();
  const { registerAdmin, error, clearError } = useSession();
  const [restaurantName, setRestaurantName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleRegister() {
    clearError();
    setFormError(null);

    if (!restaurantName || !displayName || !email || !password) {
      setFormError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const code = await registerAdmin({
        email: email.trim(),
        password,
        restaurantName: restaurantName.trim(),
        displayName: displayName.trim(),
      });
      Alert.alert(
        'Restaurant Created',
        `Your restaurant code is:\n\n${code}\n\nShare this with staff for onboarding.`,
        [{ text: 'Go to Dashboard', onPress: () => router.replace('/') }],
      );
    } catch {
      setFormError(error ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-6 py-12" keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Admin Registration" showBack />
        <RestoraLogo size="sm" subtitle="Create your restaurant account" />

        <View className="mt-8 gap-4">
          <Input
            label="Restaurant Name"
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholder="Spice Garden Kitchen"
          />
          <Input
            label="Your Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Manager name"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="admin@restaurant.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Repeat password"
          />
          {formError || error ? (
            <Text className="text-sm text-danger">{formError ?? error}</Text>
          ) : null}
          <Button label="Create Restaurant" onPress={handleRegister} loading={loading} fullWidth />
        </View>

        <View className="mt-6 flex-row items-start gap-2 rounded-md border border-mint/30 bg-mint/[0.06] p-4">
          <Copy size={18} color="#00b48a" />
          <Text className="flex-1 text-sm leading-5 text-ink">
            A unique restaurant code will be generated for staff onboarding after registration.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
