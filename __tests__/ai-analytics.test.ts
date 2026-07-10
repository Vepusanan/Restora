import type { AiAnalyticsReport } from '@/types';

function assertAdminOnlyAccess(role: 'admin' | 'staff'): boolean {
  return role === 'admin';
}

function isValidReport(report: AiAnalyticsReport): boolean {
  return (
    Boolean(report.summary?.trim()) &&
    Array.isArray(report.insights) &&
    Array.isArray(report.recommendations) &&
    Boolean(report.restaurantId) &&
    Boolean(report.generatedAt)
  );
}

describe('AI analytics access + report shape', () => {
  it('allows admin and blocks staff', () => {
    expect(assertAdminOnlyAccess('admin')).toBe(true);
    expect(assertAdminOnlyAccess('staff')).toBe(false);
  });

  it('accepts a complete report payload', () => {
    const report: AiAnalyticsReport = {
      restaurantId: 'r1',
      summary: 'Waste is elevated.',
      insights: [
        {
          category: 'Waste',
          severity: 'High',
          title: 'Expiry waste',
          description: 'Most loss is Expired.',
          impact: 'Higher food cost',
          recommendation: 'Tighten FIFO',
        },
      ],
      recommendations: [
        {
          action: 'Reduce tomato orders',
          reason: 'Tomato leads waste loss',
          priority: 'High',
        },
      ],
      model: 'gemini-flash-lite-latest',
      generatedAt: '2026-07-10T12:00:00.000Z',
      dataRange: { startDate: '2026-07-01', endDate: '2026-07-10' },
    };

    expect(isValidReport(report)).toBe(true);
  });

  it('rejects incomplete report payloads', () => {
    expect(
      isValidReport({
        restaurantId: '',
        summary: '',
        insights: [],
        recommendations: [],
        model: '',
        generatedAt: '',
        dataRange: { startDate: '', endDate: '' },
      }),
    ).toBe(false);
  });
});
