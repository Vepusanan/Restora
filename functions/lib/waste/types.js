"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WASTE_REASONS = void 0;
exports.calculateCostLoss = calculateCostLoss;
exports.isValidWasteReason = isValidWasteReason;
exports.assertWasteQuantity = assertWasteQuantity;
exports.WASTE_REASONS = [
    'Expired',
    'Burnt',
    'Prep Waste',
    'Leftovers',
];
function calculateCostLoss(quantityWasted, unitCost) {
    const qty = Number(quantityWasted);
    const cost = Number(unitCost);
    if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) {
        return 0;
    }
    return qty * cost;
}
function isValidWasteReason(value) {
    return typeof value === 'string' && exports.WASTE_REASONS.includes(value);
}
function assertWasteQuantity(quantityWasted, remaining) {
    if (!Number.isFinite(quantityWasted) || quantityWasted <= 0) {
        throw new Error('Quantity must be greater than 0');
    }
    if (quantityWasted > remaining) {
        throw new Error('Waste quantity exceeds remaining batch quantity');
    }
}
//# sourceMappingURL=types.js.map