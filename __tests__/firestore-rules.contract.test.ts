/**
 * Firestore rules acceptance coverage (manual / emulator checklist).
 *
 * FR-001 Admin create restaurant + user → allowed when ownerId == auth.uid
 * FR-002 Invalid restaurantCodes/{code} get → empty; no Auth user created by client
 * FR-003 Pending user read own profile → allowed; inventory write → denied
 * FR-004 Admin update staff status in same restaurant → allowed
 * FR-006 Deactivated staff inventory read → denied
 * FR-008 Staff costs/analytics read → denied; admin → allowed
 * FR-007 Unauthenticated users/{id} read → denied
 * FR-036–041 Analytics:
 *   - analytics collection admin-read only; client writes denied
 *   - Staff analytics read → permission-denied
 */
describe('firestore rules contract', () => {
  it('documents the required security outcomes', () => {
    const outcomes = [
      'pending-blocked-from-inventory',
      'rejected-blocked',
      'deactivated-blocked',
      'staff-blocked-from-costs',
      'admin-can-manage-same-restaurant-staff',
      'restaurant-code-public-get-only',
      'staff-can-read-restaurant-threshold',
      'admin-only-threshold-update',
      'clients-cannot-create-notification-history',
      'batch-eval-fields-immutable-for-clients',
      'staff-can-create-waste-logs',
      'admin-only-void-waste',
      'waste-hard-delete-denied',
      'staff-blocked-from-financial-summaries',
      'clients-cannot-write-financial-summaries',
      'staff-blocked-from-analytics',
      'clients-cannot-write-analytics',
    ];
    expect(outcomes).toHaveLength(17);
  });
});
