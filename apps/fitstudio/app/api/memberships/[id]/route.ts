import { z } from "zod";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

const patchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional().nullable(),
    classCount: z.number().int().min(1).max(10_000).optional().nullable(),
    price: z.coerce.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    await requireOwner();
    const studio = await getCurrentStudio();
    const input = await parseBody(request, patchSchema);

    const existing = await prisma.membership.findFirst({
      where: { id: context.params.id, studioId: studio.id },
    });
    if (!existing) throw ApiErrors.notFound("Membership plan not found");

    const updated = await prisma.membership.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.classCount !== undefined
          ? { classCount: input.classCount }
          : {}),
        ...(input.price !== undefined ? { price: input.price.toFixed(2) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    return ok({
      membership: {
        id: updated.id,
        isActive: updated.isActive,
      },
    });
  });
}
