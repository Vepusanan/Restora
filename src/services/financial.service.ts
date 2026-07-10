import {
  doc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase/firestore';
import { COLLECTIONS } from '@constants/auth';
import { toServiceError } from '@utils/errors';

export type FinancialSummaryDoc = {
  restaurantId: string;
  totalInventoryValue: number;
  totalWasteLoss: number;
  lastUpdated: string | null;
};

/**
 * Admin-only financial summary documents (FR-035).
 * Staff reads are denied by Firestore rules (permission-denied).
 * Live dashboard values are computed from inventory/waste snapshots;
 * this collection is reserved for optional persisted snapshots.
 */
export const financialService = {
  subscribeSummary(
    restaurantId: string,
    callback: (summary: FinancialSummaryDoc | null) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(getDb(), COLLECTIONS.financialSummaries, restaurantId),
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }
        const data = snap.data();
        callback({
          restaurantId: String(data.restaurantId ?? restaurantId),
          totalInventoryValue: Number(data.totalInventoryValue ?? 0),
          totalWasteLoss: Number(data.totalWasteLoss ?? 0),
          lastUpdated: data.lastUpdated ? String(data.lastUpdated) : null,
        });
      },
      (error) => {
        console.error('Financial summary listener error', error);
        callback(null);
      },
    );
  },

  /**
   * Probe admin-only access. Staff callers receive permission-denied from rules.
   */
  async assertAdminFinancialAccess(restaurantId: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        const unsub = onSnapshot(
          doc(getDb(), COLLECTIONS.financialSummaries, restaurantId),
          () => {
            unsub();
            resolve();
          },
          (error) => {
            unsub();
            reject(error);
          },
        );
      });
    } catch (error) {
      throw toServiceError(error, 'Access denied. Admin permission required.');
    }
  },
};
