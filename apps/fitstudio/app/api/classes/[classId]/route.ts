import { ApiErrors, ok, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { classId: string };
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const session = await prisma.class.findFirst({
      where: { id: context.params.classId, studioId: studio.id },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!session) throw ApiErrors.notFound("Class not found");

    return ok({
      class: {
        id: session.id,
        title: session.title,
        description: session.description,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        capacity: session.capacity,
        location: session.location,
        sessionType: session.sessionType,
        equipment: session.equipment,
        zoomLink: session.zoomLink,
        isRecurring: session.isRecurring,
        recurringRule: session.recurringRule,
        cancelledAt: session.cancelledAt?.toISOString() ?? null,
        instructor: session.instructor,
        bookings: session.bookings.map((booking) => ({
          id: booking.id,
          status: booking.status,
          checkedInAt: booking.checkedInAt?.toISOString() ?? null,
          createdAt: booking.createdAt.toISOString(),
          user: booking.user,
        })),
      },
    });
  });
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
    if (ctx.user.role !== "OWNER" && ctx.user.role !== "STAFF") {
      throw ApiErrors.forbidden("Only owners and staff can cancel classes");
    }

    const existing = await prisma.class.findFirst({
      where: { id: context.params.classId, studioId: studio.id },
      include: { bookings: { where: { status: "CONFIRMED" } } },
    });
    if (!existing) throw ApiErrors.notFound("Class not found");
    if (existing.cancelledAt) {
      throw ApiErrors.conflict("Class is already cancelled");
    }

    const result = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.class.update({
        where: { id: existing.id },
        data: { cancelledAt: new Date() },
      });
      const affected = await tx.booking.updateMany({
        where: {
          classId: existing.id,
          status: { in: ["CONFIRMED", "WAITLISTED"] },
        },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      return { cancelled, affected };
    });

    console.info("[classes] cancelled", {
      classId: existing.id,
      affectedBookings: result.affected.count,
    });

    return ok({
      classId: result.cancelled.id,
      cancelledAt: result.cancelled.cancelledAt?.toISOString() ?? null,
      cancelledBookings: result.affected.count,
    });
  });
}
