/**
 * Recursively redact known-sensitive keys from arbitrary JSON before it lands
 * in `transfer_events.payload` or any audit log.
 *
 * Match is case-insensitive on the key name. Values are replaced with the
 * string `[REDACTED]`. Arrays and nested objects are walked.
 */
const SENSITIVE_KEYS = new Set(
  [
    'password',
    'token',
    'access_token',
    'accesstoken',
    'refresh_token',
    'refreshtoken',
    'authorization',
    'cookie',
    'set-cookie',
    'iban',
    'account_number',
    'accountnumber',
    'card_number',
    'cardnumber',
    'cvv',
    'cvc',
    'pin',
    'otp',
    'code',
    'code_hash',
    'codehash',
    'secret',
    'signature',
    'x-amwali-signature',
  ].map((s) => s.toLowerCase()),
);

const REDACTED = '[REDACTED]';

export function redact<T>(input: T): T {
  return walk(input) as T;
}

function walk(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => walk(v));
  const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) =>
    SENSITIVE_KEYS.has(k.toLowerCase()) ? [k, REDACTED] : [k, walk(v)],
  );
  return Object.fromEntries(entries);
}
