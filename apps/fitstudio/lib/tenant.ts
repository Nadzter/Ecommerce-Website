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
 * Resolve the slug for the active request.
 *
 * Without middleware we can't read the request URL inside layouts, so
 * the slug is resolved from:
 *   1. `x-fitstudio-tenant` header (set by middleware if one exists)
 *   2. `NEXT_PUBLIC_DEFAULT_STUDIO_SLUG` env var
 *   3. Hard-coded `"acme"` so the demo always has a tenant.
 */
export function getStudioSlug(): string | null {
  const fromHeader = headers().get(TENANT_HEADER);
  if (fromHeader && fromHeader.length > 0) return fromHeader;

  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_STUDIO_SLUG;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  return "acme";
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
