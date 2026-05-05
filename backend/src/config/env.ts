import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),

  OTP_LENGTH: z.coerce.number().int().min(4).max(10).default(6),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_DELIVERY: z.enum(['log', 'memory', 'sms', 'email']).default('log'),

  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),

  PROVIDER_OVERRIDE: z.enum(['mock', 'lean', 'flutterwave']).default('mock'),
  MOCK_WEBHOOK_SECRET: z.string().min(16),
  MOCK_WEBHOOK_DELAY_MIN_MS: z.coerce.number().int().nonnegative().default(5_000),
  MOCK_WEBHOOK_DELAY_MAX_MS: z.coerce.number().int().nonnegative().default(15_000),

  SCA_THRESHOLD_AED: z.coerce.bigint().default(50_000n),
  SCA_THRESHOLD_GHS: z.coerce.bigint().default(150_000n),

  RECONCILER_POLL_SECONDS: z.coerce.number().int().positive().default(60),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test-only: clear the cache between test cases. */
export function resetEnvCache(): void {
  cached = null;
}
