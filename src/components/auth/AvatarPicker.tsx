import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@constants/theme';
import { getAvatarById, PREDEFINED_AVATARS } from '@constants/avatars';

type AvatarProps = {
  displayName: string;
  avatarId?: string | null;
  photoURL?: string | null;
  size?: number;
};

export function Avatar({ displayName, avatarId, photoURL, size = 48 }: AvatarProps) {
  const predefined = getAvatarById(avatarId);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: predefined?.color ?? colors.primaryLight,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.42 }]}>
        {predefined?.emoji ?? (initials || '?')}
      </Text>
    </View>
  );
}

type PickerProps = {
  value: string | null;
  onChange: (avatarId: string | null) => void;
  onPickPhoto?: () => void;
  photoLabel?: string;
};

export function AvatarPicker({
  value,
  onChange,
  onPickPhoto,
  photoLabel = 'Upload photo',
}: PickerProps) {
  return (
    <View style={styles.picker}>
      <Text style={styles.label}>Choose an avatar (optional)</Text>
      <View style={styles.row}>
        {PREDEFINED_AVATARS.map((avatar) => {
          const selected = value === avatar.id;
          return (
            <Pressable
              key={avatar.id}
              onPress={() => onChange(selected ? null : avatar.id)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={[styles.optionCircle, { backgroundColor: avatar.color }]}>
                <Text style={styles.optionEmoji}>{avatar.emoji}</Text>
              </View>
              <Text style={styles.optionLabel}>{avatar.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {onPickPhoto ? (
        <Pressable onPress={onPickPhoto} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>{photoLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontWeight: '700',
    color: colors.text,
  },
  picker: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    width: '30%',
    minWidth: 96,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  photoButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  photoButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
