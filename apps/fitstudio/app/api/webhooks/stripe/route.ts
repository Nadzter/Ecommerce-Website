import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { addCredits } from "@/lib/credits";
import { generateInvoice } from "@/lib/invoicing";
import { enqueueNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { fromStripeMinorUnits, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

interface MembershipMetadata {
  studioId?: string;
  userId?: string;
  membershipId?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readMetadata(
  meta: Stripe.Metadata | null | undefined,
): MembershipMetadata {
  if (!meta) return {};
  return {
    studioId: asString(meta.studioId),
    userId: asString(meta.userId),
    membershipId: asString(meta.membershipId),
  };
}

async function handlePaymentSucceeded(
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const meta = readMetadata(intent.metadata);
  if (!meta.studioId || !meta.userId) {
    console.warn("[stripe-webhook] payment_intent.succeeded without metadata", {
      id: intent.id,
    });
    return;
  }

  const membership = meta.membershipId
    ? await prisma.membership.findFirst({
        where: { id: meta.membershipId, studioId: meta.studioId },
      })
    : null;

  const currency = (intent.currency.toUpperCase() ?? "EUR") as
    | "EUR"
    | "AED"
    | "USD"
    | "LBP";
  const amount = fromStripeMinorUnits(intent.amount_received ?? intent.amount, currency);

  // Idempotent: skip if we have already recorded this PaymentIntent.
  const existing = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: intent.id },
  });

  const payment = existing
    ? await prisma.payment.update({
        where: { id: existing.id },
        data: { status: "COMPLETED" },
      })
    : await prisma.payment.create({
        data: {
          studioId: meta.studioId,
          userId: meta.userId,
          amount: amount.toFixed(2),
          currency,
          status: "COMPLETED",
          stripePaymentIntentId: intent.id,
          membershipId: membership?.id ?? null,
          description: membership?.name ?? null,
        },
      });

  // Grant credits to the buyer for class-pack purchases.
  if (membership?.type === "CLASS_PACK" && membership.classCount) {
    await addCredits(meta.userId, membership.classCount, meta.studioId);
  }

  // Track unlimited / pack / drop-in via UserMembership so the booking
  // flow can short-circuit credit checks for unlimited holders.
  if (membership) {
    const endsAt =
      membership.billingInterval === "ANNUAL"
        ? new Date(Date.now() + 365 * 24 * 3_600_000)
        : membership.billingInterval === "MONTHLY"
          ? new Date(Date.now() + 30 * 24 * 3_600_000)
          : null;
    await prisma.userMembership.create({
      data: {
        studioId: meta.studioId,
        userId: meta.userId,
        membershipId: membership.id,
        creditsRemaining:
          membership.type === "UNLIMITED"
            ? null
            : (membership.classCount ?? null),
        endsAt,
        isActive: true,
      },
    });
  }

  // Clear any prior failure flag now that the user has paid.
  await prisma.user.update({
    where: { id: meta.userId },
    data: { paymentFailedAt: null },
  });

  // Spain-compliant invoice with Verifactu hash + R2 PDF upload.
  let invoiceUrl: string | undefined;
  try {
    const generated = await generateInvoice(payment.id);
    invoiceUrl = generated.pdfUrl;
  } catch (error) {
    console.error("[stripe-webhook] invoice generation failed", {
      paymentId: payment.id,
      error,
    });
  }

  await enqueueNotification({
    type: "payment_received",
    userId: meta.userId,
    studioId: meta.studioId,
    data: {
      amount: amount.toFixed(currency === "LBP" ? 0 : 2),
      currency,
      membershipName: membership?.name ?? "Studio services",
      invoiceUrl: invoiceUrl ?? "",
    },
  });
}

async function handleSubscriptionRenewed(
  invoice: Stripe.Invoice,
): Promise<void> {
  // First invoice is already handled by payment_intent.succeeded. Only
  // record subsequent renewals here.
  if (invoice.billing_reason !== "subscription_cycle") return;

  const meta = readMetadata(invoice.subscription_details?.metadata ?? null);
  if (!meta.studioId || !meta.userId) return;

  const currency = invoice.currency.toUpperCase() as
    | "EUR"
    | "AED"
    | "USD"
    | "LBP";
  const amount = fromStripeMinorUnits(invoice.amount_paid, currency);

  const intentId =
    typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id;
  const existing = intentId
    ? await prisma.payment.findUnique({
        where: { stripePaymentIntentId: intentId },
      })
    : null;
  if (existing) return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

  const payment = await prisma.payment.create({
    data: {
      studioId: meta.studioId,
      userId: meta.userId,
      amount: amount.toFixed(2),
      currency,
      status: "COMPLETED",
      stripePaymentIntentId: intentId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
      membershipId: meta.membershipId ?? null,
      description: "Subscription renewal",
    },
  });
  await prisma.user.update({
    where: { id: meta.userId },
    data: { paymentFailedAt: null },
  });

  try {
    await generateInvoice(payment.id);
  } catch (error) {
    console.error("[stripe-webhook] renewal invoice generation failed", {
      paymentId: payment.id,
      error,
    });
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const meta = readMetadata(subscription.metadata);
  console.info("[stripe-webhook] subscription deleted", {
    subscriptionId: subscription.id,
    studioId: meta.studioId,
    userId: meta.userId,
  });
  if (!meta.userId || !meta.studioId) return;

  await prisma.userMembership.updateMany({
    where: {
      userId: meta.userId,
      studioId: meta.studioId,
      membershipId: meta.membershipId ?? undefined,
      isActive: true,
    },
    data: { isActive: false, endsAt: new Date() },
  });

  // Notify the member that their plan has ended. We send the
  // `membership_expiring` template immediately (per spec) using the
  // subscription's cancel-at timestamp as the expiry date so the copy
  // stays accurate even if Stripe and our DB drift.
  const cancelAt =
    typeof subscription.canceled_at === "number"
      ? new Date(subscription.canceled_at * 1000)
      : new Date();
  const membership = meta.membershipId
    ? await prisma.membership.findFirst({
        where: { id: meta.membershipId, studioId: meta.studioId },
        select: { name: true },
      })
    : null;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://fitstudio.app";
  await enqueueNotification({
    type: "membership_expiring",
    userId: meta.userId,
    studioId: meta.studioId,
    data: {
      membershipName: membership?.name ?? "membership",
      expiryDate: cancelAt.toISOString().slice(0, 10),
      renewUrl: `${appUrl.replace(/\/+$/, "")}/membership`,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const meta = readMetadata(invoice.subscription_details?.metadata ?? null);
  if (!meta.studioId || !meta.userId) return;

  const intentId =
    typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id ?? null;

  if (intentId) {
    const existing = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: intentId },
    });
    if (existing) {
      await prisma.payment.update({
        where: { id: existing.id },
        data: { status: "FAILED" },
      });
    }
  }
  await prisma.user.update({
    where: { id: meta.userId },
    data: { paymentFailedAt: new Date() },
  });
}

/**
 * Stripe webhook entrypoint. Verifies the signature, then dispatches to
 * the appropriate handler. Errors return 500 so Stripe retries.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }
  const sig = headers().get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      case "invoice.paid":
        await handleSubscriptionRenewed(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
        // Acknowledge other events so Stripe doesn't retry forever.
        break;
    }
  } catch (error) {
    console.error("[stripe-webhook] handler error", {
      type: event.type,
      error,
    });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
