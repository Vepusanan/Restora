import { formatNumberInput, parseNumberInput } from '@utils/numberInput';

describe('numberInput helpers', () => {
  it('hides NaN in the display value', () => {
    expect(formatNumberInput(Number.NaN)).toBe('');
    expect(formatNumberInput(undefined)).toBe('');
    expect(formatNumberInput(0)).toBe('0');
    expect(formatNumberInput(12.5)).toBe('12.5');
  });

  it('parses valid decimals and empty input', () => {
    expect(parseNumberInput('')).toBeNaN();
    expect(parseNumberInput('12')).toBe(12);
    expect(parseNumberInput('12.')).toBe(12);
    expect(parseNumberInput('3.5')).toBe(3.5);
    expect(parseNumberInput('abc')).toBeNaN();
  });
});
