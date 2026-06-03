/**
 * Edge-runtime-safe tenant helpers. `middleware.ts` runs in the Edge
 * runtime which forbids Node-only modules (Prisma, node:crypto, etc.),
 * so this file is the part of tenant resolution that does NOT import
 * Prisma or anything else from `next/headers`. The server-side
 * counterpart (`lib/tenant.ts`) re-exports these constants and adds
 * the DB-backed helpers.
 */

export const TENANT_HEADER = "x-fitstudio-tenant";

const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase() ?? "fitstudio.app";

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
