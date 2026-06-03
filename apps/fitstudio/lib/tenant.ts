import { headers } from "next/headers";
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
    if (candidate.includes(".")) return null;
    return candidate;
  }

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
