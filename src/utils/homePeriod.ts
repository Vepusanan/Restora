import { toDateOnlyString } from '@utils/expiry';
import type { FinancialDateRange } from '@/types';

export type HomePeriod = '7d' | '30d' | '90d';

/** Build an inclusive date range ending today for home period pills. */
export function homePeriodRange(period: HomePeriod, now = new Date()): FinancialDateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  const days = period === '7d' ? 6 : period === '30d' ? 29 : 89;
  start.setDate(start.getDate() - days);
  return {
    startDate: toDateOnlyString(start),
    endDate: toDateOnlyString(end),
  };
}
