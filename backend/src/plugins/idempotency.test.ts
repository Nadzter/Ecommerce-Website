import { describe, expect, it } from 'vitest';
import { hashCanonical } from './idempotency.js';

describe('hashCanonical', () => {
  it('produces the same hash regardless of key order', () => {
    const a = hashCanonical({ b: 1, a: 2, c: { z: 1, y: 2 } });
    const b = hashCanonical({ a: 2, c: { y: 2, z: 1 }, b: 1 });
    expect(a).toBe(b);
  });

  it('distinguishes different values', () => {
    expect(hashCanonical({ a: 1 })).not.toBe(hashCanonical({ a: 2 }));
  });

  it('distinguishes different shapes', () => {
    expect(hashCanonical({ a: 1 })).not.toBe(hashCanonical({ a: '1' }));
    expect(hashCanonical([1, 2])).not.toBe(hashCanonical([2, 1]));
    expect(hashCanonical(null)).not.toBe(hashCanonical(undefined));
  });

  it('serialises BigInt deterministically', () => {
    const a = hashCanonical({ amount: 123_456_789n });
    const b = hashCanonical({ amount: 123_456_789n });
    expect(a).toBe(b);
    expect(hashCanonical({ amount: 1n })).not.toBe(hashCanonical({ amount: 2n }));
  });

  it('does not collide string forms with bigint forms', () => {
    expect(hashCanonical({ amount: 1n })).not.toBe(hashCanonical({ amount: '1' }));
  });
});
