import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { TENANT_HEADER, extractStudioSlug } from "@/lib/tenant-edge";

const TENANT_COOKIE = "__fitstudio_dev_tenant";

const isProtectedDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/dashboard(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/_next/(.*)",
  "/favicon.ico",
]);

/**
 * Resolve the tenant slug for an incoming request:
 *
 *  • Production: read `Host` header (e.g. `acme.fitstudio.app` → `acme`).
 *  • Development: fall back to `?studio=<slug>` query string, and as a final
 *    fallback the dev cookie set on a previous visit. The cookie lets Clerk
 *    redirect back to `/dashboard` without losing the simulated subdomain.
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

export default clerkMiddleware((authFn, request) => {
  const { slug, fromQuery } = resolveStudioSlug(request);

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set(TENANT_HEADER, slug);
  } else {
    requestHeaders.delete(TENANT_HEADER);
  }

  if (isProtectedDashboardRoute(request) && !isPublicRoute(request)) {
    authFn().protect();
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Persist the dev tenant in a cookie so it survives Clerk redirects that
  // would otherwise strip the `?studio=` query string. Cookies are not used
  // in production — there the subdomain is authoritative.
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
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files. Source: official Clerk
    // middleware example.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes so webhooks and tenant scoping are applied.
    "/(api|trpc)(.*)",
  ],
};
