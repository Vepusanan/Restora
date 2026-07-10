import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@components/auth/BrandHeader';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { useAuthStore } from '@store/authStore';
import { loginSchema, type LoginFormValues } from '@utils/validators';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    try {
      await login(values.email, values.password);
    } catch (err) {
      const serviceError = err as ServiceError;
      if (!serviceError.message) {
        Alert.alert('Sign in failed', 'Unable to sign in. Please try again.');
      }
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandHeader subtitle="Sign in to continue" />
          <InlineError message={error?.message} />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                error={errors.password?.message}
              />
            )}
          />

          <Button title="Sign in" onPress={onSubmit} loading={status === 'loading'} />

          <View style={styles.links}>
            <Link href="/(auth)/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
            <Text style={styles.muted}>
              Restaurant owner?{' '}
              <Link href="/(auth)/admin-register" style={styles.link}>
                Create admin account
              </Link>
            </Text>
            <Text style={styles.muted}>
              Joining a team?{' '}
              <Link href="/(auth)/staff-register" style={styles.link}>
                Staff registration
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  links: {
    marginTop: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
