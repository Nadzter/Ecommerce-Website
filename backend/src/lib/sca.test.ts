import { describe, expect, it } from 'vitest';
import type { Env } from '../config/env.js';
import { requiresSca } from './sca.js';

const env = {
  SCA_THRESHOLD_AED: 50_000n,
  SCA_THRESHOLD_GHS: 150_000n,
} as unknown as Env;

describe('requiresSca', () => {
  it('does not require SCA below the AED threshold', () => {
    expect(requiresSca(env, { amountMinor: 49_999n, currency: 'AED' })).toBe(false);
  });

  it('requires SCA at the AED threshold', () => {
    expect(requiresSca(env, { amountMinor: 50_000n, currency: 'AED' })).toBe(true);
  });

  it('requires SCA above the AED threshold', () => {
    expect(requiresSca(env, { amountMinor: 100_000n, currency: 'AED' })).toBe(true);
  });

  it('respects per-currency thresholds (GHS)', () => {
    expect(requiresSca(env, { amountMinor: 149_999n, currency: 'GHS' })).toBe(false);
    expect(requiresSca(env, { amountMinor: 150_000n, currency: 'GHS' })).toBe(true);
  });

  it('fails closed for unknown currencies', () => {
    expect(requiresSca(env, { amountMinor: 1n, currency: 'EUR' })).toBe(true);
  });
});
