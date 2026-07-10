import { Ionicons } from '@expo/vector-icons';
import { colors } from '@constants/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

/** Thin Ionicons wrapper for consistent sizing across the app. */
export function Icon({ name, size = 22, color = colors.text }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}
