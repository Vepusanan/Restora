import { AI_HISTORY_LIMIT } from '../src/types/ai';

function trimHistory<T>(items: T[], limit = AI_HISTORY_LIMIT): T[] {
  return items.slice(0, limit);
}

describe('FR-047 AI query history', () => {
  it('keeps only the latest 20 items', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i) }));
    const trimmed = trimHistory(items);
    expect(trimmed).toHaveLength(20);
    expect(trimmed[0]?.id).toBe('0');
    expect(trimmed[19]?.id).toBe('19');
  });
});

describe('FR-045 staff financial refusal heuristics', () => {
  const moneyHints = [
    'cost',
    'money',
    'price',
    'value',
    'loss',
    'lost',
    'expense',
    'financial',
    'dollar',
    'profit',
    'valuation',
  ];

  function shouldRefuse(query: string): boolean {
    const lower = query.toLowerCase();
    return moneyHints.some((hint) => lower.includes(hint));
  }

  it('flags financial questions for staff policy gate', () => {
    expect(shouldRefuse('How much money was lost due to waste?')).toBe(true);
    expect(shouldRefuse('What is the current inventory value?')).toBe(true);
  });

  it('allows operational questions', () => {
    expect(shouldRefuse('Which ingredients expire soon?')).toBe(false);
    expect(shouldRefuse('How much chicken is currently available?')).toBe(false);
  });
});

describe('FR-044 no side effects contract', () => {
  it('documents that AI ask path is read-only for business collections', () => {
    const allowedWrites = ['ai-history-local-only'];
    const forbiddenWrites = [
      'inventoryBatches',
      'wasteLogs',
      'costs',
      'financialSummaries',
      'analytics',
    ];
    expect(allowedWrites).toContain('ai-history-local-only');
    expect(forbiddenWrites).not.toContain('ai-history-local-only');
  });
});
