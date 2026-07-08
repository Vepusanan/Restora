import { TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

// search-pill: surface bg, rounded-md, hairline border, steel text.
export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <View className="mb-4 flex-row items-center rounded-md border border-hairline bg-surface px-3">
      <Search size={18} color="#888888" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        className="ml-2 flex-1 py-2.5 text-sm text-ink"
      />
    </View>
  );
}
