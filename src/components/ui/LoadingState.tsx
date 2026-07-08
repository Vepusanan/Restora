import { ActivityIndicator, Text, View } from 'react-native';
import { Loader2 } from 'lucide-react-native';

type LoadingStateProps = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  return (
    <View
      className={`items-center justify-center gap-3 ${fullScreen ? 'flex-1 bg-surface' : 'py-12'}`}>
      <ActivityIndicator size="large" color="#0a0a0a" />
      <Text className="text-sm text-steel">{message}</Text>
    </View>
  );
}

export function InlineLoader() {
  return <Loader2 size={18} color="#00d4a4" />;
}
