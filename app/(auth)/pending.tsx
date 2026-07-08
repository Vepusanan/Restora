import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Clock, LogOut } from 'lucide-react-native';

import { RestoraLogo } from '@/src/components/brand/RestoraLogo';
import { Button } from '@/src/components/ui/Button';
import { useSession } from '@/src/context/SessionProvider';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { user, logout } = useSession();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <RestoraLogo size="lg" />
      <View className="mt-8 items-center rounded-card border border-warning/25 bg-warning/[0.08] p-6">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-warning/15">
          <Clock size={30} color="#c37d0d" />
        </View>
        <Text className="text-center text-xl font-semibold text-ink">Pending Approval</Text>
        <Text className="mt-3 text-center text-sm leading-6 text-steel">
          Hi {user?.displayName ?? 'there'}, your request to join{' '}
          <Text className="font-semibold text-ink">{user?.restaurantName}</Text> is waiting for admin
          approval. You&apos;ll receive a notification once approved.
        </Text>
        <Text className="mt-4 text-caption text-stone">Restaurant code: {user?.restaurantCode}</Text>
      </View>

      <View className="mt-8 w-full gap-3">
        <Button label="Check Status" variant="secondary" fullWidth onPress={() => router.replace('/')} />
        <Button
          label="Sign Out"
          variant="ghost"
          fullWidth
          icon={<LogOut size={18} color="#5a5a5c" />}
          onPress={handleLogout}
        />
      </View>
    </View>
  );
}
