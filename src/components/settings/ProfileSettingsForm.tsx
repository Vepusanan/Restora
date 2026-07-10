import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Avatar, AvatarPicker } from '@components/auth/AvatarPicker';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { InlineError } from '@components/ui/InlineError';
import { LoadingState } from '@components/ui/LoadingState';
import { SettingsCard } from '@components/settings/SettingsCard';
import { useAuth } from '@hooks/useAuth';
import { userService } from '@services/user.service';
import { pickProfileImage } from '@utils/imagePicker';
import {
  validateDisplayName,
  validatePhoneNumber,
} from '@utils/settings';
import { colors, spacing } from '@constants/theme';
import type { ServiceError } from '@/types';

export function ProfileSettingsForm() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setPhoneNumber(profile.phoneNumber ?? '');
    setAvatarId(profile.avatarId);
    setLocalPhotoUri(null);
    setClearPhoto(false);
  }, [profile]);

  if (!profile || !user) {
    return <LoadingState message="Loading profile…" />;
  }

  const previewPhoto = clearPhoto
    ? null
    : localPhotoUri || profile.photoURL;

  const onSave = async () => {
    const nextNameError = validateDisplayName(displayName);
    const nextPhoneError = validatePhoneNumber(phoneNumber);
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    if (nextNameError || nextPhoneError) return;

    setSaving(true);
    setError(null);
    try {
      await userService.updateProfile(user.uid, {
        displayName,
        phoneNumber,
        avatarId: localPhotoUri ? null : avatarId,
        localPhotoUri,
        clearPhoto,
      });
      setLocalPhotoUri(null);
      setClearPhoto(false);
      Alert.alert('Profile saved', 'Your profile was updated.');
    } catch (err) {
      setError((err as ServiceError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingsCard title="Profile">
        <View style={styles.preview}>
          <Avatar
            displayName={displayName || profile.displayName}
            avatarId={previewPhoto ? null : avatarId}
            photoURL={previewPhoto}
            size={72}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.role}>{profile.role.toUpperCase()}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.meta}>{profile.restaurantName}</Text>
          </View>
        </View>

        <InlineError message={error || undefined} />

        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          error={nameError || undefined}
          autoCapitalize="words"
        />
        <Input
          label="Phone number (optional)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          error={phoneError || undefined}
          keyboardType="phone-pad"
        />
        <Input
          label="Email (read-only)"
          value={profile.email}
          onChangeText={() => undefined}
          editable={false}
        />

        <AvatarPicker
          value={avatarId}
          onChange={(next) => {
            setAvatarId(next);
            setLocalPhotoUri(null);
            setClearPhoto(false);
          }}
          photoLabel="Upload new photo"
          onPickPhoto={() => {
            void pickProfileImage().then((uri) => {
              if (!uri) return;
              setLocalPhotoUri(uri);
              setAvatarId(null);
              setClearPhoto(false);
            });
          }}
        />

        {(profile.photoURL || localPhotoUri) && !clearPhoto ? (
          <Pressable
            onPress={() => {
              setClearPhoto(true);
              setLocalPhotoUri(null);
            }}
          >
            <Text style={styles.removePhoto}>Remove profile photo</Text>
          </Pressable>
        ) : null}

        <Button title="Save profile" onPress={() => void onSave()} loading={saving} />
      </SettingsCard>
    </ScrollView>
  );
}

export default function ProfileSettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Profile', headerShown: true }} />
      <ProfileSettingsForm />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  preview: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  role: { fontSize: 12, fontWeight: '800', color: colors.primary },
  email: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
  removePhoto: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});
