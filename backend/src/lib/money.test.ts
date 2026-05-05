import { describe, expect, it } from 'vitest';
import { formatMinor, moneyFromJSON, moneyToJSON } from './money.js';

describe('formatMinor', () => {
  it('formats AED with 2 decimal places', () => {
    expect(formatMinor(50_000n, 'AED')).toBe('500.00');
    expect(formatMinor(123n, 'AED')).toBe('1.23');
    expect(formatMinor(1n, 'AED')).toBe('0.01');
    expect(formatMinor(0n, 'AED')).toBe('0.00');
  });

  it('preserves negatives', () => {
    expect(formatMinor(-12_345n, 'AED')).toBe('-123.45');
  });

  it('handles GHS', () => {
    expect(formatMinor(150_000n, 'GHS')).toBe('1500.00');
  });
});

describe('Money JSON round-trip', () => {
  it('serialises bigint to string', () => {
    expect(moneyToJSON({ amountMinor: 12_345n, currency: 'AED' })).toEqual({
      amountMinor: '12345',
      currency: 'AED',
    });
  });

  it('round-trips losslessly', () => {
    const m = { amountMinor: 9_007_199_254_740_993n, currency: 'AED' }; // > Number.MAX_SAFE_INTEGER
    expect(moneyFromJSON(moneyToJSON(m))).toEqual(m);
  });
});
