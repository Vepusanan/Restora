import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRestaurantContext,
  filterContextForRole,
  staffFinancialRefusal,
} from './permissionFilter';

test('staff financial refusal detects money questions', () => {
  assert.ok(staffFinancialRefusal('How much money was lost from waste?'));
  assert.equal(staffFinancialRefusal('Which ingredients expire soon?'), null);
});

test('filterContextForRole strips costs for staff', () => {
  const filtered = filterContextForRole(
    'staff',
    [
      {
        ingredientName: 'Chicken',
        quantity: 10,
        unit: 'kg',
        expiryDate: '2026-07-20',
        status: 'active',
        unitCost: 500,
      },
    ],
    [
      {
        ingredientName: 'Chicken',
        quantityWasted: 1,
        unit: 'kg',
        wasteReason: 'Burnt',
        date: '2026-07-10',
        costLoss: 500,
      },
    ],
    { inventoryValue: 5000, wasteLossTotal: 500 },
  );

  assert.equal(filtered.financial, null);
  assert.equal('unitCost' in filtered.inventory[0]!, false);
  assert.equal('costLoss' in filtered.waste[0]!, false);
});

test('admin context keeps financial summary', () => {
  const context = buildRestaurantContext({
    profile: {
      uid: 'a1',
      role: 'admin',
      status: 'approved',
      restaurantId: 'r1',
      restaurantName: 'Demo',
      displayName: 'Admin',
    },
    batches: [
      {
        ingredientName: 'Tomato',
        quantity: 10,
        unit: 'kg',
        unitCost: 100,
        expiryDate: '2099-01-01',
        consumed: false,
        archived: false,
      },
    ],
    wasteLogs: [
      {
        ingredientName: 'Tomato',
        quantityWasted: 1,
        unit: 'kg',
        wasteReason: 'Expired',
        costLoss: 100,
        voided: false,
        date: '2026-07-01',
      },
    ],
    now: new Date(2026, 6, 10),
  });

  assert.ok(context.financial);
  assert.equal(context.financial?.inventoryValue, 1000);
  assert.equal(context.financial?.wasteLossTotal, 100);
});

test('staff context build removes financial block', () => {
  const context = buildRestaurantContext({
    profile: {
      uid: 's1',
      role: 'staff',
      status: 'approved',
      restaurantId: 'r1',
      restaurantName: 'Demo',
      displayName: 'Staff',
    },
    batches: [
      {
        ingredientName: 'Milk',
        quantity: 5,
        unit: 'L',
        unitCost: 80,
        expiryDate: '2099-01-01',
        consumed: false,
        archived: false,
      },
    ],
    wasteLogs: [],
    now: new Date(2026, 6, 10),
  });

  assert.equal(context.financial, null);
  assert.equal(context.inventory[0] && 'unitCost' in context.inventory[0], false);
});
