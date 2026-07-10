import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@components/ui/Icon';
import { colors } from '@constants/theme';

type Props = {
  /** Destination for More-hub secondary screens. */
  href?: string;
};

/**
 * Back control for pages opened from the More hub.
 * Always returns to More — never Home — because tab history is unreliable.
 */
export function HeaderBackButton({ href = '/(admin)/(tabs)/more' }: Props) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to More"
      hitSlop={12}
      onPress={() => {
        router.navigate(href as never);
      }}
      style={styles.btn}
    >
      <Icon name="chevron-back" size={26} color={colors.forest} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginLeft: 4,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
