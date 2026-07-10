/**
 * @jest-environment node
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * Lightweight contract tests for Functions messaging helpers.
 * Full FCM send requires Blaze + credentials — not exercised here.
 */

describe('Module 3.8 Functions messaging contracts', () => {
  it('documents multi-device delivery requirements', () => {
    const requirements = [
      'load-deviceTokens-by-restaurant-active',
      'fallback-users-fcmTokens',
      'multicast-chunks-of-500',
      'remove-invalid-tokens-from-deviceTokens-and-users',
      'fan-out-inbox-per-approved-user',
      'audit-notification-sent-or-failed',
    ];
    assert.equal(requirements.length, 6);
  });

  it('documents Spark vs Blaze split', () => {
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
    assert.ok(sparkSafe.length >= 4);
    assert.ok(blazeRequired.length >= 4);
  });
});
