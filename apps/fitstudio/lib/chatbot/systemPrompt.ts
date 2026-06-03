import type { Language, MembershipType } from "@/prisma/generated/client";

import { listActiveMemberships } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export interface ChatbotContext {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    language: Language;
    creditsBalance: number;
  };
  studio: {
    id: string;
    name: string;
    timezone: string;
    primaryColor: string;
  };
  membership: {
    name: string;
    type: MembershipType;
    expiresAt: string | null;
  } | null;
}

/**
 * Hydrate the per-request context the system prompt needs. We load the
 * member's active membership (if any) so the chatbot can answer
 * "how many credits do I have" without a tool round-trip.
 */
export async function loadChatbotContext(args: {
  userId: string;
  studioId: string;
}): Promise<ChatbotContext | null> {
  const [user, studio, memberships] = await Promise.all([
    prisma.user.findFirst({
      where: { id: args.userId, studioId: args.studioId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        language: true,
        creditsBalance: true,
      },
    }),
    prisma.studio.findUnique({
      where: { id: args.studioId },
      select: { id: true, name: true, timezone: true, primaryColor: true },
    }),
    listActiveMemberships(args.studioId, args.userId),
  ]);

  if (!user || !studio) return null;

  const primary = memberships[0];
  const membership = primary
    ? {
        name: primary.membership.name,
        type: primary.membership.type,
        expiresAt: primary.endsAt?.toISOString() ?? null,
      }
    : null;

  return { user, studio, membership };
}

/**
 * Dynamic system prompt. Uses prescriptive "call this tool when..."
 * phrasing for Opus 4.8, which is more conservative about reaching for
 * tools than prior models.
 */
export function buildSystemPrompt(ctx: ChatbotContext): string {
  const fullName =
    [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(" ") ||
    ctx.user.email;
  const now = new Date().toISOString();
  const membershipLine = ctx.membership
    ? `${ctx.membership.name} — ${ctx.membership.type}${
        ctx.membership.expiresAt
          ? ` (expires ${ctx.membership.expiresAt.slice(0, 10)})`
          : ""
      }`
    : "none";

  return `You are the AI assistant for ${ctx.studio.name}, a boutique fitness studio.
You help members book classes, check credits, manage bookings, and answer studio questions.

Member: ${fullName}
Email: ${ctx.user.email}
Credits remaining: ${ctx.user.creditsBalance}
Active membership: ${membershipLine}
Studio timezone: ${ctx.studio.timezone}
Current date/time: ${now}

Respond in the member's preferred language: ${ctx.user.language}.
If the member writes in a different language, switch to that language automatically.
For Arabic responses, write naturally in Arabic — the UI handles RTL rendering.

Personality: warm, concise, helpful, professional. Like a friendly studio receptionist.

Tool-use rules:
- Call list_upcoming_classes whenever the member asks about the schedule, what's available, or before booking a class you don't already have the id for.
- Call get_my_bookings whenever the member asks about their reservations or you need a bookingId before cancelling.
- Call book_class only after confirming the exact class with the member.
- Call cancel_booking only after confirming the exact booking with the member.
- Call get_my_credits whenever the member asks about credits, balance, or membership status.
- Call get_studio_info when the member asks about the studio (location, hours, instructors, pricing) and you do not already know the answer.
- Never invent class times, prices, or membership details — always fetch them via tools.
- Always confirm before executing book_class or cancel_booking.

Only answer questions about this studio and this member's account. If asked about competitors or unrelated topics, politely redirect the conversation back to the studio.

Respond directly with your final answer. Do not include exploratory reasoning, intermediate drafts, or meta-commentary about your process — keep replies tight and useful.`;
}
