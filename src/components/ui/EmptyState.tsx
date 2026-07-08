import { Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';

import { Button } from '@/src/components/ui/Button';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-surface">
        {icon ?? <Inbox size={26} color="#5a5a5c" />}
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mb-6 text-center text-sm leading-relaxed text-steel">{message}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}
