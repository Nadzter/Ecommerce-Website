import {
  BookingStatus,
  MembershipType,
  type UserMembership,
} from "@prisma/client";

import { prisma } from "./prisma";

export { canMemberCancel } from "./booking-rules";

/**
 * Result of trying to charge a booking against a user's active
 * memberships. `kind` distinguishes between unlimited (no decrement) and
 * pack (decrement) so callers can issue the right database update.
 */
export type CreditCheck =
  | { kind: "UNLIMITED"; membershipId: string }
  | { kind: "CREDIT"; membershipId: string; remaining: number }
  | { kind: "NONE" };

/**
 * Find the membership a booking should consume. Preference order:
 *
 *  1. An unlimited membership that has not expired.
 *  2. The class-pack with the soonest expiry (or smallest balance if no
 *     expiry) that still has credits remaining.
 *
 * Pure with respect to the database — no writes are performed.
 */
export async function resolveCredit(
  studioId: string,
  userId: string,
  now: Date = new Date(),
): Promise<CreditCheck> {
  const memberships = await prisma.userMembership.findMany({
    where: {
      studioId,
      userId,
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    include: { membership: true },
  });

  const unlimited = memberships.find(
    (entry) => entry.membership.type === MembershipType.UNLIMITED,
  );
  if (unlimited) {
    return { kind: "UNLIMITED", membershipId: unlimited.id };
  }

  const packs = memberships
    .filter(
      (entry) =>
        entry.membership.type !== MembershipType.UNLIMITED &&
        (entry.creditsRemaining ?? 0) > 0,
    )
    .sort((a, b) => {
      const aEnd = a.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const bEnd = b.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aEnd !== bEnd) return aEnd - bEnd;
      return (a.creditsRemaining ?? 0) - (b.creditsRemaining ?? 0);
    });

  const pack = packs[0];
  if (!pack) return { kind: "NONE" };
  return {
    kind: "CREDIT",
    membershipId: pack.id,
    remaining: pack.creditsRemaining ?? 0,
  };
}

/**
 * Atomically cancel a confirmed booking and refund the credit to its
 * UserMembership. Returns `true` when a refund actually happened so the
 * caller can branch on it. Idempotent — calling twice for the same
 * booking is a no-op the second time.
 */
export async function cancelAndRefund(bookingId: string): Promise<{
  cancelled: boolean;
  refunded: boolean;
  wasConfirmed: boolean;
}> {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { membership: true },
    });
    if (!booking) {
      return { cancelled: false, refunded: false, wasConfirmed: false };
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return { cancelled: false, refunded: false, wasConfirmed: false };
    }

    const wasConfirmed = booking.status === BookingStatus.CONFIRMED;
    const shouldRefund =
      wasConfirmed &&
      Boolean(booking.membershipId) &&
      booking.membership?.type !== MembershipType.UNLIMITED;

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    if (shouldRefund && booking.membershipId) {
      await tx.userMembership.update({
        where: { id: booking.membershipId },
        data: { creditsRemaining: { increment: booking.creditsUsed } },
      });
    }

    return {
      cancelled: true,
      refunded: shouldRefund,
      wasConfirmed,
    };
  });
}

export type ActiveMembershipSummary = Pick<
  UserMembership,
  "id" | "creditsRemaining" | "endsAt"
> & { membership: { name: string; type: MembershipType } };

/**
 * Lightweight projection of a member's active memberships for use in the
 * member portal sidebar / dashboard.
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
    creditsRemaining: row.creditsRemaining,
    endsAt: row.endsAt,
    membership: row.membership,
  }));
}
