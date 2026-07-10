import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors, spacing } from '@constants/theme';
import { fieldBorder } from '@constants/inputStyles';
import { parseDateOnly, toDateOnlyString } from '@utils/expiry';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  error,
  maximumDate,
  minimumDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseDateOnly(value) : new Date();

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) onChange(toDateOnlyString(date));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          open ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value || 'Select date'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={Number.isNaN(selected.getTime()) ? new Date() : selected}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}
      {Platform.OS === 'ios' && open ? (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: fieldBorder.idle,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputFocused: { borderColor: fieldBorder.focused },
  inputError: { borderColor: fieldBorder.error },
  value: { fontSize: 16, color: colors.text },
  placeholder: { fontSize: 16, color: colors.textSecondary },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: 13 },
  done: { alignSelf: 'flex-end', paddingVertical: spacing.sm },
  doneText: { color: colors.forest, fontWeight: '700' },
});
