/**
 * Helpers for numeric TextInputs bound to react-hook-form number fields.
 * Avoids displaying the literal string "NaN" while typing.
 */

export function formatNumberInput(value: number | null | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return String(value);
}

/**
 * Parse user text into a number for RHF.
 * Empty / incomplete input → NaN (zod will fail with a clear message).
 * Allows intermediate values like "12." by keeping the finite prefix when possible.
 */
export function parseNumberInput(text: string): number {
  const cleaned = text.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '.' || cleaned === '-' || cleaned === '-.') {
    return Number.NaN;
  }
  // Allow trailing decimal while typing (e.g. "12.")
  if (/^-?\d+\.$/.test(cleaned)) {
    const n = Number(cleaned.slice(0, -1));
    return Number.isFinite(n) ? n : Number.NaN;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}
