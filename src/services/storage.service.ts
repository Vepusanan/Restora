import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from './firebase/storage';
import { MAX_AVATAR_BYTES } from '@constants/auth';
import { createServiceError, toServiceError } from '@utils/errors';

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw createServiceError('restora/avatar-read-failed', 'Unable to read the selected image.');
  }
  return response.blob();
}

export const storageService = {
  async uploadAvatar(uid: string, localUri: string): Promise<string> {
    try {
      const blob = await uriToBlob(localUri);
      if (blob.size > MAX_AVATAR_BYTES) {
        throw createServiceError(
          'restora/avatar-too-large',
          'Profile photo must be 5MB or smaller.',
        );
      }

      const objectRef = ref(getFirebaseStorage(), `users/${uid}/avatar.jpg`);
      await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
      return getDownloadURL(objectRef);
    } catch (error) {
      throw toServiceError(error, 'Unable to upload profile photo');
    }
  },

  async deleteAvatar(uid: string): Promise<void> {
    try {
      const objectRef = ref(getFirebaseStorage(), `users/${uid}/avatar.jpg`);
      await deleteObject(objectRef);
    } catch {
      // Ignore missing object
    }
  },
};
