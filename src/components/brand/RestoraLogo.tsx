import { Text, View } from 'react-native';
import { ChefHat } from 'lucide-react-native';

type RestoraLogoProps = {
  size?: 'sm' | 'lg';
  subtitle?: string;
  onDark?: boolean;
};

// The mint tile is a deliberate accent moment; the wordmark stays ink (or
// on-dark when placed on a dark band).
export function RestoraLogo({ size = 'lg', subtitle, onDark = false }: RestoraLogoProps) {
  const isLarge = size === 'lg';
  return (
    <View className="items-center">
      <View
        className={`items-center justify-center rounded-lg bg-mint ${isLarge ? 'h-16 w-16' : 'h-12 w-12'}`}>
        <ChefHat size={isLarge ? 34 : 24} color="#0a0a0a" />
      </View>
      <Text
        className={`mt-4 font-semibold tracking-tight ${onDark ? 'text-on-primary' : 'text-ink'} ${isLarge ? 'text-3xl' : 'text-xl'}`}>
        Restora
      </Text>
      {subtitle ? (
        <Text
          className={`mt-1 text-center text-sm ${onDark ? 'text-on-primary/70' : 'text-steel'}`}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
