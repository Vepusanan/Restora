import { useEffect, useMemo, useState } from 'react';
import { staffService } from '@services/staff.service';
import type { StaffMember } from '@/types';

/** Realtime staff list for admin dashboards (pending approvals, etc.). */
export function useRestaurantStaff(restaurantId: string | undefined) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setStaff([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return staffService.subscribeStaff(restaurantId, (next) => {
      setStaff(next);
      setLoading(false);
    });
  }, [restaurantId]);

  const pendingCount = useMemo(
    () => staff.filter((member) => member.status === 'pending').length,
    [staff],
  );

  return { staff, loading, pendingCount };
}
