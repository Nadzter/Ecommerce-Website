import { BookingStatus, MembershipType, type Booking } from "@prisma/client";

import { prisma } from "./prisma";

export interface WaitlistEntry {
  id: string;
  userId: string;
  createdAt: Date;
  position: number;
}

/**
 * Compute the next booking to promote from waitlist to confirmed for a
 * given class. The pure function takes the current waitlist (ordered or
 * unordered) and returns the head of the queue. Returns `null` when the
 * waitlist is empty.
 *
 * Pure / side-effect free: callers pass in the list and apply the
 * resulting state change themselves. This makes the function trivially
 * unit-testable without a database.
 */
export function selectNextFromWaitlist<
  T extends Pick<Booking, "id" | "userId" | "createdAt" | "status">,
>(waitlist: readonly T[]): T | null {
  const pending = waitlist
    .filter((entry) => entry.status === BookingStatus.WAITLISTED)
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return pending[0] ?? null;
}

/**
 * Same as {@link selectNextFromWaitlist} but returns the entire ordered
 * queue with a 1-indexed position attached. Used to surface "you are #N
 * on the waitlist" on the member portal.
 */
export function rankWaitlist<
  T extends Pick<Booking, "id" | "userId" | "createdAt" | "status">,
>(waitlist: readonly T[]): Array<T & { position: number }> {
  return waitlist
    .filter((entry) => entry.status === BookingStatus.WAITLISTED)
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

interface PromotionResult {
  promotedBookingId: string | null;
  classId: string;
  userId: string | null;
}

/**
 * Atomically promote the next waitlisted booking for a class when a seat
 * frees up. Returns the booking that was promoted (or `null` when the
 * queue is empty).
 *
 * The transaction also writes `promotedAt` to capture when the seat was
 * granted. Notification fan-out (WhatsApp / email) is logged to the
 * console for now — Phase 4 will replace the log with a real provider.
 */
export async function promoteNextFromWaitlist(
  classId: string,
  studioId: string,
): Promise<PromotionResult> {
  const promoted = await prisma.$transaction(async (tx) => {
    const next = await tx.booking.findFirst({
      where: {
        classId,
        studioId,
        status: BookingStatus.WAITLISTED,
      },
      orderBy: { createdAt: "asc" },
      include: { membership: { select: { id: true, type: true } } },
    });
    if (!next) return null;

    const updated = await tx.booking.update({
      where: { id: next.id },
      data: {
        status: BookingStatus.CONFIRMED,
        promotedAt: new Date(),
      },
    });

    // Mirror the credit accounting that the original booking would have
    // performed if the seat had been available at create time.
    if (
      next.membershipId &&
      next.membership?.type !== MembershipType.UNLIMITED
    ) {
      await tx.userMembership.update({
        where: { id: next.membershipId },
        data: { creditsRemaining: { decrement: next.creditsUsed } },
      });
    }

    return updated;
  });

  if (!promoted) {
    return { promotedBookingId: null, classId, userId: null };
  }

  console.info("[waitlist] promoted", {
    bookingId: promoted.id,
    classId,
    userId: promoted.userId,
  });

  return {
    promotedBookingId: promoted.id,
    classId,
    userId: promoted.userId,
  };
}
