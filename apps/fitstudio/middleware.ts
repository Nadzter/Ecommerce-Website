import { NextResponse, type NextRequest } from "next/server";

const TENANT_HEADER = "x-fitstudio-tenant";
const TENANT_COOKIE = "__fitstudio_dev_tenant";

const RAW_ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase().trim() ?? "fitstudio.app";

/**
 * The bare Vercel deployment host (`*.vercel.app`) is never a real
 * tenant — owners use a custom subdomain like `acme.fitstudio.app`.
 * Treating Vercel preview URLs as tenants gives every preview a fake
 * slug nobody ever seeded.
 */
const ROOT_DOMAIN = RAW_ROOT_DOMAIN === "vercel.app" ? "" : RAW_ROOT_DOMAIN;

function stripPort(host: string): string {
  const colon = host.indexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

function extractStudioSlug(host: string | null): string | null {
  if (!host || !ROOT_DOMAIN) return null;
  const cleaned = stripPort(host).toLowerCase();
  if (cleaned === ROOT_DOMAIN || cleaned === `www.${ROOT_DOMAIN}`) return null;
  if (!cleaned.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const candidate = cleaned.slice(0, -1 * (ROOT_DOMAIN.length + 1));
  if (!candidate || candidate === "www" || candidate === "app") return null;
  if (candidate.includes(".")) return null;
  return candidate;
}

function resolveStudioSlug(request: NextRequest): {
  slug: string | null;
  fromQuery: boolean;
} {
  const fromHost = extractStudioSlug(request.headers.get("host"));
  if (fromHost) return { slug: fromHost, fromQuery: false };

  // Query string is the primary mechanism for any deployment that
  // hasn't bound a real subdomain yet (Vercel previews, localhost).
  // Allowed in production so demo links like `?studio=acme` keep
  // working before custom DNS exists.
  const fromQuery = request.nextUrl.searchParams.get("studio");
  if (fromQuery && /^[a-z0-9-]+$/.test(fromQuery)) {
    return { slug: fromQuery.toLowerCase(), fromQuery: true };
  }

  const fromCookie = request.cookies.get(TENANT_COOKIE)?.value;
  if (fromCookie && /^[a-z0-9-]+$/.test(fromCookie)) {
    return { slug: fromCookie, fromQuery: false };
  }

  return { slug: null, fromQuery: false };
}

/**
 * Plain Edge middleware — only does tenant resolution. Wrapped in a
 * try/catch so any unexpected failure degrades to a normal request
 * (with no tenant header) instead of crashing with
 * MIDDLEWARE_INVOCATION_FAILED. Auth is enforced later in Server
 * Components via `requireStaff()` / `requireOwner()`.
 */
export default function middleware(request: NextRequest): NextResponse {
  try {
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

    if (fromQuery && slug) {
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
  } catch (error) {
    console.error("[middleware] unexpected failure", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
