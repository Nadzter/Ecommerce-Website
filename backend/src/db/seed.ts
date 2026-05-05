import { loadEnv } from '../config/env.js';
import { closePrisma, getPrisma } from './client.js';

/**
 * Phase 1 seed: intentionally empty.
 *
 * Once auth/users/contacts modules land, seed a couple of demo users and
 * mock bank links here so `pnpm db:seed` produces a usable dev database.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const prisma = getPrisma(env);
  console.warn('Seed runner started.');
  // TODO: insert demo data when the user/contact services exist.
  await prisma.$queryRaw`SELECT 1`;
  console.warn('Seed runner finished (no-op for Phase 1).');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePrisma();
  });
