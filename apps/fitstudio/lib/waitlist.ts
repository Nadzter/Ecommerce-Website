import { BookingStatus, type Booking } from "@/prisma/generated/client";

import { resolveCredit } from "./booking";
import { deductCredit } from "./credits";
import { prisma } from "./prisma";

export interface WaitlistEntry {
  id: string;
  userId: string;
  createdAt: Date;
  position: number;
}

/**
 * Pure helper: pick the head of the waitlist queue from a list of
 * bookings. Side-effect free so the logic is trivially unit-testable.
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
 * Pure helper: full ordered queue with 1-indexed positions, so the
 * member portal can show "you're #N on the waitlist".
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
  skipped: { userId: string; reason: "no_credit" }[];
}

/**
 * Walk the waitlist for a class and promote the first member whose credit
 * source is still valid. Members whose pack ran out (or whose unlimited
 * lapsed) are skipped so an unhealthy state never produces a booking they
 * cannot cover.
 *
 * The phone/email notification for the promoted member is logged here;
 * Phase 4 will replace the log with a real provider.
 */
export async function promoteNextFromWaitlist(
  classId: string,
  studioId: string,
): Promise<PromotionResult> {
  const skipped: { userId: string; reason: "no_credit" }[] = [];
  const queue = await prisma.booking.findMany({
    where: { classId, studioId, status: BookingStatus.WAITLISTED },
    orderBy: { createdAt: "asc" },
  });

  for (const entry of queue) {
    const credit = await resolveCredit(studioId, entry.userId);
    if (credit.kind === "NONE") {
      skipped.push({ userId: entry.userId, reason: "no_credit" });
      continue;
    }
    const promoted = await prisma.$transaction(async (tx) => {
      if (credit.kind === "CREDIT") {
        await deductCredit(entry.userId, studioId);
      }
      return tx.booking.update({
        where: { id: entry.id },
        data: {
          status: BookingStatus.CONFIRMED,
          promotedAt: new Date(),
          creditsUsed: credit.kind === "UNLIMITED" ? 0 : 1,
        },
      });
    });
    console.info("[waitlist] promoted", {
      bookingId: promoted.id,
      classId,
      userId: promoted.userId,
      skipped: skipped.length,
    });
    return {
      promotedBookingId: promoted.id,
      classId,
      userId: promoted.userId,
      skipped,
    };
  }

  return { promotedBookingId: null, classId, userId: null, skipped };
}
