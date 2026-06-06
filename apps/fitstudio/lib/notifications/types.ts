import type { Language } from "@/prisma/generated/client";

/**
 * Every notification the system can fire. Adding a new type requires
 * updates in three places: this union, `messages.ts`, and (optionally) a
 * React Email template if the email channel is used.
 */
export type NotificationType =
  | "booking_confirmed"
  | "booking_reminder"
  | "waitlist_promoted"
  | "booking_cancelled"
  | "payment_received"
  | "membership_expiring"
  | "win_back";

/**
 * Template data accepted by every notification type. Each handler
 * picks the fields it needs; unused keys are ignored. Keeping a single
 * shape simplifies the BullMQ payload (JSON-serialisable) and the
 * `sendNotification(type, ..., data)` signature.
 */
export interface NotificationData {
  memberName?: string;
  className?: string;
  instructorName?: string;
  date?: string;
  time?: string;
  studioName?: string;
  membershipName?: string;
  amount?: string;
  currency?: string;
  invoiceUrl?: string;
  expiryDate?: string;
  renewUrl?: string;
  daysSince?: number;
  offerUrl?: string;
  cancellationLink?: string;
}

export interface NotificationJobPayload {
  type: NotificationType;
  userId: string;
  studioId: string;
  data: NotificationData;
  language?: Language;
}
