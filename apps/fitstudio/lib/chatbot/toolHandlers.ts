import { BookingStatus } from "@/prisma/generated/client";

import {
  cancelAndRefund,
  resolveCredit,
} from "@/lib/booking";
import { canMemberCancel } from "@/lib/booking-rules";
import { deductCredit } from "@/lib/credits";
import { formatCurrency } from "@/lib/currency";
import {
  enqueueNotification,
  removeNotificationJob,
  scheduleBookingReminder,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { promoteNextFromWaitlist } from "@/lib/waitlist";

interface ToolContext {
  userId: string;
  studioId: string;
}

/**
 * Discriminated union of all tool outputs. The chatbot agent JSON-
 * serialises these into `user.tool_result` content blocks for Claude.
 */
export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

function ok(data: unknown): ToolResult {
  return { ok: true, data };
}
function fail(error: string): ToolResult {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// list_upcoming_classes
// ---------------------------------------------------------------------------

interface ListClassesArgs {
  date_from?: string;
  date_to?: string;
  instructor?: string;
  session_type?: "GROUP" | "PRIVATE" | "DUET" | "TRIO";
  spots_available_only?: boolean;
}

async function listUpcomingClasses(
  args: ListClassesArgs,
  ctx: ToolContext,
): Promise<ToolResult> {
  const studio = await prisma.studio.findUnique({
    where: { id: ctx.studioId },
    select: { timezone: true },
  });
  if (!studio) return fail("studio_not_found");

  const now = new Date();
  const from = args.date_from ? new Date(args.date_from) : now;
  const to = args.date_to ? new Date(args.date_to) : undefined;
  const instructorFilter = args.instructor?.trim();

  const classes = await prisma.class.findMany({
    where: {
      studioId: ctx.studioId,
      cancelledAt: null,
      startTime: { gte: from, ...(to ? { lte: to } : {}) },
      ...(args.session_type ? { sessionType: args.session_type } : {}),
      ...(instructorFilter
        ? {
            instructor: {
              OR: [
                { firstName: { contains: instructorFilter, mode: "insensitive" } },
                { lastName: { contains: instructorFilter, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      instructor: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { startTime: "asc" },
    take: 25,
  });

  const projected = classes.map((row) => {
    const seatsLeft = Math.max(row.capacity - row._count.bookings, 0);
    return {
      classId: row.id,
      title: row.title,
      instructorName:
        [row.instructor.firstName, row.instructor.lastName]
          .filter(Boolean)
          .join(" ") || "Instructor",
      startTime: row.startTime.toISOString(),
      startTimeLocal: formatDateTime(row.startTime, studio.timezone),
      endTime: row.endTime.toISOString(),
      spotsLeft: seatsLeft,
      capacity: row.capacity,
      sessionType: row.sessionType,
      location: row.location,
    };
  });

  const filtered = args.spots_available_only
    ? projected.filter((entry) => entry.spotsLeft > 0)
    : projected;

  return ok({ classes: filtered });
}

// ---------------------------------------------------------------------------
// get_my_bookings
// ---------------------------------------------------------------------------

interface BookingsArgs {
  status?: "upcoming" | "past" | "all";
}

async function getMyBookings(
  args: BookingsArgs,
  ctx: ToolContext,
): Promise<ToolResult> {
  const studio = await prisma.studio.findUnique({
    where: { id: ctx.studioId },
    select: { timezone: true },
  });
  if (!studio) return fail("studio_not_found");

  const scope = args.status ?? "upcoming";
  const now = new Date();
  const classFilter =
    scope === "upcoming"
      ? { startTime: { gte: now } }
      : scope === "past"
        ? { startTime: { lt: now } }
        : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      userId: ctx.userId,
      studioId: ctx.studioId,
      ...(classFilter ? { class: classFilter } : {}),
    },
    include: {
      class: {
        include: {
          instructor: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { class: { startTime: scope === "past" ? "desc" : "asc" } },
    take: 25,
  });

  return ok({
    bookings: bookings.map((booking) => ({
      bookingId: booking.id,
      className: booking.class.title,
      instructorName:
        [booking.class.instructor.firstName, booking.class.instructor.lastName]
          .filter(Boolean)
          .join(" ") || "Instructor",
      startTime: booking.class.startTime.toISOString(),
      startTimeLocal: formatDateTime(
        booking.class.startTime,
        studio.timezone,
      ),
      status: booking.status,
      checkedIn: Boolean(booking.checkedInAt),
    })),
  });
}

// ---------------------------------------------------------------------------
// book_class — mirrors POST /api/bookings exactly
// ---------------------------------------------------------------------------

async function bookClass(
  args: { classId?: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  if (!args.classId) return fail("classId is required");

  const [studio, member] = await Promise.all([
    prisma.studio.findUnique({
      where: { id: ctx.studioId },
      select: { timezone: true },
    }),
    prisma.user.findFirst({
      where: { id: ctx.userId, studioId: ctx.studioId },
      select: { firstName: true, lastName: true },
    }),
  ]);
  if (!studio || !member) return fail("studio_or_member_not_found");

  const session = await prisma.class.findFirst({
    where: { id: args.classId, studioId: ctx.studioId, cancelledAt: null },
    include: {
      instructor: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
  if (!session) return fail("class_not_found");
  if (session.startTime <= new Date()) {
    return fail("class_already_started");
  }
  if (session.sessionType !== "GROUP") {
    return fail(
      "private_session_requires_studio_booking — ask the front desk to book private/duet/trio sessions on your behalf",
    );
  }

  const existing = await prisma.booking.findUnique({
    where: { classId_userId: { classId: session.id, userId: ctx.userId } },
  });
  if (existing && existing.status !== BookingStatus.CANCELLED) {
    return fail("already_booked");
  }

  const credit = await resolveCredit(ctx.studioId, ctx.userId);
  if (credit.kind === "NONE") {
    return fail("no_credits — buy a membership at /membership before booking");
  }

  const seatsLeft = session.capacity - session._count.bookings;
  const willWaitlist = seatsLeft <= 0;
  const creditsUsed = credit.kind === "UNLIMITED" ? 0 : 1;

  const booking = await prisma.$transaction(async (tx) => {
    const upserted = await tx.booking.upsert({
      where: { classId_userId: { classId: session.id, userId: ctx.userId } },
      update: {
        status: willWaitlist
          ? BookingStatus.WAITLISTED
          : BookingStatus.CONFIRMED,
        creditsUsed: willWaitlist ? 0 : creditsUsed,
        cancelledAt: null,
      },
      create: {
        studioId: ctx.studioId,
        classId: session.id,
        userId: ctx.userId,
        status: willWaitlist
          ? BookingStatus.WAITLISTED
          : BookingStatus.CONFIRMED,
        creditsUsed: willWaitlist ? 0 : creditsUsed,
      },
    });
    if (!willWaitlist && credit.kind === "CREDIT") {
      await deductCredit(ctx.userId, ctx.studioId);
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

  if (booking.status === BookingStatus.CONFIRMED) {
    const data = {
      memberName:
        [member.firstName, member.lastName].filter(Boolean).join(" ") || "",
      className: session.title,
      instructorName:
        [session.instructor.firstName, session.instructor.lastName]
          .filter(Boolean)
          .join(" ") || "Instructor",
      date: formatDateTime(session.startTime, studio.timezone),
      time: new Intl.DateTimeFormat("en-GB", {
        timeZone: studio.timezone,
        hour: "2-digit",
        minute: "2-digit",
      }).format(session.startTime),
    };
    await enqueueNotification({
      type: "booking_confirmed",
      userId: ctx.userId,
      studioId: ctx.studioId,
      data,
    });
    const reminderJobId = await scheduleBookingReminder({
      userId: ctx.userId,
      studioId: ctx.studioId,
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

  return ok({
    success: true,
    bookingId: booking.id,
    status: booking.status,
    waitlistPosition,
    message:
      booking.status === BookingStatus.CONFIRMED
        ? `Confirmed ${session.title} on ${formatDateTime(session.startTime, studio.timezone)}.`
        : `Added to waitlist at position ${waitlistPosition ?? "?"} for ${session.title} on ${formatDateTime(session.startTime, studio.timezone)}.`,
  });
}

// ---------------------------------------------------------------------------
// cancel_booking — mirrors DELETE /api/bookings/[id]
// ---------------------------------------------------------------------------

async function cancelBooking(
  args: { bookingId?: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  if (!args.bookingId) return fail("bookingId is required");

  const booking = await prisma.booking.findFirst({
    where: {
      id: args.bookingId,
      studioId: ctx.studioId,
      userId: ctx.userId,
    },
    include: { class: true },
  });
  if (!booking) return fail("booking_not_found");
  if (booking.status === BookingStatus.CANCELLED) {
    return fail("already_cancelled");
  }
  if (
    booking.status === BookingStatus.CONFIRMED &&
    !canMemberCancel(booking.class.startTime)
  ) {
    return fail(
      "outside_cancellation_window — cancellations must be at least 2 hours before class start",
    );
  }

  await removeNotificationJob(booking.reminderJobId);
  const result = await cancelAndRefund(booking.id);

  const studio = await prisma.studio.findUnique({
    where: { id: ctx.studioId },
    select: { timezone: true },
  });
  const dateLabel = formatDateTime(
    booking.class.startTime,
    studio?.timezone ?? "UTC",
  );

  await enqueueNotification({
    type: "booking_cancelled",
    userId: ctx.userId,
    studioId: ctx.studioId,
    data: { className: booking.class.title, date: dateLabel },
  });

  if (result.wasConfirmed && booking.class.cancelledAt === null) {
    const promoted = await promoteNextFromWaitlist(
      booking.classId,
      ctx.studioId,
    );
    if (promoted.promotedBookingId && promoted.userId) {
      await enqueueNotification({
        type: "waitlist_promoted",
        userId: promoted.userId,
        studioId: ctx.studioId,
        data: { className: booking.class.title, date: dateLabel },
      });
    }
  }

  return ok({
    success: true,
    creditsRefunded: result.refunded ? booking.creditsUsed : 0,
    message: `Cancelled ${booking.class.title} on ${dateLabel}.${
      result.refunded ? " 1 credit was refunded." : ""
    }`,
  });
}

// ---------------------------------------------------------------------------
// get_my_credits
// ---------------------------------------------------------------------------

async function getMyCredits(ctx: ToolContext): Promise<ToolResult> {
  const user = await prisma.user.findFirst({
    where: { id: ctx.userId, studioId: ctx.studioId },
    select: { creditsBalance: true },
  });
  if (!user) return fail("member_not_found");

  const memberships = await prisma.userMembership.findMany({
    where: {
      studioId: ctx.studioId,
      userId: ctx.userId,
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    include: { membership: { select: { name: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });

  const active = memberships[0];
  return ok({
    creditsBalance: user.creditsBalance,
    activeMembership: active
      ? {
          name: active.membership.name,
          type: active.membership.type,
          expiresAt: active.endsAt?.toISOString() ?? null,
        }
      : null,
  });
}

// ---------------------------------------------------------------------------
// get_studio_info
// ---------------------------------------------------------------------------

interface StudioInfoArgs {
  topic?: "location" | "schedule" | "pricing" | "instructors" | "general";
}

async function getStudioInfo(
  args: StudioInfoArgs,
  ctx: ToolContext,
): Promise<ToolResult> {
  const studio = await prisma.studio.findUnique({
    where: { id: ctx.studioId },
    select: {
      name: true,
      address: true,
      email: true,
      timezone: true,
      country: true,
      currency: true,
      vatNumber: true,
      language: true,
    },
  });
  if (!studio) return fail("studio_not_found");

  const topic = args.topic ?? "general";

  if (topic === "instructors") {
    const instructors = await prisma.user.findMany({
      where: {
        studioId: ctx.studioId,
        role: { in: ["OWNER", "STAFF"] },
      },
      select: { firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return ok({
      topic,
      instructors: instructors.map((entry) => ({
        name:
          [entry.firstName, entry.lastName].filter(Boolean).join(" ") ||
          entry.email,
        email: entry.email,
      })),
    });
  }

  if (topic === "pricing") {
    const plans = await prisma.membership.findMany({
      where: { studioId: ctx.studioId, isActive: true },
      orderBy: [{ type: "asc" }, { price: "asc" }],
      take: 20,
    });
    return ok({
      topic,
      plans: plans.map((plan) => ({
        name: plan.name,
        description: plan.description,
        type: plan.type,
        classCount: plan.classCount,
        priceFormatted: formatCurrency(plan.price.toString(), plan.currency),
        billingInterval: plan.billingInterval,
      })),
    });
  }

  if (topic === "schedule") {
    const now = new Date();
    const upcoming = await prisma.class.count({
      where: { studioId: ctx.studioId, startTime: { gte: now } },
    });
    return ok({
      topic,
      timezone: studio.timezone,
      upcomingClassCount: upcoming,
      hint: "Call list_upcoming_classes for the actual schedule.",
    });
  }

  // location + general both return the static profile.
  return ok({
    topic,
    name: studio.name,
    address: studio.address,
    email: studio.email,
    timezone: studio.timezone,
    country: studio.country,
  });
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function runTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "list_upcoming_classes":
      return listUpcomingClasses(args as ListClassesArgs, ctx);
    case "get_my_bookings":
      return getMyBookings(args as BookingsArgs, ctx);
    case "book_class":
      return bookClass(args as { classId?: string }, ctx);
    case "cancel_booking":
      return cancelBooking(args as { bookingId?: string }, ctx);
    case "get_my_credits":
      return getMyCredits(ctx);
    case "get_studio_info":
      return getStudioInfo(args as StudioInfoArgs, ctx);
    default:
      return fail(`unknown_tool:${name}`);
  }
}
