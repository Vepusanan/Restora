import { Pressable, Text, View, type PressableProps } from 'react-native';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onPress?: PressableProps['onPress'];
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
};

// card-base: canvas bg, rounded-lg (12px), 1px hairline border, flat (no shadow).
export function Card({ children, className, onPress, title, subtitle, action }: CardProps) {
  const content = (
    <View className={`rounded-card border border-hairline bg-canvas p-4 ${className ?? ''}`}>
      {(title || action) && (
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            {title ? <Text className="text-base font-semibold text-ink">{title}</Text> : null}
            {subtitle ? <Text className="mt-1 text-caption text-steel">{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return content;
}
