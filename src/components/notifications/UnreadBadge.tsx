import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@constants/theme';

type Props = {
  count: number;
  max?: number;
};

/** Tab / header unread counter badge. */
export function UnreadBadge({ count, max = 99 }: Props) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);

  return (
    <View style={styles.badge} accessibilityLabel={`${count} unread notifications`}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
