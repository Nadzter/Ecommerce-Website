import { createHash } from 'node:crypto';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    idempotency: {
      lookup(args: LookupArgs): Promise<IdempotencyHit | null>;
      complete(args: CompleteArgs): Promise<void>;
    };
  }
}

interface LookupArgs {
  userId: string;
  key: string;
  endpoint: string;
  body: unknown;
}

interface CompleteArgs {
  userId: string;
  key: string;
  status: number;
  body: unknown;
}

export type IdempotencyHit =
  | { kind: 'replay'; status: number; body: unknown }
  | { kind: 'in_flight' }
  | { kind: 'mismatch' };

interface PluginOpts {
  prisma: PrismaClient;
  ttlSeconds: number;
}

const idempotencyPlugin: FastifyPluginAsync<PluginOpts> = async (app, opts) => {
  const { prisma, ttlSeconds } = opts;

  app.decorate('idempotency', {
    async lookup({ userId, key, endpoint, body }: LookupArgs): Promise<IdempotencyHit | null> {
      const requestHash = hashCanonical(body);
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      // Atomically reserve the key. If a row already exists, fall through to
      // inspect it; otherwise we inserted a new in_flight row and the caller
      // can proceed.
      try {
        await prisma.idempotencyKey.create({
          data: {
            userId,
            key,
            endpoint,
            requestHash,
            status: 'in_flight',
            expiresAt,
          },
        });
        return null;
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }

      const existing = await prisma.idempotencyKey.findUnique({
        where: { userId_key: { userId, key } },
      });
      if (!existing) return null; // race; caller may retry once

      if (existing.endpoint !== endpoint || existing.requestHash !== requestHash) {
        return { kind: 'mismatch' };
      }
      if (existing.status === 'in_flight') return { kind: 'in_flight' };
      return {
        kind: 'replay',
        status: existing.responseStatus ?? 200,
        body: existing.responseBody,
      };
    },

    async complete({ userId, key, status, body }: CompleteArgs): Promise<void> {
      await prisma.idempotencyKey.update({
        where: { userId_key: { userId, key } },
        data: {
          status: 'completed',
          responseStatus: status,
          responseBody: body as object,
        },
      });
    },
  });
};

export default fp(idempotencyPlugin, { name: 'idempotency' });

/**
 * Canonical JSON hash. Object keys are sorted recursively so semantically
 * identical bodies produce identical hashes regardless of property order.
 * BigInt is serialised as a string with a "$bigint:" tag so it round-trips.
 */
export function hashCanonical(value: unknown): string {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '"$undefined"';
  if (typeof value === 'bigint') return JSON.stringify(`$bigint:${value.toString()}`);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }
  return '"$unknown"';
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}

/**
 * Per-route helper. Wraps a handler so the idempotency check happens before
 * the business logic runs and the result is cached after.
 */
export function withIdempotency<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  args: { userId: string; key: string; endpoint: string; body: unknown },
  handler: () => Promise<{ status: number; body: T }>,
): Promise<{ status: number; body: T } | { status: number; body: unknown }> {
  return (async () => {
    const hit = await request.server.idempotency.lookup(args);
    if (hit?.kind === 'replay') {
      return { status: hit.status, body: hit.body };
    }
    if (hit?.kind === 'in_flight') {
      reply.code(409);
      return {
        status: 409,
        body: {
          error: {
            code: 'idempotency_key_in_flight',
            message: 'A request with this Idempotency-Key is still being processed.',
          },
        },
      };
    }
    if (hit?.kind === 'mismatch') {
      reply.code(409);
      return {
        status: 409,
        body: {
          error: {
            code: 'idempotency_key_mismatch',
            message: 'This Idempotency-Key was previously used with a different request body.',
          },
        },
      };
    }
    const result = await handler();
    await request.server.idempotency.complete({
      userId: args.userId,
      key: args.key,
      status: result.status,
      body: result.body,
    });
    return result;
  })();
}
