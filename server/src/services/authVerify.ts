import type { AuthUser } from '../types';
import { serverEnv } from '../config';

type LookupResponse = {
  users?: Array<{ localId?: string; email?: string }>;
  error?: { message?: string };
};

/**
 * Verify Firebase ID token via Identity Toolkit (no service account required).
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<AuthUser> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${serverEnv.firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  const data = (await response.json()) as LookupResponse;
  const user = data.users?.[0];
  if (!response.ok || !user?.localId) {
    throw new Error(data.error?.message || 'Invalid or expired auth token');
  }

  return { uid: user.localId, email: user.email };
}
