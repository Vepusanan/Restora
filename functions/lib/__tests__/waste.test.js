"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const types_1 = require("../waste/types");
(0, node_test_1.default)('calculateCostLoss multiplies quantity by unit cost', () => {
    strict_1.default.equal((0, types_1.calculateCostLoss)(2.5, 4), 10);
    strict_1.default.equal((0, types_1.calculateCostLoss)(3, 1.5), 4.5);
});
(0, node_test_1.default)('calculateCostLoss rejects non-positive inputs', () => {
    strict_1.default.equal((0, types_1.calculateCostLoss)(0, 5), 0);
    strict_1.default.equal((0, types_1.calculateCostLoss)(-1, 5), 0);
    strict_1.default.equal((0, types_1.calculateCostLoss)(2, -1), 0);
});
(0, node_test_1.default)('assertWasteQuantity enforces remaining stock', () => {
    strict_1.default.doesNotThrow(() => (0, types_1.assertWasteQuantity)(2, 5));
    strict_1.default.throws(() => (0, types_1.assertWasteQuantity)(0, 5));
    strict_1.default.throws(() => (0, types_1.assertWasteQuantity)(6, 5));
});
(0, node_test_1.default)('isValidWasteReason accepts allowed reasons only', () => {
    strict_1.default.equal((0, types_1.isValidWasteReason)('Expired'), true);
    strict_1.default.equal((0, types_1.isValidWasteReason)('Burnt'), true);
    strict_1.default.equal((0, types_1.isValidWasteReason)('Prep Waste'), true);
    strict_1.default.equal((0, types_1.isValidWasteReason)('Leftovers'), true);
    strict_1.default.equal((0, types_1.isValidWasteReason)('Spoiled'), false);
});
//# sourceMappingURL=waste.test.js.map