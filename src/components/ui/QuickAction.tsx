import { Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';

type QuickActionProps = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  color?: string;
};

export function QuickAction({ label, icon: Icon, onPress, color = '#0a0a0a' }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-card border border-hairline bg-canvas p-4 active:bg-surface">
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}12` }}>
        <Icon size={20} color={color} />
      </View>
      <Text className="flex-1 text-base font-medium text-ink">{label}</Text>
      <ChevronRight size={18} color="#888888" />
    </Pressable>
  );
}

type QuickActionGridProps = {
  children: React.ReactNode;
};

export function QuickActionGrid({ children }: QuickActionGridProps) {
  return <View>{children}</View>;
}
