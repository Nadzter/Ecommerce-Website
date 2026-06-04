import { NextResponse, type NextRequest } from "next/server";

/**
 * The header name middleware stamps the resolved tenant slug onto.
 * Server Components read this back via `headers().get(TENANT_HEADER)`.
 * Kept in sync with `lib/tenant-edge.ts` — the value is duplicated here
 * intentionally so this middleware has zero custom imports and stays
 * Edge-runtime safe.
 */
const TENANT_HEADER = "x-fitstudio-tenant";

const TENANT_COOKIE = "__fitstudio_dev_tenant";

const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase() ?? "fitstudio.app";

function stripPort(host: string): string {
  const colon = host.indexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

function extractStudioSlug(host: string | null): string | null {
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

function resolveStudioSlug(request: NextRequest): {
  slug: string | null;
  fromQuery: boolean;
} {
  const host = request.headers.get("host");
  const fromHost = extractStudioSlug(host);
  if (fromHost) return { slug: fromHost, fromQuery: false };

  if (process.env.NODE_ENV !== "production") {
    const fromQuery = request.nextUrl.searchParams.get("studio");
    if (fromQuery && /^[a-z0-9-]+$/.test(fromQuery)) {
      return { slug: fromQuery.toLowerCase(), fromQuery: true };
    }
    const fromCookie = request.cookies.get(TENANT_COOKIE)?.value;
    if (fromCookie && /^[a-z0-9-]+$/.test(fromCookie)) {
      return { slug: fromCookie, fromQuery: false };
    }
  }

  return { slug: null, fromQuery: false };
}

/**
 * Plain Edge middleware — does only tenant resolution. Auth happens
 * later in Server Components via `requireStaff()` / `requireOwner()`
 * from `lib/auth.ts`. No custom imports here so the Edge bundle stays
 * 100% framework-only.
 */
export default function middleware(request: NextRequest): NextResponse {
  const { slug, fromQuery } = resolveStudioSlug(request);

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set(TENANT_HEADER, slug);
  } else {
    requestHeaders.delete(TENANT_HEADER);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (fromQuery && slug && process.env.NODE_ENV !== "production") {
    response.cookies.set({
      name: TENANT_COOKIE,
      value: slug,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
