import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiErrors } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { buildConnectAuthUrl } from "@/lib/stripe";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

const STATE_COOKIE = "__fitstudio_stripe_oauth_state";

/**
 * Kick off the Stripe Connect Express OAuth handshake. We:
 *  1. Generate a CSRF-style `state` token, store it in a short-lived
 *     HttpOnly cookie, and include the studio slug so the callback can
 *     reconcile cross-tab handshakes.
 *  2. Build the authorize URL and 302 to it.
 */
export async function GET(): Promise<Response> {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    throw ApiErrors.badRequest(
      "STRIPE_CONNECT_CLIENT_ID is not configured on the server",
    );
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  await requireOwner();
  const studio = await getCurrentStudio();

  const stateToken = randomBytes(16).toString("hex");
  const statePayload = `${stateToken}.${studio.slug}`;

  const url = buildConnectAuthUrl({
    clientId,
    state: statePayload,
    redirectUri: `${appUrl.replace(/\/+$/, "")}/api/stripe/callback`,
    countryHint:
      studio.country === "ES" ? "ES" : studio.country === "AE" ? "AE" : "LB",
    emailHint: studio.email ?? undefined,
  });

  cookies().set({
    name: STATE_COOKIE,
    value: statePayload,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(url);
}
