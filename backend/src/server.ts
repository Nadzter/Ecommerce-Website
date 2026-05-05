import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { loadEnv } from './config/env.js';
import { buildLogger } from './config/logger.js';
import { closePrisma, getPrisma } from './db/client.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import idempotencyPlugin from './plugins/idempotency.js';
import { buildRegistry } from './providers/registry.js';

export async function buildServer() {
  const env = loadEnv();
  const logger = buildLogger(env);
  const prisma = getPrisma(env);

  const app = Fastify({ loggerInstance: logger, disableRequestLogging: false });

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true,
  });
  await app.register(sensible);
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  await app.register(errorHandlerPlugin);
  await app.register(authPlugin, { secret: env.JWT_SECRET });
  await app.register(idempotencyPlugin, {
    prisma,
    ttlSeconds: env.IDEMPOTENCY_TTL_SECONDS,
  });

  const publicBaseUrl = `http://localhost:${env.PORT}`;
  const registry = buildRegistry({ env, publicBaseUrl });
  app.decorate('providers', registry);

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch (err) {
      app.log.error({ err }, 'readiness check failed');
      reply.code(503);
      return { status: 'not_ready' };
    }
  });

  app.addHook('onClose', async () => {
    await closePrisma();
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    providers: ReturnType<typeof buildRegistry>;
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  buildServer()
    .then(async (app) => {
      const env = loadEnv();
      await app.listen({ port: env.PORT, host: '0.0.0.0' });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
