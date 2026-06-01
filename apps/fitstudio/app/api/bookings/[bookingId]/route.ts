import { BookingStatus } from "@prisma/client";

import { ApiErrors, ok, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { cancelAndRefund } from "@/lib/booking";
import { canMemberCancel } from "@/lib/booking-rules";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";
import { promoteNextFromWaitlist } from "@/lib/waitlist";

export const runtime = "nodejs";

interface RouteContext {
  params: { bookingId: string };
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const ctx = await getAuthContext();
    if (!ctx) throw ApiErrors.unauthorized();
    if (ctx.studioId !== studio.id) throw ApiErrors.forbidden();

    const booking = await prisma.booking.findFirst({
      where: { id: context.params.bookingId, studioId: studio.id },
      include: { class: true },
    });
    if (!booking) throw ApiErrors.notFound("Booking not found");

    const isOwnerOrStaff =
      ctx.user.role === "OWNER" || ctx.user.role === "STAFF";
    if (!isOwnerOrStaff && booking.userId !== ctx.user.id) {
      throw ApiErrors.forbidden("You can only cancel your own bookings");
    }
    if (
      !isOwnerOrStaff &&
      booking.status === BookingStatus.CONFIRMED &&
      !canMemberCancel(booking.class.startTime)
    ) {
      throw ApiErrors.conflict(
        "Bookings can only be cancelled more than 2 hours before class start",
      );
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw ApiErrors.conflict("Booking is already cancelled");
    }

    const result = await cancelAndRefund(booking.id);

    let promoted: { promotedBookingId: string | null; userId: string | null } =
      { promotedBookingId: null, userId: null };
    if (result.wasConfirmed && booking.class.cancelledAt === null) {
      promoted = await promoteNextFromWaitlist(booking.classId, studio.id);
    }

    return ok({
      cancelledBookingId: booking.id,
      refunded: result.refunded,
      promoted,
    });
  });
}
