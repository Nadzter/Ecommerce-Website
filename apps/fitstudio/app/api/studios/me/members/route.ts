import { z } from "zod";

import { ApiErrors, ok, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

const querySchema = z.object({
  role: z.enum(["OWNER", "STAFF", "MEMBER"]).optional(),
  excludeClassId: z.string().optional(),
  q: z.string().optional(),
});

/**
 * List users that belong to the current studio. Used by staff dashboards
 * (member roster, manual booking selector). The `excludeClassId` filter
 * removes anyone who already has an active booking for that class so the
 * "book a member into a private session" UI never offers a duplicate.
 */
export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const ctx = await getAuthContext();
    if (!ctx) throw ApiErrors.unauthorized();
    if (ctx.studioId !== studio.id) throw ApiErrors.forbidden();
    if (ctx.user.role !== "OWNER" && ctx.user.role !== "STAFF") {
      throw ApiErrors.forbidden("Only owners and staff can list members");
    }

    const url = new URL(request.url);
    const filters = querySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );

    let excludedUserIds: string[] = [];
    if (filters.excludeClassId) {
      const existing = await prisma.booking.findMany({
        where: {
          studioId: studio.id,
          classId: filters.excludeClassId,
          status: { in: ["CONFIRMED", "WAITLISTED"] },
        },
        select: { userId: true },
      });
      excludedUserIds = existing.map((entry) => entry.userId);
    }

    const users = await prisma.user.findMany({
      where: {
        studioId: studio.id,
        ...(filters.role ? { role: filters.role } : {}),
        ...(excludedUserIds.length > 0
          ? { id: { notIn: excludedUserIds } }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { firstName: { contains: filters.q, mode: "insensitive" } },
                { lastName: { contains: filters.q, mode: "insensitive" } },
                { email: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { email: "asc" }],
      take: 200,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return ok({ users });
  });
}
