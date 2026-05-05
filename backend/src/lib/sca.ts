import type { Env } from '../config/env.js';
import type { Money } from './money.js';

/**
 * Strong Customer Authentication threshold check.
 *
 * Per-currency thresholds in `SCA_THRESHOLD_<CCY>` env vars. Below the threshold
 * the low-value exemption applies and the transfer can be auto-authorised by
 * the provider; at or above, the user must complete an SCA redirect.
 *
 * For currencies we don't have a configured threshold for, we fail closed —
 * SCA required.
 */
export function requiresSca(env: Env, money: Money): boolean {
  const threshold = thresholdFor(env, money.currency);
  if (threshold === null) return true;
  return money.amountMinor >= threshold;
}

function thresholdFor(env: Env, currency: string): bigint | null {
  switch (currency) {
    case 'AED':
      return env.SCA_THRESHOLD_AED;
    case 'GHS':
      return env.SCA_THRESHOLD_GHS;
    default:
      return null;
  }
}
