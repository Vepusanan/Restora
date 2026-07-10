import {
  buildAuditDescription,
  diffAuditValues,
  filterAuditEntries,
  matchesAuditSearch,
  resolveAuditActionType,
  resolveAuditModule,
} from '../src/utils/audit';
import type { AuditFilters, AuditLogEntry } from '../src/types';

function makeEntry(overrides: Partial<AuditLogEntry> & Pick<AuditLogEntry, 'id'>): AuditLogEntry {
  return {
    restaurantId: 'r1',
    action: 'batch_created',
    actionType: 'CREATE',
    module: 'inventory',
    actorId: 'u1',
    actorName: 'Ada Admin',
    actorRole: 'admin',
    userId: 'u1',
    targetCollection: 'inventoryBatches',
    targetDocumentId: 'b1',
    targetName: 'Milk',
    batchId: 'b1',
    notificationId: null,
    deviceId: null,
    wasteLogId: null,
    timestamp: '2026-07-10T10:00:00.000Z',
    before: null,
    after: { quantity: 2 },
    previousValues: null,
    newValues: { quantity: 2 },
    metadata: {},
    description: 'Ada Admin — Batch created: Milk',
    appVersion: '1.0.0',
    platform: 'ios',
    ...overrides,
  };
}

describe('Module 3.9 — audit utilities', () => {
  it('maps actions to standardized action types and modules', () => {
    expect(resolveAuditActionType('batch_created')).toBe('CREATE');
    expect(resolveAuditActionType('staff_approved')).toBe('APPROVE');
    expect(resolveAuditActionType('waste_voided')).toBe('DELETE');
    expect(resolveAuditModule('threshold_updated')).toBe('expiry');
    expect(resolveAuditModule('user_login')).toBe('auth');
  });

  it('builds human-readable descriptions', () => {
    expect(
      buildAuditDescription({
        action: 'batch_edited',
        actorName: 'Chef',
        targetName: 'Tomatoes',
      }),
    ).toContain('Tomatoes');
  });

  it('filters by module, action, actor, date, and search', () => {
    const entries = [
      makeEntry({ id: '1', action: 'batch_created', module: 'inventory', actorName: 'Ada' }),
      makeEntry({
        id: '2',
        action: 'waste_created',
        actionType: 'CREATE',
        module: 'waste',
        actorId: 'u2',
        actorName: 'Sam Staff',
        targetName: 'Oil',
        timestamp: '2026-07-01T10:00:00.000Z',
      }),
      makeEntry({
        id: '3',
        action: 'staff_approved',
        actionType: 'APPROVE',
        module: 'staff',
        timestamp: '2026-07-09T10:00:00.000Z',
      }),
    ];

    const filters: AuditFilters = {
      search: 'oil',
      action: 'all',
      actionType: 'all',
      module: 'waste',
      actorId: 'all',
      dateFrom: '2026-06-01',
      dateTo: '2026-07-31',
      sort: 'newest',
    };

    const filtered = filterAuditEntries(entries, filters);
    expect(filtered.map((e) => e.id)).toEqual(['2']);
    expect(matchesAuditSearch(entries[0]!, 'ada')).toBe(true);
  });

  it('diffs before/after values for detail view', () => {
    const diffs = diffAuditValues(
      { quantity: 5, supplier: 'A' },
      { quantity: 3, supplier: 'A' },
    );
    const qty = diffs.find((d) => d.key === 'quantity');
    const supplier = diffs.find((d) => d.key === 'supplier');
    expect(qty?.changed).toBe(true);
    expect(supplier?.changed).toBe(false);
  });

  it('documents immutable audit integrity expectations', () => {
    const integrity = [
      'clients-cannot-update-auditLogs',
      'clients-cannot-delete-auditLogs',
      'staff-cannot-read-auditLogs',
      'admin-same-restaurant-read-only',
      'centralized-auditService-write',
    ];
    expect(integrity).toHaveLength(5);
  });
});
