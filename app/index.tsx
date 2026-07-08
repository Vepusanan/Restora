import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { RestoraLogo } from '@/src/components/brand/RestoraLogo';
import { useSession } from '@/src/context/SessionProvider';

SplashScreen.preventAutoHideAsync();

export default function SplashRoute() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    async function boot() {
      if (isLoading) return;

      await SplashScreen.hideAsync();
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      if (user.approvalStatus === 'pending') {
        router.replace('/(auth)/pending');
        return;
      }

      if (user.role === 'admin') {
        router.replace('/(admin)/(tabs)');
        return;
      }

      router.replace('/(staff)/(tabs)');
    }

    void boot();
  }, [isLoading, user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-primary px-8">
      <RestoraLogo size="lg" subtitle="Operational Intelligence for Restaurants" onDark />
      <ActivityIndicator size="large" color="#00d4a4" style={{ marginTop: 32 }} />
      <Text className="mt-3 text-sm text-on-primary/70">Loading your kitchen...</Text>
    </View>
  );
}
