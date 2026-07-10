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
import { useAuthStore } from '@store/authStore';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@utils/validators';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export default function ForgotPasswordScreen() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const status = useAuthStore((s) => s.status);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotPassword(values.email);
      Alert.alert(
        'Check your email',
        'If an account exists for that address, a reset link has been sent.',
      );
    } catch (error) {
      const serviceError = error as ServiceError;
      Alert.alert('Reset failed', serviceError.message);
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandHeader subtitle="Reset your password" />

          <Text style={styles.help}>
            Enter the email associated with your account and we will send a reset link.
          </Text>

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

          <Button title="Send reset link" onPress={onSubmit} loading={status === 'loading'} />

          <View style={styles.links}>
            <Link href="/(auth)/login" style={styles.link}>
              Back to sign in
            </Link>
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
  help: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  links: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
