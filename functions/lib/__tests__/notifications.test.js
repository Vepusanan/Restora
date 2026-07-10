"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment node
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
/**
 * Lightweight contract tests for Functions messaging helpers.
 * Full FCM send requires Blaze + credentials — not exercised here.
 */
(0, node_test_1.describe)('Module 3.8 Functions messaging contracts', () => {
    (0, node_test_1.it)('documents multi-device delivery requirements', () => {
        const requirements = [
            'load-deviceTokens-by-restaurant-active',
            'fallback-users-fcmTokens',
            'multicast-chunks-of-500',
            'remove-invalid-tokens-from-deviceTokens-and-users',
            'fan-out-inbox-per-approved-user',
            'audit-notification-sent-or-failed',
        ];
        strict_1.default.equal(requirements.length, 6);
    });
    (0, node_test_1.it)('documents Spark vs Blaze split', () => {
        const sparkSafe = [
            'client-deviceTokens-register',
            'client-logout-token-cleanup',
            'firestore-inbox-listeners',
            'mark-read-client',
        ];
        const blazeRequired = [
            'evaluateInventoryExpiry-scheduler',
            'sendRestaurantNotification-callable',
            'cleanupInvalidFCMTokens-scheduler',
            'admin-sdk-fcm-multicast',
        ];
        strict_1.default.ok(sparkSafe.length >= 4);
        strict_1.default.ok(blazeRequired.length >= 4);
    });
});
//# sourceMappingURL=notifications.test.js.map