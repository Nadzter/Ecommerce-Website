import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encodeRecurringRule, expandRecurringRule } from "@/lib/recurring";
import { getCurrentStudio } from "@/lib/tenant";
import {
  createClassSchema,
  listClassesQuerySchema,
} from "@/lib/zod";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const url = new URL(request.url);
    const filters = listClassesQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );

    const where: Prisma.ClassWhereInput = {
      studioId: studio.id,
    };
    if (filters.from) {
      where.startTime = { ...where.startTime, gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.startTime = { ...where.startTime, lte: new Date(filters.to) };
    }
    if (filters.instructorId) {
      where.instructorId = filters.instructorId;
    }
    if (filters.sessionType) {
      where.sessionType = filters.sessionType;
    }
    if (filters.location) {
      where.location = filters.location;
    }
    if (!filters.includeCancelled) {
      where.cancelledAt = null;
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: {
            bookings: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
      take: 500,
    });

    return ok({
      classes: classes.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        capacity: row.capacity,
        booked: row._count.bookings,
        instructor: row.instructor,
        location: row.location,
        sessionType: row.sessionType,
        equipment: row.equipment,
        isRecurring: row.isRecurring,
        cancelledAt: row.cancelledAt?.toISOString() ?? null,
      })),
    });
  });
}

export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const ctx = await getAuthContext();
    if (!ctx) throw ApiErrors.unauthorized();
    if (ctx.studioId !== studio.id) throw ApiErrors.forbidden();
    if (ctx.user.role !== "OWNER" && ctx.user.role !== "STAFF") {
      throw ApiErrors.forbidden("Only owners and staff can create classes");
    }

    const input = await parseBody(request, createClassSchema);

    const instructor = await prisma.user.findFirst({
      where: { id: input.instructorId, studioId: studio.id },
    });
    if (!instructor) {
      throw ApiErrors.badRequest("Instructor does not belong to this studio");
    }
    if (instructor.role === "MEMBER") {
      throw ApiErrors.badRequest("Instructor must be an OWNER or STAFF user");
    }

    const seedStart = new Date(input.startTime);
    const seedEnd = new Date(input.endTime);

    // Equipment array, when set, caps the headline capacity so capacity is
    // never overstated relative to physical resources.
    const effectiveCapacity =
      input.equipment.length > 0
        ? Math.min(input.equipment.length, input.capacity)
        : input.capacity;

    const occurrences = input.recurring
      ? expandRecurringRule(seedStart, seedEnd, input.recurring)
      : [{ startTime: seedStart, endTime: seedEnd }];

    const recurringGroupId = input.recurring ? randomUUID() : null;
    const recurringRule = input.recurring
      ? encodeRecurringRule(input.recurring)
      : null;

    const rows: Prisma.ClassCreateManyInput[] = occurrences.map(
      (occurrence) => ({
        studioId: studio.id,
        title: input.title,
        description: input.description ?? null,
        instructorId: input.instructorId,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        capacity: effectiveCapacity,
        location: input.location,
        sessionType: input.sessionType,
        equipment: input.equipment,
        zoomLink: input.zoomLink ?? null,
        isRecurring: Boolean(input.recurring),
        recurringRule,
        recurringGroupId,
      }),
    );

    const result = await prisma.class.createManyAndReturn({ data: rows });

    return ok(
      {
        created: result.length,
        recurringGroupId,
        classes: result.map((row) => ({
          id: row.id,
          startTime: row.startTime.toISOString(),
          endTime: row.endTime.toISOString(),
        })),
      },
      { status: 201 },
    );
  });
}
