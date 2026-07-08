import { Text, View } from 'react-native';

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
};

// Pill-tab selection: active = black pill, inactive = hairline outlined pill.
export function SelectField({ label, value, options, onChange, error }: SelectFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Text
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`rounded-full border px-3.5 py-2 text-sm ${selected ? 'border-primary bg-primary font-medium text-on-primary' : 'border-hairline bg-canvas text-steel'}`}>
              {option.label}
            </Text>
          );
        })}
      </View>
      {error ? <Text className="text-caption text-danger">{error}</Text> : null}
    </View>
  );
}
