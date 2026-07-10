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
import { restaurantService } from '@services/restaurant.service';
import { staffRegisterSchema, type StaffRegisterFormValues } from '@utils/validators';
import { pickProfileImage } from '@utils/imagePicker';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export default function StaffRegisterScreen() {
  const registerStaff = useAuthStore((s) => s.registerStaff);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffRegisterFormValues>({
    resolver: zodResolver(staffRegisterSchema),
    defaultValues: {
      restaurantCode: '',
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
    setCodeError(null);

    try {
      // Validate code before Auth account creation (FR-002).
      const restaurant = await restaurantService.findByCode(values.restaurantCode);
      if (!restaurant) {
        setCodeError('Invalid restaurant code. Check with your admin.');
        return;
      }

      await registerStaff({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
        restaurantCode: values.restaurantCode,
        avatarId: values.avatarId ?? null,
        localPhotoUri,
      });
    } catch (err) {
      const serviceError = err as ServiceError;
      if (
        serviceError.code === 'restora/restaurant-not-found' ||
        serviceError.code === 'restora/invalid-restaurant-code'
      ) {
        setCodeError(serviceError.message);
      } else if (!serviceError.message) {
        Alert.alert('Registration failed', 'Unable to create staff account.');
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
          <BrandHeader subtitle="Join your restaurant team" />
          <InlineError message={error?.message || codeError || undefined} />

          <Controller
            control={control}
            name="restaurantCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Restaurant code"
                value={value}
                onChangeText={(text) => {
                  setCodeError(null);
                  onChange(text.toUpperCase());
                }}
                onBlur={onBlur}
                autoCapitalize="characters"
                placeholder="RST-ABC123"
                error={errors.restaurantCode?.message || codeError || undefined}
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
            title="Request access"
            onPress={onSubmit}
            loading={submitting || status === 'loading'}
          />

          <Text style={styles.help}>
            After registering, an admin must approve your account before you can access inventory
            and other modules.
          </Text>

          <View style={styles.links}>
            <Text style={styles.muted}>
              Already registered?{' '}
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
  help: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
