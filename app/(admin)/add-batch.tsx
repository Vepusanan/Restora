import { useRouter } from 'expo-router';

import { AddBatchForm } from '@/src/components/forms/AddBatchForm';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';

export default function AddBatchScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Add Inventory Batch" subtitle="FIFO ordering applied automatically" showBack />
      <AddBatchForm showCost onSuccess={() => router.back()} />
    </Screen>
  );
}
