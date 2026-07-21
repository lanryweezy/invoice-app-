import { describe, it, expect } from 'vitest';
import { numberFormatter } from './formatters';

describe('formatters', () => {
  it('exports a shared Intl.NumberFormat instance', () => {
    expect(numberFormatter).toBeInstanceOf(Intl.NumberFormat);
  });

  it('formats numbers using standard formatting', () => {
    expect(numberFormatter.format(1000)).toBe('1,000');
    expect(numberFormatter.format(1234567.89)).toBe('1,234,567.89');
  });
});
