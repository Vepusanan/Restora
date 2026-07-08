import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

// text-input: canvas bg, rounded-md (8px), hairline border.
// Focus signal is a 2px mint border per text-input-focused.
export function Input({
  label,
  error,
  hint,
  containerClassName,
  className,
  onFocus,
  onBlur,
  ...props
}: InputProps & { className?: string }) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-2 border-danger'
    : focused
      ? 'border-2 border-mint'
      : 'border border-hairline';

  return (
    <View className={`gap-1.5 ${containerClassName ?? ''}`}>
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <TextInput
        placeholderTextColor="#a8a8aa"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`min-h-[44px] rounded-md bg-canvas px-4 py-3 text-base text-ink ${borderClass} ${className ?? ''}`}
        {...props}
      />
      {error ? <Text className="text-caption text-danger">{error}</Text> : null}
      {!error && hint ? <Text className="text-caption text-stone">{hint}</Text> : null}
    </View>
  );
}
