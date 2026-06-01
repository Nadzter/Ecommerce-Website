import { BookingStatus } from "@prisma/client";

import { ApiErrors, ok, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

interface RouteContext {
  params: { bookingId: string };
}

/**
 * Mark a booking as checked-in. Only owners and staff can hit this
 * endpoint — typically via the QR scanner at /dashboard/checkin.
 */
export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const ctx = await getAuthContext();
    if (!ctx) throw ApiErrors.unauthorized();
    if (ctx.studioId !== studio.id) throw ApiErrors.forbidden();
    if (ctx.user.role !== "OWNER" && ctx.user.role !== "STAFF") {
      throw ApiErrors.forbidden("Only owners and staff can check members in");
    }

    const booking = await prisma.booking.findFirst({
      where: { id: context.params.bookingId, studioId: studio.id },
      include: {
        class: { select: { id: true, title: true, startTime: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!booking) throw ApiErrors.notFound("Booking not found");
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw ApiErrors.conflict(
        `Cannot check in a booking with status ${booking.status}`,
      );
    }
    if (booking.checkedInAt) {
      return ok({
        bookingId: booking.id,
        checkedInAt: booking.checkedInAt.toISOString(),
        alreadyCheckedIn: true,
        class: booking.class,
        user: booking.user,
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { checkedInAt: new Date() },
    });

    return ok({
      bookingId: updated.id,
      checkedInAt: updated.checkedInAt?.toISOString() ?? null,
      alreadyCheckedIn: false,
      class: booking.class,
      user: booking.user,
    });
  });
}
