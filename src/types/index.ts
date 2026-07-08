export type { AuthUser, SignInPayload, SignUpPayload } from '@/src/types/auth';

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type GeminiMessage = {
  role: 'user' | 'model';
  content: string;
};
