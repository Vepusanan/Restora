"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USAGE_CATEGORIES = void 0;
exports.calculateConsumptionCost = calculateConsumptionCost;
exports.isValidUsageCategory = isValidUsageCategory;
exports.roundQty = roundQty;
exports.allocateFifoConsumption = allocateFifoConsumption;
exports.USAGE_CATEGORIES = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Recipe',
    'Manual Adjustment',
    'Kitchen Use',
];
function calculateConsumptionCost(quantityUsed, unitCost) {
    const qty = Number(quantityUsed);
    const cost = Number(unitCost);
    if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) {
        return 0;
    }
    return qty * cost;
}
function isValidUsageCategory(value) {
    return typeof value === 'string' && exports.USAGE_CATEGORIES.includes(value);
}
function roundQty(value) {
    return Math.round(value * 1000) / 1000;
}
function daysUntilExpiry(expiryDate, now) {
    const [y, m, d] = expiryDate.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d)
        return 0;
    const expiry = new Date(y, m - 1, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}
function allocateFifoConsumption(batches, quantityNeeded, options) {
    const needed = Number(quantityNeeded);
    if (!Number.isFinite(needed) || needed <= 0) {
        throw new Error('Quantity must be greater than 0');
    }
    const allowExpired = options?.allowExpired === true;
    const now = options?.now ?? new Date();
    const forcedId = options?.batchId?.trim() || null;
    let candidates = batches.filter((batch) => {
        if (batch.consumed || batch.archived)
            return false;
        if (!Number.isFinite(batch.quantity) || batch.quantity <= 0)
            return false;
        if (!allowExpired && daysUntilExpiry(batch.expiryDate, now) < 0)
            return false;
        return true;
    });
    if (forcedId) {
        candidates = candidates.filter((batch) => batch.id === forcedId);
        if (candidates.length === 0) {
            throw new Error('This batch is not available for consumption.');
        }
    }
    else {
        candidates = candidates
            .slice()
            .sort((a, b) => a.dateReceived.localeCompare(b.dateReceived) ||
            a.createdAt.localeCompare(b.createdAt));
    }
    const available = roundQty(candidates.reduce((sum, batch) => sum + batch.quantity, 0));
    if (needed > available) {
        throw new Error(`Only ${available} remaining across available batches. Cannot use ${needed}.`);
    }
    let remaining = needed;
    const allocations = [];
    for (const batch of candidates) {
        if (remaining <= 0)
            break;
        const take = roundQty(Math.min(batch.quantity, remaining));
        if (take <= 0)
            continue;
        allocations.push({
            batchId: batch.id,
            quantityUsed: take,
            unitCost: Number(batch.unitCost ?? 0),
            remainingAfter: roundQty(batch.quantity - take),
            ingredientName: batch.ingredientName,
            unit: batch.unit,
            dateReceived: batch.dateReceived,
        });
        remaining = roundQty(remaining - take);
    }
    if (remaining > 0) {
        throw new Error('Unable to allocate full quantity from available batches.');
    }
    return allocations;
}
//# sourceMappingURL=types.js.map