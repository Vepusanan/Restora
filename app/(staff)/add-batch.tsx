import { useRouter } from 'expo-router';

import { AddBatchForm } from '@/src/components/forms/AddBatchForm';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';

export default function StaffAddBatchScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Add Inventory Batch" subtitle="Record received stock" showBack />
      <AddBatchForm onSuccess={() => router.back()} />
    </Screen>
  );
}
