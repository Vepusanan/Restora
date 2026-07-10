"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const expiry_1 = require("../utils/expiry");
(0, node_test_1.default)('getExpiryTone respects configurable amber threshold', () => {
    const now = new Date(2026, 6, 10);
    strict_1.default.equal((0, expiry_1.getExpiryTone)('2026-07-15', now, 3), 'green');
    strict_1.default.equal((0, expiry_1.getExpiryTone)('2026-07-13', now, 3), 'amber');
    strict_1.default.equal((0, expiry_1.getExpiryTone)('2026-07-15', now, 7), 'amber');
    strict_1.default.equal((0, expiry_1.getExpiryTone)('2026-07-09', now, 3), 'red');
});
(0, node_test_1.default)('isExpiryTransition detects green→amber and amber→red', () => {
    strict_1.default.equal((0, expiry_1.isExpiryTransition)('green', 'amber'), true);
    strict_1.default.equal((0, expiry_1.isExpiryTransition)('amber', 'red'), true);
    strict_1.default.equal((0, expiry_1.isExpiryTransition)('green', 'red'), true);
    strict_1.default.equal((0, expiry_1.isExpiryTransition)('amber', 'amber'), false);
    strict_1.default.equal((0, expiry_1.isExpiryTransition)('red', 'red'), false);
    strict_1.default.equal((0, expiry_1.isExpiryTransition)(null, 'amber'), true);
});
(0, node_test_1.default)('shouldSuppressDuplicate blocks same status within 24h', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    strict_1.default.equal((0, expiry_1.shouldSuppressDuplicate)({
        lastNotifiedTone: 'amber',
        lastNotifiedAt: new Date('2026-07-10T10:00:00Z'),
        nextTone: 'amber',
        now,
    }), true);
    strict_1.default.equal((0, expiry_1.shouldSuppressDuplicate)({
        lastNotifiedTone: 'amber',
        lastNotifiedAt: new Date('2026-07-09T10:00:00Z'),
        nextTone: 'amber',
        now,
    }), false);
    strict_1.default.equal((0, expiry_1.shouldSuppressDuplicate)({
        lastNotifiedTone: 'amber',
        lastNotifiedAt: new Date('2026-07-10T10:00:00Z'),
        nextTone: 'red',
        now,
    }), false);
});
(0, node_test_1.default)('notification copy includes ingredient and timing', () => {
    const amber = (0, expiry_1.buildExpiryNotificationCopy)({
        ingredientName: 'Tomatoes',
        quantity: 20,
        unit: 'kg',
        daysRemaining: 2,
        status: 'amber',
    });
    strict_1.default.match(amber.body, /Tomatoes \(20kg\) will expire in 2 days/);
    const red = (0, expiry_1.buildExpiryNotificationCopy)({
        ingredientName: 'Milk',
        quantity: 5,
        unit: 'L',
        daysRemaining: -1,
        status: 'red',
    });
    strict_1.default.match(red.body, /Milk \(5L\) expired 1 day ago/);
});
(0, node_test_1.default)('clampExpiryThreshold bounds values', () => {
    strict_1.default.equal((0, expiry_1.clampExpiryThreshold)(0), 1);
    strict_1.default.equal((0, expiry_1.clampExpiryThreshold)(99), 30);
    strict_1.default.equal((0, expiry_1.clampExpiryThreshold)(5.9), 5);
});
//# sourceMappingURL=expiry.test.js.map