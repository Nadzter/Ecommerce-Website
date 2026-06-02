import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiErrors } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

const STATE_COOKIE = "__fitstudio_stripe_oauth_state";

function settingsUrl(message?: string, ok = true): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const url = new URL(`${base.replace(/\/+$/, "")}/dashboard/settings/payments`);
  if (message) {
    url.searchParams.set(ok ? "stripeConnected" : "stripeError", message);
  }
  return url.toString();
}

/**
 * OAuth callback. Validates the `state` cookie, exchanges the `code` for
 * a permanent connected-account id, persists it on the Studio row, and
 * redirects back to the settings page with a success / failure flag.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(settingsUrl(error, false));
  }
  if (!code || !state) {
    throw ApiErrors.badRequest("Missing code or state");
  }

  const cookieStore = cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      settingsUrl("state_mismatch", false),
    );
  }

  await requireOwner();
  const studio = await getCurrentStudio();

  // Defence in depth: the slug embedded in `state` must match the tenant
  // resolved from the request host.
  const slugInState = state.split(".").slice(1).join(".");
  if (slugInState !== studio.slug) {
    return NextResponse.redirect(settingsUrl("studio_mismatch", false));
  }

  const stripe = getStripe();
  const tokenResponse = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });

  const connectedAccountId = tokenResponse.stripe_user_id;
  if (!connectedAccountId) {
    return NextResponse.redirect(settingsUrl("no_account_id", false));
  }

  // Fetch additional metadata from Stripe so we can surface payout status
  // in the dashboard without an extra round-trip on every page load.
  const account = await stripe.accounts.retrieve(connectedAccountId);
  const status = account.charges_enabled
    ? "active"
    : account.details_submitted
      ? "pending"
      : "incomplete";

  await prisma.studio.update({
    where: { id: studio.id },
    data: {
      stripeAccountId: connectedAccountId,
      stripeAccountStatus: status,
    },
  });

  return NextResponse.redirect(settingsUrl("connected", true));
}
