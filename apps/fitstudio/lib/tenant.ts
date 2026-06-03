import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Studio } from "@/prisma/generated/client";

import { prisma } from "./prisma";
import { TENANT_HEADER, extractStudioSlug } from "./tenant-edge";

// Re-export the Edge-safe helpers so server code can keep importing
// everything from `@/lib/tenant`. Middleware should import from
// `@/lib/tenant-edge` directly to stay Edge-compatible.
export { TENANT_HEADER, extractStudioSlug };

/**
 * Resolve the slug for the active request. In production this comes from the
 * subdomain via `middleware.ts`; in development we allow a `?studio=<slug>`
 * query string fallback set by the same middleware on the
 * `x-fitstudio-tenant` header.
 */
export function getStudioSlug(): string | null {
  const slug = headers().get(TENANT_HEADER);
  return slug && slug.length > 0 ? slug : null;
}

/**
 * Load the active studio from the database, throwing a Next.js 404 when no
 * tenant is in scope or the slug does not map to a registered studio.
 */
export async function getCurrentStudio(): Promise<Studio> {
  const slug = getStudioSlug();
  if (!slug) notFound();

  const studio = await prisma.studio.findUnique({ where: { slug } });
  if (!studio) notFound();

  return studio;
}

/**
 * Variant of {@link getCurrentStudio} that returns `null` instead of
 * triggering a 404, suitable for layouts that should render gracefully even
 * when the tenant is unknown (for example the marketing root).
 */
export async function tryGetCurrentStudio(): Promise<Studio | null> {
  const slug = getStudioSlug();
  if (!slug) return null;
  return prisma.studio.findUnique({ where: { slug } });
}
