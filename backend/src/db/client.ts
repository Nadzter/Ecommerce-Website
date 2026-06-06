import { PrismaClient } from '#prisma-client';
import type { Env } from '../config/env.js';

export type Db = PrismaClient;

let cached: PrismaClient | null = null;

export function getPrisma(env: Env): PrismaClient {
  if (cached) return cached;
  cached = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: { db: { url: env.DATABASE_URL } },
  });
  return cached;
}

export async function closePrisma(): Promise<void> {
  if (cached) {
    await cached.$disconnect();
    cached = null;
  }
}
