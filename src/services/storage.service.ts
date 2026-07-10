import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from './firebase/storage';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from '@constants/auth';
import { createServiceError, toServiceError } from '@utils/errors';

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw createServiceError('restora/avatar-read-failed', 'Unable to read the selected image.');
  }
  return response.blob();
}

function assertImageType(contentType: string): void {
  const type = contentType.toLowerCase();
  const allowed = ALLOWED_AVATAR_TYPES.some(
    (item) => type === item || type.startsWith(`${item};`),
  );
  // Some platforms return empty type for local file URIs — allow and default to jpeg.
  if (!type) return;
  if (!allowed && !type.startsWith('image/jpeg') && !type.startsWith('image/png') && !type.startsWith('image/webp')) {
    throw createServiceError(
      'restora/invalid-avatar-type',
      'Profile photo must be JPG, PNG, or WEBP.',
    );
  }
}

export const storageService = {
  /**
   * FR-058 — upload to users/{uid}/avatar.jpg (Storage rules scoped to owner).
   * Also mirrored conceptually as profileImages/{userId}/profile.jpg via same object.
   */
  async uploadAvatar(uid: string, localUri: string): Promise<string> {
    try {
      const blob = await uriToBlob(localUri);
      if (blob.size > MAX_AVATAR_BYTES) {
        throw createServiceError(
          'restora/avatar-too-large',
          'Profile photo must be 5MB or smaller.',
        );
      }

      const contentType = blob.type || 'image/jpeg';
      assertImageType(contentType);

      // Delete previous object best-effort before overwrite.
      try {
        await deleteObject(ref(getFirebaseStorage(), `users/${uid}/avatar.jpg`));
      } catch {
        // ignore missing
      }

      const objectRef = ref(getFirebaseStorage(), `users/${uid}/avatar.jpg`);
      await uploadBytes(objectRef, blob, { contentType });
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
