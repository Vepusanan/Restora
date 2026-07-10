import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAiAnalyticsContext } from './analyticsContextBuilder';
import { parseAiAnalyticsResponse } from './aiAnalyticsService';

describe('buildAiAnalyticsContext', () => {
  const now = new Date('2026-07-10T12:00:00.000Z');

  it('aggregates inventory, waste, and cost with restaurant isolation fields', () => {
    const context = buildAiAnalyticsContext({
      restaurantId: 'rest-1',
      restaurantName: 'Demo Kitchen',
      now,
      range: { startDate: '2026-07-01', endDate: '2026-07-10' },
      settings: {
        name: 'Demo Kitchen',
        currency: 'LKR',
        expiryAlertThreshold: 3,
      },
      batches: [
        {
          ingredientName: 'Tomato',
          quantity: 10,
          unit: 'kg',
          unitCost: 2,
          expiryDate: '2026-07-12',
          dateReceived: '2026-07-02',
          consumed: false,
          archived: false,
        },
        {
          ingredientName: 'Milk',
          quantity: 1,
          unit: 'L',
          unitCost: 3,
          expiryDate: '2026-07-01',
          dateReceived: '2026-06-20',
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
          costLoss: 5,
          voided: false,
          date: '2026-07-05',
        },
        {
          ingredientName: 'Tomato',
          quantityWasted: 1,
          unit: 'kg',
          wasteReason: 'Expired',
          costLoss: 5,
          voided: true,
          date: '2026-07-06',
        },
      ],
    });

    assert.equal(context.restaurantId, 'rest-1');
    assert.equal(context.currency, 'LKR');
    assert.equal(context.inventory.activeBatchCount, 1);
    assert.equal(context.inventory.expiredBatchCount, 1);
    assert.equal(context.inventory.valuation, 20);
    assert.equal(context.waste.totalLossInRange, 5);
    assert.equal(context.waste.eventCountInRange, 1);
    assert.equal(context.consumption.totalCostInRange, 0);
    assert.equal(context.cost.ingredientSpendInRange, 20);
    assert.ok(context.inventory.expiringSoon.length >= 1);
  });

  it('aggregates consumption separately from waste', () => {
    const context = buildAiAnalyticsContext({
      restaurantId: 'rest-1',
      restaurantName: 'Demo Kitchen',
      now,
      range: { startDate: '2026-07-01', endDate: '2026-07-10' },
      batches: [],
      wasteLogs: [],
      usageLogs: [
        {
          ingredientName: 'Chicken',
          quantityUsed: 3,
          unit: 'kg',
          category: 'Lunch',
          consumptionCost: 30,
          voided: false,
          date: '2026-07-05',
        },
        {
          ingredientName: 'Chicken',
          quantityUsed: 1,
          unit: 'kg',
          category: 'Dinner',
          consumptionCost: 10,
          voided: true,
          date: '2026-07-06',
        },
      ],
    });

    assert.equal(context.consumption.totalCostInRange, 30);
    assert.equal(context.consumption.eventCountInRange, 1);
    assert.equal(context.consumption.topIngredients[0]?.ingredientName, 'Chicken');
    assert.equal(context.waste.totalLossInRange, 0);
  });

  it('does not invent waste when logs are empty', () => {
    const context = buildAiAnalyticsContext({
      restaurantId: 'rest-2',
      restaurantName: 'Empty',
      now,
      batches: [],
      wasteLogs: [],
    });
    assert.equal(context.waste.totalLossInRange, 0);
    assert.equal(context.waste.topIngredients.length, 0);
    assert.equal(context.consumption.totalCostInRange, 0);
    assert.ok(context.notes.some((note) => note.toLowerCase().includes('little')));
  });
});

describe('parseAiAnalyticsResponse', () => {
  it('accepts valid structured JSON', () => {
    const parsed = parseAiAnalyticsResponse(
      JSON.stringify({
        summary: 'Waste is elevated this month.',
        insights: [
          {
            category: 'Waste',
            severity: 'High',
            title: 'Expiry-driven waste',
            description: 'Most loss is from Expired reason.',
            impact: 'Higher food cost.',
            recommendation: 'Tighten FIFO checks.',
          },
        ],
        recommendations: [
          {
            action: 'Review tomato purchase volume',
            reason: 'Tomato leads waste loss.',
            priority: 'High',
          },
        ],
      }),
    );

    assert.equal(parsed.summary.includes('Waste'), true);
    assert.equal(parsed.insights.length, 1);
    assert.equal(parsed.insights[0]?.category, 'Waste');
    assert.equal(parsed.recommendations[0]?.priority, 'High');
  });

  it('rejects missing summary', () => {
    assert.throws(() => parseAiAnalyticsResponse(JSON.stringify({ insights: [] })));
  });

  it('normalizes unknown severity/category', () => {
    const parsed = parseAiAnalyticsResponse(
      JSON.stringify({
        summary: 'ok',
        insights: [
          {
            category: 'Weird',
            severity: 'Ultra',
            title: 'Title',
            description: 'Desc',
            impact: 'Impact',
            recommendation: 'Do X',
          },
        ],
        recommendations: [],
      }),
    );
    assert.equal(parsed.insights[0]?.category, 'Operations');
    assert.equal(parsed.insights[0]?.severity, 'Medium');
  });
});
