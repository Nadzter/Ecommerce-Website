import { BookingStatus } from "@/prisma/generated/client";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { resolveCredit } from "@/lib/booking";
import { deductCredit } from "@/lib/credits";
import {
  enqueueNotification,
  scheduleBookingReminder,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";
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
        instructor: { select: { firstName: true, lastName: true } },
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
        { redirect: "/membership" },
      );
    }

    const seatsLeft = session.capacity - session._count.bookings;
    const willWaitlist = seatsLeft <= 0;

    // For confirmed bookings against a CREDIT source we deduct immediately
    // inside the transaction so we never end up with a booking that the
    // user "didn't really pay for". Waitlisted bookings defer the deduct
    // to the promotion path.
    const creditsUsed = credit.kind === "UNLIMITED" ? 0 : 1;
    const booking = await prisma.$transaction(async (tx) => {
      const upserted = await tx.booking.upsert({
        where: {
          classId_userId: { classId: session.id, userId: targetUserId },
        },
        update: {
          status: willWaitlist
            ? BookingStatus.WAITLISTED
            : BookingStatus.CONFIRMED,
          creditsUsed: willWaitlist ? 0 : creditsUsed,
          cancelledAt: null,
        },
        create: {
          studioId: studio.id,
          classId: session.id,
          userId: targetUserId,
          status: willWaitlist
            ? BookingStatus.WAITLISTED
            : BookingStatus.CONFIRMED,
          creditsUsed: willWaitlist ? 0 : creditsUsed,
        },
      });

      if (!willWaitlist && credit.kind === "CREDIT") {
        await deductCredit(targetUserId, studio.id);
      }
      return upserted;
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

    // CONFIRMED bookings get an immediate confirmation push and a
    // scheduled 1-hour-before reminder. Waitlisted bookings produce no
    // notification — the response carries the queue position so the
    // member sees it inline.
    if (booking.status === BookingStatus.CONFIRMED) {
      const member = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { firstName: true, lastName: true },
      });
      const data = {
        memberName:
          [member?.firstName, member?.lastName].filter(Boolean).join(" ") ||
          "",
        className: session.title,
        instructorName:
          [session.instructor.firstName, session.instructor.lastName]
            .filter(Boolean)
            .join(" ") || "",
        date: formatDateTime(session.startTime, studio.timezone),
        time: new Intl.DateTimeFormat("en-GB", {
          timeZone: studio.timezone,
          hour: "2-digit",
          minute: "2-digit",
        }).format(session.startTime),
      };

      await enqueueNotification({
        type: "booking_confirmed",
        userId: targetUserId,
        studioId: studio.id,
        data,
      });
      const reminderJobId = await scheduleBookingReminder({
        userId: targetUserId,
        studioId: studio.id,
        data: { className: data.className, time: data.time },
        classStart: session.startTime,
      });
      if (reminderJobId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderJobId },
        });
      }
    }

    return ok(
      {
        booking: {
          id: booking.id,
          classId: booking.classId,
          status: booking.status,
          creditsUsed: booking.creditsUsed,
          waitlistPosition,
          creditSource: credit.kind,
        },
      },
      { status: 201 },
    );
  });
}
