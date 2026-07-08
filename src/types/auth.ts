import type { User } from 'firebase/auth';

export type AuthUser = User;

export type SignUpPayload = {
  email: string;
  password: string;
  displayName?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};
