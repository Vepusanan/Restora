import type {
  FinancialContext,
  InventoryContextItem,
  RestaurantAiContext,
  UserProfile,
  UserRole,
  WasteContextItem,
} from '../types';

function daysUntil(expiryDate: string, now = new Date()): number {
  const [y, m, d] = expiryDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  const expiry = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

type RawBatch = {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  expiryDate: string;
  consumed: boolean;
  archived: boolean;
};

type RawWaste = {
  ingredientName: string;
  quantityWasted: number;
  unit: string;
  wasteReason: string;
  costLoss: number;
  voided: boolean;
  date: string;
};

/**
 * FR-045 — strip financial fields for staff before any Gemini call.
 * Do not rely on prompt instructions alone.
 */
export function filterContextForRole(
  role: UserRole,
  inventory: InventoryContextItem[],
  waste: WasteContextItem[],
  financial: FinancialContext | null,
): { inventory: InventoryContextItem[]; waste: WasteContextItem[]; financial: FinancialContext | null } {
  if (role === 'admin') {
    return { inventory, waste, financial };
  }

  return {
    inventory: inventory.map(({ unitCost: _ignored, ...rest }) => rest),
    waste: waste.map(({ costLoss: _ignored, ...rest }) => rest),
    financial: null,
  };
}

export function buildRestaurantContext(input: {
  profile: UserProfile;
  batches: RawBatch[];
  wasteLogs: RawWaste[];
  now?: Date;
}): RestaurantAiContext {
  const now = input.now ?? new Date();
  const inventory: InventoryContextItem[] = input.batches.map((batch) => {
    let status: InventoryContextItem['status'] = 'active';
    if (batch.archived) status = 'archived';
    else if (batch.consumed) status = 'consumed';
    else if (daysUntil(batch.expiryDate, now) < 0) status = 'expired';

    return {
      ingredientName: batch.ingredientName,
      quantity: batch.quantity,
      unit: batch.unit,
      expiryDate: batch.expiryDate,
      status,
      unitCost: batch.unitCost,
    };
  });

  const activeWaste = input.wasteLogs.filter((log) => !log.voided);
  const waste: WasteContextItem[] = activeWaste.slice(0, 80).map((log) => ({
    ingredientName: log.ingredientName,
    quantityWasted: log.quantityWasted,
    unit: log.unit,
    wasteReason: log.wasteReason,
    date: log.date,
    costLoss: log.costLoss,
  }));

  let inventoryValue = 0;
  for (const batch of input.batches) {
    if (batch.archived || batch.consumed) continue;
    if (daysUntil(batch.expiryDate, now) < 0) continue;
    if (batch.quantity > 0 && batch.unitCost >= 0) {
      inventoryValue += batch.quantity * batch.unitCost;
    }
  }

  const wasteLossTotal = activeWaste.reduce((sum, log) => sum + (log.costLoss || 0), 0);
  const financial: FinancialContext = {
    inventoryValue: Math.round(inventoryValue * 100) / 100,
    wasteLossTotal: Math.round(wasteLossTotal * 100) / 100,
  };

  const filtered = filterContextForRole(input.profile.role, inventory, waste, financial);
  const notes: string[] = [];
  if (input.profile.role === 'staff') {
    notes.push(
      'User is staff. Financial/cost/monetary fields were removed from context. Refuse cost questions.',
    );
  } else {
    notes.push('User is admin. Financial summaries are included.');
  }

  // Keep context compact for token cost.
  const compactInventory = filtered.inventory
    .filter((item) => item.status === 'active' || item.status === 'expired')
    .slice(0, 60);

  return {
    restaurantId: input.profile.restaurantId,
    restaurantName: input.profile.restaurantName,
    role: input.profile.role,
    asOf: now.toISOString(),
    inventory: compactInventory,
    waste: filtered.waste.slice(0, 60),
    financial: filtered.financial,
    notes,
  };
}

export function staffFinancialRefusal(query: string): string | null {
  const lower = query.toLowerCase();
  const moneyHints = [
    'cost',
    'money',
    'price',
    'value',
    'loss',
    'lost',
    'expense',
    'financial',
    'dollar',
    'rs.',
    'rupee',
    'profit',
    'valuation',
  ];
  if (!moneyHints.some((hint) => lower.includes(hint))) return null;
  return (
    'I can help with operational inventory and waste quantities, but cost and financial information ' +
    'is restricted to restaurant admins. Please ask your admin for monetary reports.'
  );
}
