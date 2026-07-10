import { useState } from 'react';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@components/auth/BrandHeader';
import { AvatarPicker } from '@components/auth/AvatarPicker';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { useAuthStore } from '@store/authStore';
import { adminRegisterSchema, type AdminRegisterFormValues } from '@utils/validators';
import { pickProfileImage } from '@utils/imagePicker';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export default function AdminRegisterScreen() {
  const registerAdmin = useAuthStore((s) => s.registerAdmin);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminRegisterFormValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      restaurantName: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      avatarId: null,
    },
  });

  const avatarId = watch('avatarId') ?? null;

  const onPickPhoto = async () => {
    const uri = await pickProfileImage();
    if (uri) {
      setLocalPhotoUri(uri);
      setValue('avatarId', null);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    clearError();
    try {
      const code = await registerAdmin({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
        restaurantName: values.restaurantName,
        avatarId: values.avatarId ?? null,
        localPhotoUri,
      });
      Alert.alert(
        'Restaurant created',
        `Your restaurant code is ${code}. Share it with staff so they can register.`,
      );
    } catch (err) {
      const serviceError = err as ServiceError;
      if (!serviceError.message) {
        Alert.alert('Registration failed', 'Unable to create admin account.');
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandHeader subtitle="Register your restaurant" />
          <InlineError message={error?.message} />

          <Controller
            control={control}
            name="restaurantName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Restaurant name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                error={errors.restaurantName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Your name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                error={errors.displayName?.message}
              />
            )}
          />

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
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <AvatarPicker
            value={avatarId}
            onChange={(id) => {
              setValue('avatarId', id);
              if (id) setLocalPhotoUri(null);
            }}
            onPickPhoto={onPickPhoto}
            photoLabel={localPhotoUri ? 'Change uploaded photo' : 'Upload profile photo'}
          />

          {localPhotoUri ? (
            <Image source={{ uri: localPhotoUri }} style={styles.preview} />
          ) : null}

          <Button
            title="Create admin account"
            onPress={onSubmit}
            loading={submitting || status === 'loading'}
          />

          <View style={styles.links}>
            <Text style={styles.muted}>
              Already have an account?{' '}
              <Link href="/(auth)/login" style={styles.link}>
                Sign in
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
    paddingBottom: spacing.xl,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.md,
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
  muted: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
