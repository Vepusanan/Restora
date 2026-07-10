import { formatMoney } from '@utils/financial';
import type { AnalyticsDashboardSnapshot, AnalyticsExportFormat } from '@/types';

function csvEscape(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(',');
}

/** FR-041 — Excel-compatible CSV of the current dashboard view. */
export function buildAnalyticsCsv(snapshot: AnalyticsDashboardSnapshot): string {
  const lines: string[] = [];
  lines.push(csvRow(['Restora Analytics Report']));
  lines.push(csvRow(['Restaurant', snapshot.restaurantName]));
  lines.push(csvRow(['Date Range', `${snapshot.range.startDate} to ${snapshot.range.endDate}`]));
  lines.push(csvRow(['Aggregation', snapshot.period]));
  lines.push(csvRow(['Generated', snapshot.generatedAt]));
  lines.push('');

  lines.push(csvRow(['Summary']));
  lines.push(csvRow(['Current Inventory Value', snapshot.inventoryValue.toFixed(2)]));
  lines.push(csvRow(['Total Waste Cost', snapshot.totalWasteCost.toFixed(2)]));
  lines.push(csvRow(['Total Consumption Cost', snapshot.totalConsumptionCost.toFixed(2)]));
  lines.push(csvRow(['Total Ingredient Cost', snapshot.totalIngredientCost.toFixed(2)]));
  lines.push('');

  lines.push(csvRow(['Waste Cost Trends']));
  lines.push(csvRow(['Period', 'Waste Cost']));
  for (const point of snapshot.wasteTrends) {
    lines.push(csvRow([point.label, point.totalLoss.toFixed(2)]));
  }
  lines.push('');

  lines.push(csvRow(['Consumption Cost Trends']));
  lines.push(csvRow(['Period', 'Consumption Cost', 'Quantity Used']));
  for (const point of snapshot.consumptionTrends) {
    lines.push(csvRow([point.label, point.totalCost.toFixed(2), point.quantityUsed]));
  }
  lines.push('');

  lines.push(csvRow(['Top Wasted Ingredients']));
  lines.push(csvRow(['Rank', 'Ingredient', 'Total Loss', 'Percentage', 'Events']));
  for (const row of snapshot.topWasted) {
    lines.push(
      csvRow([
        row.rank,
        row.ingredientName,
        row.totalLoss.toFixed(2),
        row.percentage.toFixed(2),
        row.eventCount,
      ]),
    );
  }
  lines.push('');

  lines.push(csvRow(['Top Consumed Ingredients']));
  lines.push(csvRow(['Rank', 'Ingredient', 'Total Cost', 'Quantity', 'Unit', 'Events']));
  for (const row of snapshot.topConsumed) {
    lines.push(
      csvRow([
        row.rank,
        row.ingredientName,
        row.totalCost.toFixed(2),
        row.quantityUsed,
        row.unit,
        row.eventCount,
      ]),
    );
  }
  lines.push('');

  lines.push(csvRow(['Consumption by Category']));
  lines.push(csvRow(['Category', 'Total Cost', 'Quantity', 'Events']));
  for (const row of snapshot.consumptionByCategory) {
    lines.push(
      csvRow([row.category, row.totalCost.toFixed(2), row.quantityUsed, row.eventCount]),
    );
  }
  lines.push('');

  lines.push(csvRow(['Inventory Turnover']));
  lines.push(
    csvRow([
      'Ingredient',
      'Consumed',
      'Remaining',
      'Turnover',
      'Frequency',
      'Avg Daily',
      'Unit',
    ]),
  );
  for (const row of snapshot.inventoryTurnover) {
    lines.push(
      csvRow([
        row.ingredientName,
        row.quantityConsumed,
        row.remainingQuantity,
        row.turnoverRatio.toFixed(3),
        row.frequency,
        row.averageDailyConsumption.toFixed(3),
        row.unit,
      ]),
    );
  }
  lines.push('');

  lines.push(csvRow(['Ingredient Cost Breakdown']));
  lines.push(csvRow(['Ingredient', 'Total Cost', 'Percentage', 'Batches', 'Quantity', 'Unit']));
  for (const row of snapshot.ingredientBreakdown) {
    lines.push(
      csvRow([
        row.ingredientName,
        row.totalCost.toFixed(2),
        row.percentage.toFixed(2),
        row.batchCount,
        row.totalQuantity,
        row.unit,
      ]),
    );
  }

  // BOM helps Excel detect UTF-8
  return `\uFEFF${lines.join('\n')}`;
}

/** FR-041 — HTML used by expo-print for a professional PDF report. */
export function buildAnalyticsPdfHtml(snapshot: AnalyticsDashboardSnapshot): string {
  const trendRows = snapshot.wasteTrends
    .map(
      (point) =>
        `<tr><td>${point.label}</td><td style="text-align:right">${formatMoney(point.totalLoss)}</td></tr>`,
    )
    .join('');

  const topRows = snapshot.topWasted
    .map(
      (row) =>
        `<tr><td>${row.rank}</td><td>${row.ingredientName}</td><td style="text-align:right">${formatMoney(row.totalLoss)}</td><td style="text-align:right">${row.percentage.toFixed(1)}%</td></tr>`,
    )
    .join('');

  const costRows = snapshot.ingredientBreakdown
    .map(
      (row) =>
        `<tr><td>${row.ingredientName}</td><td style="text-align:right">${formatMoney(row.totalCost)}</td><td style="text-align:right">${row.percentage.toFixed(1)}%</td></tr>`,
    )
    .join('');

  const maxTrend = Math.max(...snapshot.wasteTrends.map((p) => p.totalLoss), 0);
  const bars = snapshot.wasteTrends
    .map((point) => {
      const width = maxTrend > 0 ? Math.round((point.totalLoss / maxTrend) * 100) : 0;
      return `<div style="margin:6px 0"><div style="font-size:11px;color:#64748B">${point.label} — ${formatMoney(point.totalLoss)}</div><div style="background:#E2E8F0;border-radius:999px;height:8px"><div style="width:${width}%;background:#0F766E;height:8px;border-radius:999px"></div></div></div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Restora Analytics Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0F172A; padding: 32px; }
    h1 { color: #0F766E; margin: 0 0 4px; }
    h2 { margin-top: 28px; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
    .meta { color: #64748B; font-size: 13px; line-height: 1.5; }
    .cards { display: flex; gap: 12px; margin-top: 16px; }
    .card { flex: 1; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; }
    .card .label { font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 700; }
    .card .value { font-size: 20px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border-bottom: 1px solid #E2E8F0; padding: 8px 4px; text-align: left; }
    th { color: #64748B; font-size: 11px; text-transform: uppercase; }
    .footer { margin-top: 32px; font-size: 11px; color: #94A3B8; }
  </style>
</head>
<body>
  <h1>Restora</h1>
  <div class="meta">
    <div><strong>${snapshot.restaurantName}</strong></div>
    <div>Date range: ${snapshot.range.startDate} → ${snapshot.range.endDate}</div>
    <div>Aggregation: ${snapshot.period}</div>
    <div>Generated: ${snapshot.generatedAt.slice(0, 19).replace('T', ' ')}</div>
  </div>

  <div class="cards">
    <div class="card"><div class="label">Inventory Value</div><div class="value">${formatMoney(snapshot.inventoryValue)}</div></div>
    <div class="card"><div class="label">Waste Cost</div><div class="value">${formatMoney(snapshot.totalWasteCost)}</div></div>
    <div class="card"><div class="label">Consumption Cost</div><div class="value">${formatMoney(snapshot.totalConsumptionCost)}</div></div>
    <div class="card"><div class="label">Ingredient Cost</div><div class="value">${formatMoney(snapshot.totalIngredientCost)}</div></div>
  </div>

  <h2>Waste Cost Trends</h2>
  ${bars || '<p class="meta">No waste trends in range.</p>'}
  <table>
    <thead><tr><th>Period</th><th style="text-align:right">Waste Cost</th></tr></thead>
    <tbody>${trendRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
  </table>

  <h2>Top Wasted Ingredients</h2>
  <table>
    <thead><tr><th>#</th><th>Ingredient</th><th style="text-align:right">Loss</th><th style="text-align:right">Share</th></tr></thead>
    <tbody>${topRows || '<tr><td colspan="4">No data</td></tr>'}</tbody>
  </table>

  <h2>Ingredient Cost Breakdown</h2>
  <table>
    <thead><tr><th>Ingredient</th><th style="text-align:right">Cost</th><th style="text-align:right">Share</th></tr></thead>
    <tbody>${costRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
  </table>

  <div class="footer">Restora Analytics · Admin confidential · Do not distribute outside the restaurant.</div>
</body>
</html>`;
}

export type { AnalyticsExportFormat };
