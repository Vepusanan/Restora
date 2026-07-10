import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { MAX_AVATAR_BYTES } from '@constants/auth';

export async function pickProfileImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload a profile picture.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
    Alert.alert('Image too large', 'Please choose a photo under 5MB.');
    return null;
  }

  return asset.uri;
}
