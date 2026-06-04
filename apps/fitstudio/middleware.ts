import { NextResponse, type NextRequest } from "next/server";

import { TENANT_HEADER, extractStudioSlug } from "@/lib/tenant-edge";

const TENANT_COOKIE = "__fitstudio_dev_tenant";

/**
 * Resolve the tenant slug for an incoming request:
 *
 *  • Production: read `Host` header (e.g. `acme.fitstudio.app` → `acme`).
 *  • Development: fall back to `?studio=<slug>` query string, and as a
 *    final fallback the dev cookie set on a previous visit. The cookie
 *    survives auth redirects so the simulated subdomain isn't lost.
 */
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
 * Plain Edge middleware that only does tenant resolution — no auth.
 * Clerk's `clerkMiddleware()` would normally protect dashboard routes
 * here, but it pulls Node-only modules (`#crypto`, `devBrowser`) that
 * the Edge runtime rejects on Vercel. Auth still happens later: every
 * dashboard layout and protected page calls `requireStaff()` /
 * `requireOwner()` from `lib/auth.ts`, which runs server-side (Node)
 * and redirects to `/sign-in` when needed.
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
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes so webhooks and tenant scoping are applied.
    "/(api|trpc)(.*)",
  ],
};
