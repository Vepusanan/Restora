import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '@constants/theme';

/**
 * Removes the browser’s default orange/blue focus outline on RN Web TextInputs.
 * Pair with an outer field border that changes on focus instead.
 */
export const webTextInputReset = (
  Platform.OS === 'web'
    ? ({
        outlineWidth: 0,
        outlineColor: 'transparent',
      } as unknown as TextStyle)
    : {}
) as TextStyle;

export const fieldBorder = {
  idle: colors.border,
  focused: colors.forest,
  error: colors.danger,
} as const;

export const fieldFocusedStyle: ViewStyle = {
  borderColor: fieldBorder.focused,
};
