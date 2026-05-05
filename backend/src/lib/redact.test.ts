import { describe, expect, it } from 'vitest';
import { redact } from './redact.js';

describe('redact', () => {
  it('redacts sensitive top-level keys', () => {
    expect(redact({ password: 'hunter2', name: 'amir' })).toEqual({
      password: '[REDACTED]',
      name: 'amir',
    });
  });

  it('redacts nested keys', () => {
    expect(
      redact({
        provider: { iban: 'AE07...', meta: { account_number: '1234' } },
      }),
    ).toEqual({
      provider: { iban: '[REDACTED]', meta: { account_number: '[REDACTED]' } },
    });
  });

  it('redacts inside arrays', () => {
    expect(redact([{ token: 't1' }, { token: 't2' }])).toEqual([
      { token: '[REDACTED]' },
      { token: '[REDACTED]' },
    ]);
  });

  it('matches case-insensitively', () => {
    expect(redact({ Authorization: 'Bearer x', REFRESH_TOKEN: 'y' })).toEqual({
      Authorization: '[REDACTED]',
      REFRESH_TOKEN: '[REDACTED]',
    });
  });

  it('passes primitives through unchanged', () => {
    expect(redact(42)).toBe(42);
    expect(redact('hi')).toBe('hi');
    expect(redact(null)).toBeNull();
  });

  it('does not mutate the input', () => {
    const input = { token: 'secret', name: 'amir' };
    const out = redact(input);
    expect(input.token).toBe('secret');
    expect(out).not.toBe(input);
  });
});
