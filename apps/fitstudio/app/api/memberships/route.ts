import { z } from "zod";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createMembershipSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional().nullable(),
    type: z.enum(["UNLIMITED", "CLASS_PACK", "DROP_IN"]),
    classCount: z.number().int().min(1).max(10_000).optional().nullable(),
    price: z.coerce.number().nonnegative(),
    currency: z.enum(["EUR", "AED", "USD", "LBP"]),
    billingInterval: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME"]),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.type === "CLASS_PACK"
        ? typeof value.classCount === "number" && value.classCount > 0
        : true,
    { message: "classCount is required for CLASS_PACK", path: ["classCount"] },
  );

export async function GET(request: Request): Promise<Response> {
  return withApi(async () => {
    const studio = await getCurrentStudio();
    const url = new URL(request.url);
    const onlyActive = url.searchParams.get("active") === "true";

    const memberships = await prisma.membership.findMany({
      where: {
        studioId: studio.id,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: [{ isActive: "desc" }, { type: "asc" }, { price: "asc" }],
    });

    return ok({
      memberships: memberships.map((entry) => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        type: entry.type,
        classCount: entry.classCount,
        price: entry.price.toString(),
        currency: entry.currency,
        billingInterval: entry.billingInterval,
        isActive: entry.isActive,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  });
}

export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    await requireOwner();
    const studio = await getCurrentStudio();
    const input = await parseBody(request, createMembershipSchema);

    if (input.currency !== studio.currency) {
      throw ApiErrors.badRequest(
        `Plan currency (${input.currency}) does not match studio currency (${studio.currency})`,
      );
    }

    const created = await prisma.membership.create({
      data: {
        studioId: studio.id,
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        classCount:
          input.type === "CLASS_PACK"
            ? (input.classCount ?? null)
            : null,
        price: input.price.toFixed(2),
        currency: input.currency,
        billingInterval: input.billingInterval,
        isActive: input.isActive ?? true,
      },
    });

    return ok({ membership: { id: created.id } }, { status: 201 });
  });
}
