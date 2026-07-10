import type { AvatarOption } from '@/types';

export const PREDEFINED_AVATARS: AvatarOption[] = [
  { id: 'chef', label: 'Chef', color: '#0F766E', emoji: '👨‍🍳' },
  { id: 'manager', label: 'Manager', color: '#1D4ED8', emoji: '👔' },
  { id: 'server', label: 'Server', color: '#7C3AED', emoji: '🍽️' },
  { id: 'baker', label: 'Baker', color: '#C2410C', emoji: '🥐' },
  { id: 'barista', label: 'Barista', color: '#B45309', emoji: '☕' },
  { id: 'host', label: 'Host', color: '#BE185D', emoji: '✨' },
];

export function getAvatarById(id: string | null | undefined): AvatarOption | undefined {
  if (!id) return undefined;
  return PREDEFINED_AVATARS.find((avatar) => avatar.id === id);
}
