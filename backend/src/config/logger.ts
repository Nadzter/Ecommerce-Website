import pino from 'pino';
import type { Env } from './env.js';

/**
 * Redaction paths: anything in this list is replaced with `[REDACTED]` before
 * the log line leaves the process. Add to this list whenever a new sensitive
 * field is introduced — never log raw provider responses without routing them
 * through `lib/redact.ts` first.
 */
const REDACT_PATHS = [
  '*.password',
  '*.code',
  '*.code_hash',
  '*.token',
  '*.access_token',
  '*.refresh_token',
  '*.iban',
  '*.account_number',
  '*.cvv',
  '*.card_number',
  'req.headers.authorization',
  'req.headers["x-amwali-signature"]',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

export function buildLogger(env: Env): pino.Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    base: { service: 'amwali-backend', env: env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
          },
        }
      : {}),
  });
}
