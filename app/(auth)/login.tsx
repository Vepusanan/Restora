import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Shield, Users } from 'lucide-react-native';

import { RestoraLogo } from '@/src/components/brand/RestoraLogo';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useSession } from '@/src/context/SessionProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsDemo, error, clearError } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleLogin() {
    clearError();
    setFormError(null);
    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch {
      setFormError(error ?? 'Unable to sign in. Try demo mode below.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemo(role: 'admin' | 'staff') {
    loginAsDemo(role);
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled">
        <RestoraLogo subtitle="Sign in to manage your restaurant" />

        <View className="mt-10 gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@restaurant.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {formError || error ? (
            <Text className="text-sm text-danger">{formError ?? error}</Text>
          ) : null}
          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth />
        </View>

        <View className="mt-8 gap-3">
          <Text className="text-center text-sm text-steel">Quick demo access</Text>
          <View className="flex-row gap-3">
            <Button
              label="Admin Demo"
              variant="secondary"
              fullWidth
              icon={<Shield size={18} color="#0a0a0a" />}
              onPress={() => handleDemo('admin')}
            />
            <Button
              label="Staff Demo"
              variant="secondary"
              fullWidth
              icon={<Users size={18} color="#0a0a0a" />}
              onPress={() => handleDemo('staff')}
            />
          </View>
        </View>

        <View className="mt-10 items-center gap-2">
          <Text className="text-sm text-steel">New to Restora?</Text>
          <View className="flex-row gap-4">
            <Link href="/(auth)/admin-register" asChild>
              <Pressable>
                <Text className="font-medium text-mint-deep">Register as Admin</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/staff-register" asChild>
              <Pressable>
                <Text className="font-medium text-mint-deep">Join as Staff</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
