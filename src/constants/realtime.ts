/**
 * FR-050 — Real-time data propagation.
 *
 * Inventory, waste, staff, restaurant settings, profile, financial/analytics
 * snapshots, and notifications already use Firestore `onSnapshot` listeners
 * in their dedicated hooks/services. This module documents the contract and
 * provides a single place to verify listener cleanup expectations.
 *
 * Spark-compatible: all of these are client Firestore listeners (no Functions).
 */

export const REALTIME_SYNC_TARGETS = [
  'inventoryBatches',
  'wasteLogs',
  'notifications',
  'users/profile',
  'users/staff',
  'restaurants/settings',
] as const;

export type RealtimeSyncTarget = (typeof REALTIME_SYNC_TARGETS)[number];

/** SLA from FR-050 — listeners should deliver within 5 seconds under normal conditions. */
export const REALTIME_PROPAGATION_SLA_MS = 5_000;
