import { BookingStatus, MembershipType } from "@/prisma/generated/client";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { resolveCredit } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";
import { createBookingSchema } from "@/lib/zod";

export const runtime = "nodejs";

const SESSION_TYPES_REQUIRING_STAFF = new Set<string>([
  "PRIVATE",
  "DUET",
  "TRIO",
]);

export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const ctx = await getAuthContext();
    if (!ctx) throw ApiErrors.unauthorized();
    if (ctx.studioId !== studio.id) throw ApiErrors.forbidden();

    const input = await parseBody(request, createBookingSchema);

    // Resolve target user. Members can only book for themselves; staff/owners
    // can book on behalf of any tenant member (needed for private sessions).
    let targetUserId = ctx.user.id;
    if (input.userId && input.userId !== ctx.user.id) {
      if (ctx.user.role === "MEMBER") {
        throw ApiErrors.forbidden(
          "Members can only book classes for themselves",
        );
      }
      const target = await prisma.user.findFirst({
        where: { id: input.userId, studioId: studio.id },
      });
      if (!target) throw ApiErrors.notFound("Target member not found");
      targetUserId = target.id;
    }

    const session = await prisma.class.findFirst({
      where: { id: input.classId, studioId: studio.id, cancelledAt: null },
      include: {
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
    });
    if (!session) throw ApiErrors.notFound("Class not found");
    if (session.startTime <= new Date()) {
      throw ApiErrors.conflict("Cannot book a class that has already started");
    }
    if (
      SESSION_TYPES_REQUIRING_STAFF.has(session.sessionType) &&
      ctx.user.role === "MEMBER"
    ) {
      throw ApiErrors.forbidden(
        "Private sessions must be booked by the studio on behalf of the member",
      );
    }

    // Prevent duplicate bookings — schema has a unique constraint on
    // (classId, userId) but we surface a friendlier error first.
    const existing = await prisma.booking.findUnique({
      where: {
        classId_userId: { classId: session.id, userId: targetUserId },
      },
    });
    if (existing && existing.status !== BookingStatus.CANCELLED) {
      throw ApiErrors.conflict(
        "This member already has an active booking for this class",
      );
    }

    const credit = await resolveCredit(studio.id, targetUserId);
    if (credit.kind === "NONE") {
      throw ApiErrors.unprocessable(
        "No active membership or credits remaining",
        { redirect: "/memberships" },
      );
    }

    const seatsLeft = session.capacity - session._count.bookings;
    const willWaitlist = seatsLeft <= 0;

    const booking = await prisma.$transaction(async (tx) => {
      // For waitlist entries we still record the membership but defer the
      // credit decrement until promotion. For confirmed bookings we decrement
      // immediately, except for unlimited memberships.
      const membershipId = credit.membershipId;
      const created = await tx.booking.upsert({
        where: {
          classId_userId: { classId: session.id, userId: targetUserId },
        },
        update: {
          status: willWaitlist
            ? BookingStatus.WAITLISTED
            : BookingStatus.CONFIRMED,
          membershipId,
          creditsUsed: 1,
          cancelledAt: null,
        },
        create: {
          studioId: studio.id,
          classId: session.id,
          userId: targetUserId,
          status: willWaitlist
            ? BookingStatus.WAITLISTED
            : BookingStatus.CONFIRMED,
          membershipId,
          creditsUsed: 1,
        },
      });

      if (!willWaitlist && credit.kind === "CREDIT") {
        await tx.userMembership.update({
          where: { id: credit.membershipId },
          data: { creditsRemaining: { decrement: 1 } },
        });
      }
      return created;
    });

    let waitlistPosition: number | null = null;
    if (booking.status === BookingStatus.WAITLISTED) {
      const ahead = await prisma.booking.count({
        where: {
          classId: session.id,
          status: BookingStatus.WAITLISTED,
          createdAt: { lt: booking.createdAt },
        },
      });
      waitlistPosition = ahead + 1;
    }

    return ok(
      {
        booking: {
          id: booking.id,
          classId: booking.classId,
          status: booking.status,
          creditsUsed: booking.creditsUsed,
          waitlistPosition,
          membershipType:
            credit.kind === "UNLIMITED"
              ? MembershipType.UNLIMITED
              : MembershipType.CLASS_PACK,
        },
      },
      { status: 201 },
    );
  });
}
