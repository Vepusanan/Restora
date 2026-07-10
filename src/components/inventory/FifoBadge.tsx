import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';

export function FifoBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>FIFO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
