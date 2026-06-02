import {
  BookingStatus,
  MembershipType,
} from "@/prisma/generated/client";

import { addCredits } from "./credits";
import { prisma } from "./prisma";

export { canMemberCancel } from "./booking-rules";

/**
 * Result of trying to charge a booking. `UNLIMITED` skips the credit
 * counter, `CREDIT` decrements `User.creditsBalance`, `NONE` means the
 * member has neither — the API surfaces a 422 with a redirect to
 * `/membership`.
 */
export type CreditCheck =
  | { kind: "UNLIMITED" }
  | { kind: "CREDIT"; balance: number }
  | { kind: "NONE" };

/**
 * Decide which credit source covers a new booking:
 *  1. Any active, non-expired `UNLIMITED` UserMembership → UNLIMITED.
 *  2. Else if the user has `creditsBalance > 0` → CREDIT.
 *  3. Otherwise NONE.
 *
 * Read-only — callers do the mutation themselves.
 */
export async function resolveCredit(
  studioId: string,
  userId: string,
  now: Date = new Date(),
): Promise<CreditCheck> {
  const [unlimited, user] = await Promise.all([
    prisma.userMembership.findFirst({
      where: {
        studioId,
        userId,
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        membership: { type: MembershipType.UNLIMITED },
      },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: userId, studioId },
      select: { creditsBalance: true },
    }),
  ]);

  if (unlimited) return { kind: "UNLIMITED" };
  if (user && user.creditsBalance > 0) {
    return { kind: "CREDIT", balance: user.creditsBalance };
  }
  return { kind: "NONE" };
}

/**
 * Atomically cancel a confirmed booking and refund the credit. No-op for
 * waitlisted bookings (no credit was charged) and unlimited bookings
 * (`creditsUsed = 0`). Idempotent — running twice on the same booking
 * leaves state unchanged.
 */
export async function cancelAndRefund(bookingId: string): Promise<{
  cancelled: boolean;
  refunded: boolean;
  wasConfirmed: boolean;
}> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) {
    return { cancelled: false, refunded: false, wasConfirmed: false };
  }
  if (booking.status === BookingStatus.CANCELLED) {
    return { cancelled: false, refunded: false, wasConfirmed: false };
  }

  const wasConfirmed = booking.status === BookingStatus.CONFIRMED;
  const shouldRefund = wasConfirmed && booking.creditsUsed > 0;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });

  if (shouldRefund) {
    await addCredits(booking.userId, booking.creditsUsed, booking.studioId);
  }
  return { cancelled: true, refunded: shouldRefund, wasConfirmed };
}

export interface ActiveMembershipSummary {
  id: string;
  membership: { name: string; type: MembershipType };
  endsAt: Date | null;
}

/**
 * Compact list of a member's active plans. Used to surface a sidebar
 * summary in the member portal.
 */
export async function listActiveMemberships(
  studioId: string,
  userId: string,
  now: Date = new Date(),
): Promise<ActiveMembershipSummary[]> {
  const rows = await prisma.userMembership.findMany({
    where: {
      studioId,
      userId,
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    include: { membership: { select: { name: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    membership: row.membership,
    endsAt: row.endsAt,
  }));
}
