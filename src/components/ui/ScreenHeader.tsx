import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, showBack, rightAction }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="mb-5 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center">
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            className="mr-2 h-9 w-9 items-center justify-center rounded-full border border-hairline bg-canvas active:bg-surface"
            accessibilityLabel="Go back">
            <ChevronLeft size={20} color="#0a0a0a" />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-semibold tracking-tight text-ink">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-sm text-steel">{subtitle}</Text> : null}
        </View>
      </View>
      {rightAction}
    </View>
  );
}
