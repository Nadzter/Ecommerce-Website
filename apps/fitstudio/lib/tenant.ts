import { headers } from "next/headers";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Studio } from "@/prisma/generated/client";

import { prisma } from "./prisma";

/**
 * Header injected by `middleware.ts` once a request has been routed to a
 * specific tenant. Reading from a header (rather than a cookie or context
 * provider) keeps tenant resolution synchronous inside Server Components.
 */
export const TENANT_HEADER = "x-fitstudio-tenant";

const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase() ?? "fitstudio.app";

/**
 * Strip the trailing port from a `Host` header value, if present.
 */
function stripPort(host: string): string {
  const colon = host.indexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

/**
 * Return the tenant slug encoded in the `Host` header, or `null` when the
 * request targets the bare root domain (e.g. marketing site). Subdomains
 * such as `www` and `app` are ignored.
 */
export function extractStudioSlug(host: string | null): string | null {
  if (!host) return null;
  const cleaned = stripPort(host).toLowerCase();
  const root = ROOT_DOMAIN;

  if (cleaned === root || cleaned === `www.${root}`) return null;

  if (cleaned.endsWith(`.${root}`)) {
    const candidate = cleaned.slice(0, -1 * (root.length + 1));
    if (!candidate || candidate === "www" || candidate === "app") return null;
    // Multi-level subdomains (a.b.fitstudio.app) are not tenant-mapped.
    if (candidate.includes(".")) return null;
    return candidate;
  }

  // Vercel preview deployments and bare localhost have no tenant prefix.
  return null;
}

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
 *
 * The result is memoised per request via React's `cache()` so that multiple
 * Server Components in the same render can call it without duplicating
 * database round-trips.
 */
export const getCurrentStudio = cache(async (): Promise<Studio> => {
  const slug = getStudioSlug();
  if (!slug) notFound();

  const studio = await prisma.studio.findUnique({ where: { slug } });
  if (!studio) notFound();

  return studio;
});

/**
 * Variant of {@link getCurrentStudio} that returns `null` instead of
 * triggering a 404, suitable for layouts that should render gracefully even
 * when the tenant is unknown (for example the marketing root).
 */
export const tryGetCurrentStudio = cache(
  async (): Promise<Studio | null> => {
    const slug = getStudioSlug();
    if (!slug) return null;
    return prisma.studio.findUnique({ where: { slug } });
  },
);
