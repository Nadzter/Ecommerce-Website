import Stripe from "stripe";

import { prisma } from "./prisma";

/**
 * Module-level singleton so we share a single HTTPS keep-alive pool across
 * route handlers. Lazy so unit tests can omit the env var.
 */
let stripeSingleton: Stripe | null = null;

/**
 * Return the platform-level Stripe client. Throws if `STRIPE_SECRET_KEY`
 * is missing so misconfigured deployments fail loudly at the call site
 * instead of producing silently-broken charges.
 */
export function getStripe(): Stripe {
  if (stripeSingleton) return stripeSingleton;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  stripeSingleton = new Stripe(secret, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    appInfo: {
      name: "FitStudio",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://fitstudio.app",
    },
  });
  return stripeSingleton;
}

/**
 * Lookup the Stripe Connect account id for a studio. Throws when the
 * studio has not connected Stripe yet — used as a guard before
 * initiating any charge.
 */
export async function getStudioStripeAccount(studioId: string): Promise<string> {
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { stripeAccountId: true, stripeAccountStatus: true },
  });
  if (!studio?.stripeAccountId) {
    throw new Error(
      `Studio ${studioId} has not connected a Stripe account yet`,
    );
  }
  return studio.stripeAccountId;
}

/**
 * Convenience: build the Stripe options envelope that routes a request to
 * a specific connected account. Used on every charge/subscription create.
 */
export function actingAs(studioStripeAccountId: string): {
  stripeAccount: string;
} {
  return { stripeAccount: studioStripeAccountId };
}

/**
 * Build the OAuth URL we redirect studios to so they can connect their
 * Stripe Connect Express account. Stripe redirects back to the
 * `redirectUri` with `?code=...` which our callback exchanges for a
 * permanent account id.
 */
export function buildConnectAuthUrl(params: {
  clientId: string;
  state: string;
  redirectUri: string;
  countryHint?: string;
  emailHint?: string;
}): string {
  const url = new URL("https://connect.stripe.com/express/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("state", params.state);
  url.searchParams.set("redirect_uri", params.redirectUri);
  if (params.countryHint) {
    url.searchParams.set("stripe_user[country]", params.countryHint);
  }
  if (params.emailHint) {
    url.searchParams.set("stripe_user[email]", params.emailHint);
  }
  return url.toString();
}

/**
 * Currency amounts are stored in cents/fils/whatever the smallest unit is
 * for that ISO code. Stripe expects the same. EUR / USD / AED all have a
 * 100x multiplier; LBP has none (it is already in pounds).
 */
export function toStripeMinorUnits(
  amount: number | string,
  currency: "EUR" | "USD" | "AED" | "LBP",
): number {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot convert non-finite amount to minor units: ${amount}`);
  }
  const multiplier = currency === "LBP" ? 1 : 100;
  return Math.round(value * multiplier);
}

export function fromStripeMinorUnits(
  amountMinor: number,
  currency: "EUR" | "USD" | "AED" | "LBP",
): number {
  const divisor = currency === "LBP" ? 1 : 100;
  return amountMinor / divisor;
}
