import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Language, UserRole } from "@/prisma/generated/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Shape of the metadata we expect Clerk to forward on every user. Studio
 * owners populate this when they invite a teammate or member from the
 * dashboard via Clerk's admin API.
 */
interface ClerkPublicMetadata {
  studioId?: string;
  studioSlug?: string;
  role?: UserRole;
  language?: Language;
}

function parseLanguage(value: unknown): Language {
  return value === "es" || value === "en" || value === "ar"
    ? (value as Language)
    : Language.en;
}

function parseRole(value: unknown): UserRole {
  return value === "OWNER" || value === "STAFF" || value === "MEMBER"
    ? (value as UserRole)
    : UserRole.MEMBER;
}

/**
 * Pick the primary verified email from a Clerk user payload, falling back to
 * the first registered address.
 */
function pickPrimaryEmail(
  data: WebhookEvent["data"] & {
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string | null;
  },
): string | null {
  const list = data.email_addresses ?? [];
  if (list.length === 0) return null;
  const primaryId = data.primary_email_address_id;
  if (primaryId) {
    const match = list.find((entry) => entry.id === primaryId);
    if (match) return match.email_address;
  }
  return list[0]?.email_address ?? null;
}

/**
 * Resolve the studio referenced by Clerk metadata. The owner who creates the
 * invitation is responsible for supplying either `studioId` or `studioSlug`
 * via Clerk's admin API; we look both up.
 */
async function resolveStudioId(
  metadata: ClerkPublicMetadata,
): Promise<string | null> {
  if (metadata.studioId) {
    const studio = await prisma.studio.findUnique({
      where: { id: metadata.studioId },
      select: { id: true },
    });
    if (studio) return studio.id;
  }
  if (metadata.studioSlug) {
    const studio = await prisma.studio.findUnique({
      where: { slug: metadata.studioSlug },
      select: { id: true },
    });
    if (studio) return studio.id;
  }
  return null;
}

/**
 * Persist a Clerk user into the local `User` table. Called for both
 * `user.created` and `user.updated`, since the schema is identical and we
 * want late metadata updates (e.g. role promotions) to flow through.
 */
async function upsertUserFromClerk(
  event: Extract<WebhookEvent, { type: "user.created" | "user.updated" }>,
): Promise<void> {
  const data = event.data;
  const email = pickPrimaryEmail(data);
  if (!email) {
    throw new Error(`Clerk user ${data.id} has no email address`);
  }

  const metadata = (data.public_metadata ?? {}) as ClerkPublicMetadata;
  const studioId = await resolveStudioId(metadata);
  if (!studioId) {
    throw new Error(
      `Clerk user ${data.id} is missing a resolvable studio in public metadata`,
    );
  }

  const role = parseRole(metadata.role);
  const language = parseLanguage(metadata.language);

  await prisma.user.upsert({
    where: { clerkId: data.id },
    create: {
      clerkId: data.id,
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      phone: data.phone_numbers?.[0]?.phone_number ?? null,
      language,
      role,
      studioId,
    },
    update: {
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      phone: data.phone_numbers?.[0]?.phone_number ?? null,
      language,
      role,
      studioId,
    },
  });
}

async function deleteUserFromClerk(
  event: Extract<WebhookEvent, { type: "user.deleted" }>,
): Promise<void> {
  const clerkId = event.data.id;
  if (!clerkId) return;
  await prisma.user.deleteMany({ where: { clerkId } });
}

/**
 * Verify the svix signature on an incoming Clerk webhook and dispatch the
 * payload to the matching handler. Returns 400 on signature failures and
 * 500 when the handler throws, so Clerk will automatically retry.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const headerStore = headers();
  const svixId = headerStore.get("svix-id");
  const svixTimestamp = headerStore.get("svix-timestamp");
  const svixSignature = headerStore.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix signature headers" },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const webhook = new Webhook(secret);

  let event: WebhookEvent;
  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("[clerk-webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated":
        await upsertUserFromClerk(event);
        break;
      case "user.deleted":
        await deleteUserFromClerk(event);
        break;
      default:
        // Acknowledge unhandled event types so Clerk does not retry forever.
        break;
    }
  } catch (error) {
    console.error("[clerk-webhook] handler error", { type: event.type, error });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
