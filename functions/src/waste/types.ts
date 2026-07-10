export type WasteReason = 'Expired' | 'Burnt' | 'Prep Waste' | 'Leftovers';

export const WASTE_REASONS: WasteReason[] = [
  'Expired',
  'Burnt',
  'Prep Waste',
  'Leftovers',
];

export function calculateCostLoss(quantityWasted: number, unitCost: number): number {
  const qty = Number(quantityWasted);
  const cost = Number(unitCost);
  if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) {
    return 0;
  }
  return qty * cost;
}

export function isValidWasteReason(value: unknown): value is WasteReason {
  return typeof value === 'string' && (WASTE_REASONS as string[]).includes(value);
}

export function assertWasteQuantity(quantityWasted: number, remaining: number): void {
  if (!Number.isFinite(quantityWasted) || quantityWasted <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (quantityWasted > remaining) {
    throw new Error('Waste quantity exceeds remaining batch quantity');
  }
}
