import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Icon } from '@components/ui/Icon';
import { colors, radius, spacing } from '@constants/theme';
import { fieldBorder, webTextInputReset } from '@constants/inputStyles';
import { parseDateOnly, toDateOnlyString } from '@utils/expiry';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(text: string): boolean {
  if (!DATE_RE.test(text)) return false;
  const parsed = parseDateOnly(text);
  return !Number.isNaN(parsed.getTime()) && toDateOnlyString(parsed) === text;
}

/**
 * Date field with typed YYYY-MM-DD input + calendar picker.
 * Web uses the browser date picker; iOS/Android use DateTimePicker.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  maximumDate,
  minimumDate,
}: Props) {
  const [draft, setDraft] = useState(value || '');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const webInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  // Mount a real HTML date input for web calendar (RN TextInput type=date is unreliable).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'date';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.width = '1px';
    input.style.height = '1px';
    input.tabIndex = -1;
    document.body.appendChild(input);
    webInputRef.current = input;

    const onNativeChange = () => {
      if (input.value && isValidDateOnly(input.value)) {
        onChange(input.value);
        setDraft(input.value);
      }
    };
    input.addEventListener('change', onNativeChange);

    return () => {
      input.removeEventListener('change', onNativeChange);
      input.remove();
      webInputRef.current = null;
    };
  }, [onChange]);

  const commitDraft = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      onChange('');
      setDraft('');
      return;
    }
    if (isValidDateOnly(trimmed)) {
      onChange(trimmed);
      setDraft(trimmed);
      return;
    }
    // Revert invalid typed value
    setDraft(value || '');
  };

  const openCalendar = () => {
    if (Platform.OS === 'web') {
      const input = webInputRef.current;
      if (!input) return;
      input.min = minimumDate ? toDateOnlyString(minimumDate) : '';
      input.max = maximumDate ? toDateOnlyString(maximumDate) : '';
      input.value = isValidDateOnly(value) ? value : toDateOnlyString(new Date());
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        } else {
          input.click();
        }
      } catch {
        input.click();
      }
      return;
    }
    setOpen(true);
  };

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) {
      const next = toDateOnlyString(date);
      onChange(next);
      setDraft(next);
    }
  };

  const selected = value && isValidDateOnly(value) ? parseDateOnly(value) : new Date();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused || open ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={(text) => {
            // Allow free typing; auto-commit when a full valid date is entered.
            setDraft(text);
            if (isValidDateOnly(text.trim())) {
              onChange(text.trim());
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commitDraft(draft);
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.textInput, webTextInputReset]}
          accessibilityLabel={label}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open calendar for ${label}`}
          hitSlop={8}
          onPress={openCalendar}
          style={styles.calendarBtn}
        >
          <Icon name="calendar-outline" size={22} color={colors.forest} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS !== 'web' && open ? (
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: fieldBorder.idle,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    minHeight: 52,
  },
  fieldFocused: { borderColor: fieldBorder.focused },
  fieldError: { borderColor: fieldBorder.error },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeSoft,
  },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: 13 },
  done: { alignSelf: 'flex-end', paddingVertical: spacing.sm },
  doneText: { color: colors.forest, fontWeight: '700' },
});
