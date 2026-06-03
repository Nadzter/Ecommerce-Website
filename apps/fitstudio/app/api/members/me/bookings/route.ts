import { z } from "zod";

import { ApiErrors, ok, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { listActiveMemberships } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  scope: z.enum(["upcoming", "past", "all"]).default("upcoming"),
});

export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const ctx = await getAuthContext();
    if (!ctx) throw ApiErrors.unauthorized();
    if (ctx.studioId !== studio.id) throw ApiErrors.forbidden();

    const url = new URL(request.url);
    const { scope } = querySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );

    const now = new Date();
    const classFilter =
      scope === "upcoming"
        ? { startTime: { gte: now } }
        : scope === "past"
          ? { startTime: { lt: now } }
          : undefined;

    const bookings = await prisma.booking.findMany({
      where: {
        studioId: studio.id,
        userId: ctx.user.id,
        ...(classFilter ? { class: classFilter } : {}),
      },
      orderBy: [{ class: { startTime: scope === "past" ? "desc" : "asc" } }],
      include: {
        class: {
          include: {
            instructor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      take: 100,
    });

    const [memberships, userRow] = await Promise.all([
      listActiveMemberships(studio.id, ctx.user.id),
      prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { creditsBalance: true },
      }),
    ]);
    const hasUnlimited = memberships.some(
      (entry) => entry.membership.type === "UNLIMITED",
    );

    return ok({
      bookings: bookings.map((booking) => ({
        id: booking.id,
        status: booking.status,
        checkedInAt: booking.checkedInAt?.toISOString() ?? null,
        cancelledAt: booking.cancelledAt?.toISOString() ?? null,
        createdAt: booking.createdAt.toISOString(),
        class: {
          id: booking.class.id,
          title: booking.class.title,
          startTime: booking.class.startTime.toISOString(),
          endTime: booking.class.endTime.toISOString(),
          location: booking.class.location,
          sessionType: booking.class.sessionType,
          zoomLink: booking.class.zoomLink,
          cancelledAt: booking.class.cancelledAt?.toISOString() ?? null,
          instructor: booking.class.instructor,
        },
      })),
      memberships: memberships.map((row) => ({
        id: row.id,
        name: row.membership.name,
        type: row.membership.type,
        endsAt: row.endsAt?.toISOString() ?? null,
      })),
      credits: {
        balance: userRow?.creditsBalance ?? 0,
        hasUnlimited,
      },
    });
  });
}
