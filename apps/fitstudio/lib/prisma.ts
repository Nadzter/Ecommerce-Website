import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __fitstudioPrisma: PrismaClient | undefined;
}

/**
 * Build a fresh Prisma client. In development the global cache prevents the
 * Next.js dev server from spawning a new connection pool on every hot reload.
 */
function buildClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__fitstudioPrisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__fitstudioPrisma = prisma;
}
