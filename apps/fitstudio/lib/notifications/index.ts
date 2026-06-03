import type { Language } from "@/prisma/generated/client";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "./email";
import { formatMessage, messages } from "./messages";
import { enqueueNotification } from "./queue";
import type {
  NotificationData,
  NotificationJobPayload,
  NotificationType,
} from "./types";
import { sendWhatsApp } from "./whatsapp";

export {
  enqueueNotification,
  removeNotificationJob,
} from "./queue";
export type {
  NotificationData,
  NotificationJobPayload,
  NotificationType,
} from "./types";

/**
 * Default per-studio setting when no row exists yet. Keeps every type
 * "on" so a freshly-onboarded studio still gets the core messages.
 */
const DEFAULT_ENABLED: readonly NotificationType[] = [
  "booking_confirmed",
  "booking_reminder",
  "waitlist_promoted",
  "booking_cancelled",
  "payment_received",
  "membership_expiring",
] as const;

interface NotificationResult {
  channel: "whatsapp" | "email" | "skipped";
  delivered: boolean;
  reason?: string;
}

/**
 * Hydrate the user + studio + studio notification settings for a job
 * and decide whether the notification should fire at all.
 */
async function loadContext(payload: NotificationJobPayload) {
  const [user, studio, settings] = await Promise.all([
    prisma.user.findFirst({
      where: { id: payload.userId, studioId: payload.studioId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        language: true,
      },
    }),
    prisma.studio.findUnique({
      where: { id: payload.studioId },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        logoUrl: true,
      },
    }),
    prisma.studioNotificationSettings.findUnique({
      where: { studioId: payload.studioId },
    }),
  ]);
  if (!user || !studio) return null;

  const enabled = settings
    ? new Set(settings.enabledTypes)
    : new Set<string>(DEFAULT_ENABLED);
  const language: Language =
    payload.language ?? user.language ?? settings?.defaultLanguage ?? "en";
  return { user, studio, enabled, language };
}

/**
 * Central notification dispatcher. The worker invokes this; route
 * handlers never call it directly — they enqueue via
 * {@link enqueueNotification} so the request thread stays fast.
 */
export async function sendNotification(
  payload: NotificationJobPayload,
): Promise<NotificationResult> {
  const ctx = await loadContext(payload);
  if (!ctx) return { channel: "skipped", delivered: false, reason: "not_found" };
  if (!ctx.enabled.has(payload.type)) {
    return { channel: "skipped", delivered: false, reason: "disabled" };
  }

  const tmpl = messages[ctx.language][payload.type];
  const body = formatMessage(tmpl.whatsapp, payload.data);

  // WhatsApp first when a phone number is on file.
  if (ctx.user.phone) {
    const result = await sendWhatsApp(ctx.user.phone, body);
    if (result.delivered) {
      return {
        channel: "whatsapp",
        delivered: true,
        reason: result.reason,
      };
    }
    // Fall through to email on WhatsApp failure.
  }

  // Email fallback (or primary when no phone is on file).
  const emailResult = await sendEmail(payload.type, {
    to: ctx.user.email,
    studio: {
      name: ctx.studio.name,
      primaryColor: ctx.studio.primaryColor,
      logoUrl: ctx.studio.logoUrl,
    },
    language: ctx.language,
    data: payload.data,
  });
  return {
    channel: "email",
    delivered: emailResult.delivered,
    reason: emailResult.reason,
  };
}

/**
 * Convenience: schedule the booking_reminder 1 hour before class.
 * Returns the BullMQ job id so the caller can persist it on
 * `Booking.reminderJobId`. Returns `null` if the class is already
 * within the next hour (no reminder needed).
 */
export async function scheduleBookingReminder(args: {
  userId: string;
  studioId: string;
  data: NotificationData;
  classStart: Date;
  now?: Date;
}): Promise<string | null> {
  const now = args.now ?? new Date();
  const delayMs = args.classStart.getTime() - 60 * 60 * 1000 - now.getTime();
  if (delayMs <= 0) return null;
  return enqueueNotification(
    {
      type: "booking_reminder",
      userId: args.userId,
      studioId: args.studioId,
      data: args.data,
    },
    delayMs,
  );
}

/**
 * Re-export so call sites that need to drop a scheduled reminder
 * (booking cancellation, class cancellation) can import a single
 * namespace.
 */
export { removeNotificationJob as cancelReminder } from "./queue";
