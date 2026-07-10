"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const types_1 = require("../consumption/types");
(0, node_test_1.default)('calculateConsumptionCost multiplies quantity by unit cost', () => {
    strict_1.default.equal((0, types_1.calculateConsumptionCost)(2.5, 4), 10);
    strict_1.default.equal((0, types_1.calculateConsumptionCost)(3, 1.5), 4.5);
});
(0, node_test_1.default)('calculateConsumptionCost rejects non-positive inputs', () => {
    strict_1.default.equal((0, types_1.calculateConsumptionCost)(0, 5), 0);
    strict_1.default.equal((0, types_1.calculateConsumptionCost)(-1, 5), 0);
    strict_1.default.equal((0, types_1.calculateConsumptionCost)(2, -1), 0);
});
(0, node_test_1.default)('isValidUsageCategory accepts allowed categories only', () => {
    strict_1.default.equal((0, types_1.isValidUsageCategory)('Breakfast'), true);
    strict_1.default.equal((0, types_1.isValidUsageCategory)('Kitchen Use'), true);
    strict_1.default.equal((0, types_1.isValidUsageCategory)('Spoiled'), false);
});
(0, node_test_1.default)('allocateFifoConsumption splits across oldest batches', () => {
    const allocations = (0, types_1.allocateFifoConsumption)([
        {
            id: 'a',
            quantity: 2,
            unitCost: 1,
            ingredientName: 'Tomato',
            unit: 'kg',
            dateReceived: '2026-07-01',
            createdAt: '2026-07-01T00:00:00.000Z',
            consumed: false,
            archived: false,
            expiryDate: '2026-08-01',
        },
        {
            id: 'b',
            quantity: 5,
            unitCost: 1,
            ingredientName: 'Tomato',
            unit: 'kg',
            dateReceived: '2026-07-05',
            createdAt: '2026-07-05T00:00:00.000Z',
            consumed: false,
            archived: false,
            expiryDate: '2026-08-01',
        },
    ], 3);
    strict_1.default.deepEqual(allocations.map((item) => ({ batchId: item.batchId, quantityUsed: item.quantityUsed })), [
        { batchId: 'a', quantityUsed: 2 },
        { batchId: 'b', quantityUsed: 1 },
    ]);
});
(0, node_test_1.default)('allocateFifoConsumption rejects over-allocation', () => {
    strict_1.default.throws(() => (0, types_1.allocateFifoConsumption)([
        {
            id: 'a',
            quantity: 1,
            unitCost: 1,
            ingredientName: 'Tomato',
            unit: 'kg',
            dateReceived: '2026-07-01',
            createdAt: '2026-07-01T00:00:00.000Z',
            consumed: false,
            archived: false,
            expiryDate: '2026-08-01',
        },
    ], 2));
});
//# sourceMappingURL=consumption.test.js.map