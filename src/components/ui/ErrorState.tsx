import { Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { Button } from '@/src/components/ui/Button';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle size={26} color="#d45656" />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mb-6 text-center text-sm leading-relaxed text-steel">{message}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
