import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { colors, radius, spacing } from '@constants/theme';
import { fieldBorder, webTextInputReset } from '@constants/inputStyles';
import { Icon, type IconName } from './Icon';

type Props = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: IconName;
};

export function Input({ label, error, leftIcon, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}
      >
        {leftIcon ? (
          <Icon
            name={leftIcon}
            size={18}
            color={focused ? colors.forest : colors.textSecondary}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, webTextInputReset, style]}
          autoCapitalize="none"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: fieldBorder.idle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  fieldFocused: {
    borderColor: fieldBorder.focused,
  },
  fieldError: {
    borderColor: fieldBorder.error,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'transparent',
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 13,
  },
});
