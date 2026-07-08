import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
};

export function Screen({
  children,
  padded = true,
  edges = ['top', 'bottom'],
  className,
  contentContainerClassName,
  ...props
}: ScreenProps & { className?: string; contentContainerClassName?: string }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className={`flex-1 bg-surface-muted ${className ?? ''}`}
      contentContainerStyle={{
        paddingTop: edges.includes('top') ? insets.top + (padded ? 16 : 0) : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom + (padded ? 24 : 0) : 0,
        paddingHorizontal: padded ? 16 : 0,
      }}
      contentContainerClassName={contentContainerClassName}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...props}>
      {children}
    </ScrollView>
  );
}

export function ScreenContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 bg-surface-muted ${className ?? ''}`}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
}
