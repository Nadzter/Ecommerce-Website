import { z } from "zod";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";
import {
  actingAs,
  fromStripeMinorUnits,
  getStripe,
  getStudioStripeAccount,
  toStripeMinorUnits,
} from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  membershipId: z.string().min(1),
});

/**
 * Create a Stripe Payment Intent (or Subscription) for the requested
 * membership. Returns the `clientSecret` the member-side Payment Element
 * needs to render. Recurring plans (MONTHLY / ANNUAL) build a Subscription;
 * ONE_TIME plans build a PaymentIntent.
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const ctx = await requireMember();
    const studio = await getCurrentStudio();
    const input = await parseBody(request, checkoutSchema);

    const membership = await prisma.membership.findFirst({
      where: {
        id: input.membershipId,
        studioId: studio.id,
        isActive: true,
      },
    });
    if (!membership) {
      throw ApiErrors.notFound("Membership plan not available");
    }

    const stripeAccountId = await getStudioStripeAccount(studio.id).catch(() => {
      throw ApiErrors.unprocessable(
        "This studio has not connected Stripe yet",
      );
    });

    const stripe = getStripe();

    // Reuse or lazily create a Stripe customer on the connected account so
    // SEPA mandates, receipts and subscription renewals all attach to a
    // single, stable customer id.
    let customerId = ctx.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: ctx.user.email,
          name:
            [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(" ") ||
            undefined,
          phone: ctx.user.phone ?? undefined,
          metadata: { studioId: studio.id, userId: ctx.user.id },
        },
        actingAs(stripeAccountId),
      );
      customerId = customer.id;
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const amountMinor = toStripeMinorUnits(
      membership.price.toString(),
      membership.currency,
    );

    if (membership.billingInterval === "ONE_TIME") {
      const intent = await stripe.paymentIntents.create(
        {
          amount: amountMinor,
          currency: membership.currency.toLowerCase(),
          customer: customerId,
          automatic_payment_methods: { enabled: true },
          metadata: {
            studioId: studio.id,
            userId: ctx.user.id,
            membershipId: membership.id,
          },
          description: `${studio.name} — ${membership.name}`,
        },
        actingAs(stripeAccountId),
      );
      return ok({
        kind: "payment_intent",
        clientSecret: intent.client_secret,
        amount: fromStripeMinorUnits(amountMinor, membership.currency),
        currency: membership.currency,
        stripeAccountId,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      });
    }

    // For MONTHLY / ANNUAL we create (or reuse) a Stripe Product per
    // membership template, then a Subscription with `payment_behavior:
    // default_incomplete` so we can surface the latest invoice's
    // PaymentIntent `client_secret` to the Payment Element.
    const product = await stripe.products.create(
      {
        name: `${studio.name} — ${membership.name}`,
        metadata: { studioId: studio.id, membershipId: membership.id },
      },
      actingAs(stripeAccountId),
    );

    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [
          {
            price_data: {
              currency: membership.currency.toLowerCase(),
              product: product.id,
              recurring: {
                interval:
                  membership.billingInterval === "MONTHLY" ? "month" : "year",
              },
              unit_amount: amountMinor,
            },
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        metadata: {
          studioId: studio.id,
          userId: ctx.user.id,
          membershipId: membership.id,
        },
        expand: ["latest_invoice.payment_intent"],
      },
      actingAs(stripeAccountId),
    );

    const invoice = subscription.latest_invoice as
      | (typeof subscription.latest_invoice & {
          payment_intent?: { client_secret?: string | null };
        })
      | null;
    const clientSecret = invoice?.payment_intent?.client_secret ?? null;
    if (!clientSecret) {
      throw ApiErrors.unprocessable(
        "Stripe did not return a client secret for the new subscription",
      );
    }

    return ok({
      kind: "subscription",
      subscriptionId: subscription.id,
      clientSecret,
      amount: fromStripeMinorUnits(amountMinor, membership.currency),
      currency: membership.currency,
      stripeAccountId,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  });
}
