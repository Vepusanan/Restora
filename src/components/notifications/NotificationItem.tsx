import { Text, View } from 'react-native';
import { Bell, Package, Trash2, UserPlus } from 'lucide-react-native';

import { Badge } from '@/src/components/ui/Badge';
import { formatDateTime } from '@/src/data/mock';
import type { AppNotification } from '@/src/types/restora';

const iconMap = {
  expiry: Package,
  waste: Trash2,
  staff: UserPlus,
  system: Bell,
};

const iconColorMap = {
  expiry: '#c37d0d',
  waste: '#d45656',
  staff: '#00b48a',
  system: '#5a5a5c',
};

type NotificationItemProps = {
  notification: AppNotification;
  onPress?: () => void;
};

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const Icon = iconMap[notification.type];
  const color = iconColorMap[notification.type];

  return (
    <View
      className={`mb-2 flex-row rounded-card border p-4 ${notification.read ? 'border-hairline bg-canvas' : 'border-mint/40 bg-mint/[0.06]'}`}
      onTouchEnd={onPress}>
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1a` }}>
        <Icon size={18} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-sm font-semibold text-ink">{notification.title}</Text>
          {!notification.read ? <Badge label="New" variant="fifo" /> : null}
        </View>
        <Text className="mt-1 text-sm leading-5 text-steel">{notification.body}</Text>
        <Text className="mt-2 text-caption text-stone">{formatDateTime(notification.createdAt)}</Text>
      </View>
    </View>
  );
}
