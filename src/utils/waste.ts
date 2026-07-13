import { WASTE_REASONS } from '@constants/waste';
import { formatMoney } from '@utils/financial';
import type { WasteFilters, WasteLog, WasteSummary } from '@/types';

/** Server-authoritative formula (FR-028). Client may preview only. */
export function calculateCostLoss(quantityWasted: number, unitCost: number): number {
  const qty = Number(quantityWasted);
  const cost = Number(unitCost);
  if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) {
    return 0;
  }
  return qty * cost;
}

export function isValidWasteReason(value: string): value is (typeof WASTE_REASONS)[number] {
  return (WASTE_REASONS as string[]).includes(value);
}

export function filterWasteLogs(logs: WasteLog[], filters: WasteFilters): WasteLog[] {
  const search = filters.search.trim().toLowerCase();

  return logs
    .filter((log) => {
      if (filters.visibility === 'active' && log.voided) return false;
      if (filters.visibility === 'voided' && !log.voided) return false;
      if (filters.wasteReason && log.wasteReason !== filters.wasteReason) return false;
      if (filters.loggedBy && log.loggedBy !== filters.loggedBy) return false;
      if (filters.batchId && log.batchId !== filters.batchId) return false;

      if (filters.dateFrom || filters.dateTo) {
        const day = log.timestamp.slice(0, 10);
        if (filters.dateFrom && day < filters.dateFrom) return false;
        if (filters.dateTo && day > filters.dateTo) return false;
      }

      if (!search) return true;
      return (
        log.ingredientName.toLowerCase().includes(search) ||
        log.wasteReason.toLowerCase().includes(search) ||
        log.loggedByName.toLowerCase().includes(search) ||
        log.batchId.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function summarizeWasteLogs(logs: WasteLog[]): WasteSummary {
  const active = logs.filter((log) => !log.voided);
  return {
    totalEvents: logs.length,
    activeEvents: active.length,
    voidedEvents: logs.length - active.length,
    totalCostLoss: active.reduce((sum, log) => sum + log.costLoss, 0),
    quantityWasted: active.reduce((sum, log) => sum + log.quantityWasted, 0),
  };
}

export function formatCostLoss(
  value: number,
  currency: import('@/types').RestaurantCurrency | string = 'USD',
): string {
  return formatMoney(value, currency);
}
