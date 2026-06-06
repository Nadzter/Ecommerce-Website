import { z } from "zod";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTIFICATION_TYPES = [
  "booking_confirmed",
  "booking_reminder",
  "waitlist_promoted",
  "booking_cancelled",
  "payment_received",
  "membership_expiring",
  "win_back",
] as const;

const DEFAULT_ENABLED = [
  "booking_confirmed",
  "booking_reminder",
  "waitlist_promoted",
  "booking_cancelled",
  "payment_received",
  "membership_expiring",
];

const patchSchema = z.object({
  enabledTypes: z.array(z.enum(NOTIFICATION_TYPES)).optional(),
  defaultLanguage: z.enum(["es", "en", "ar"]).optional(),
});

export async function GET(): Promise<Response> {
  return withApi(async () => {
    await requireOwner();
    const studio = await getCurrentStudio();
    const existing = await prisma.studioNotificationSettings.findUnique({
      where: { studioId: studio.id },
    });
    return ok({
      settings: {
        enabledTypes: existing?.enabledTypes ?? DEFAULT_ENABLED,
        defaultLanguage: existing?.defaultLanguage ?? studio.language,
      },
      available: NOTIFICATION_TYPES,
    });
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return withApi(async () => {
    await requireOwner();
    const studio = await getCurrentStudio();
    const input = await parseBody(request, patchSchema);
    if (
      input.enabledTypes === undefined &&
      input.defaultLanguage === undefined
    ) {
      throw ApiErrors.badRequest("Provide enabledTypes and/or defaultLanguage");
    }

    const upserted = await prisma.studioNotificationSettings.upsert({
      where: { studioId: studio.id },
      create: {
        studioId: studio.id,
        enabledTypes: input.enabledTypes ?? DEFAULT_ENABLED,
        defaultLanguage: input.defaultLanguage ?? studio.language,
      },
      update: {
        ...(input.enabledTypes !== undefined
          ? { enabledTypes: input.enabledTypes }
          : {}),
        ...(input.defaultLanguage !== undefined
          ? { defaultLanguage: input.defaultLanguage }
          : {}),
      },
    });

    return ok({
      settings: {
        enabledTypes: upserted.enabledTypes,
        defaultLanguage: upserted.defaultLanguage,
      },
    });
  });
}
