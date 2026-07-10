import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  collection,
} from 'firebase/firestore';
import { getFirebaseAuth } from './firebase/auth';
import { getDb } from './firebase/firestore';
import { storageService } from './storage.service';
import { restaurantService } from './restaurant.service';
import { COLLECTIONS } from '@constants/auth';
import { generateRestaurantCode } from '@utils/restaurantCode';
import { createServiceError, toServiceError } from '@utils/errors';
import type { AuthUser } from '@/types';

function mapUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

async function allocateRestaurantCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateRestaurantCode();
    const snap = await getDoc(doc(getDb(), COLLECTIONS.restaurantCodes, code));
    if (!snap.exists()) return code;
  }
  throw createServiceError(
    'restora/code-generation-failed',
    'Unable to generate a unique restaurant code. Try again.',
  );
}

export type AdminRegisterInput = {
  email: string;
  password: string;
  displayName: string;
  restaurantName: string;
  avatarId?: string | null;
  localPhotoUri?: string | null;
};

export type StaffRegisterInput = {
  email: string;
  password: string;
  displayName: string;
  restaurantCode: string;
  avatarId?: string | null;
  localPhotoUri?: string | null;
};

export type AdminRegisterResult = {
  authUser: AuthUser;
  restaurantCode: string;
  restaurantId: string;
};

export const authService = {
  mapUser,

  subscribe(callback: (user: AuthUser | null) => void): Unsubscribe {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      callback(user ? mapUser(user) : null);
    });
  },

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      return mapUser(result.user);
    } catch (error) {
      throw toServiceError(error, 'Unable to sign in');
    }
  },

  async registerAdmin(input: AdminRegisterInput): Promise<AdminRegisterResult> {
    let createdUser: User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        input.email,
        input.password,
      );
      createdUser = credential.user;

      await updateProfile(createdUser, { displayName: input.displayName });

      let photoURL: string | null = null;
      if (input.localPhotoUri) {
        try {
          photoURL = await storageService.uploadAvatar(createdUser.uid, input.localPhotoUri);
          await updateProfile(createdUser, { photoURL });
        } catch (uploadError) {
          console.warn('Avatar upload skipped', uploadError);
        }
      }

      const restaurantCode = await allocateRestaurantCode();
      const restaurantRef = doc(collection(getDb(), COLLECTIONS.restaurants));
      const batch = writeBatch(getDb());

      batch.set(restaurantRef, {
        name: input.restaurantName.trim(),
        code: restaurantCode,
        ownerId: createdUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(getDb(), COLLECTIONS.restaurantCodes, restaurantCode), {
        restaurantId: restaurantRef.id,
        code: restaurantCode,
        name: input.restaurantName.trim(),
        ownerId: createdUser.uid,
        createdAt: serverTimestamp(),
      });

      batch.set(doc(getDb(), COLLECTIONS.users, createdUser.uid), {
        uid: createdUser.uid,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        role: 'admin',
        status: 'approved',
        restaurantId: restaurantRef.id,
        restaurantName: input.restaurantName.trim(),
        restaurantCode,
        avatarId: input.avatarId ?? null,
        photoURL,
        fcmToken: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();

      return {
        authUser: mapUser(createdUser),
        restaurantCode,
        restaurantId: restaurantRef.id,
      };
    } catch (error) {
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch {
          // Best-effort cleanup if Firestore write failed after Auth create
        }
      }
      throw toServiceError(error, 'Unable to create admin account');
    }
  },

  async registerStaff(input: StaffRegisterInput): Promise<AuthUser> {
    // Validate restaurant code BEFORE creating any Auth account (FR-002).
    const restaurant = await restaurantService.requireByCode(input.restaurantCode);

    let createdUser: User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        input.email,
        input.password,
      );
      createdUser = credential.user;

      await updateProfile(createdUser, { displayName: input.displayName });

      let photoURL: string | null = null;
      if (input.localPhotoUri) {
        try {
          photoURL = await storageService.uploadAvatar(createdUser.uid, input.localPhotoUri);
          await updateProfile(createdUser, { photoURL });
        } catch (uploadError) {
          console.warn('Avatar upload skipped', uploadError);
        }
      }

      await setDoc(doc(getDb(), COLLECTIONS.users, createdUser.uid), {
        uid: createdUser.uid,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        role: 'staff',
        status: 'pending',
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantCode: restaurant.code,
        avatarId: input.avatarId ?? null,
        photoURL,
        fcmToken: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return mapUser(createdUser);
    } catch (error) {
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch {
          // Best-effort cleanup
        }
      }
      throw toServiceError(error, 'Unable to create staff account');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (error) {
      throw toServiceError(error, 'Unable to send reset email');
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(getFirebaseAuth());
    } catch (error) {
      throw toServiceError(error, 'Unable to sign out');
    }
  },

  /** Force-refresh ID token; throws when session was revoked (e.g. deactivation). */
  async refreshSession(): Promise<void> {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    try {
      await user.getIdToken(true);
    } catch (error) {
      throw toServiceError(error, 'Session expired. Please sign in again.');
    }
  },
};
