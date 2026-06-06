import { createElement, type ReactElement } from "react";
import { Resend } from "resend";

import BookingConfirmationEmail from "@/emails/BookingConfirmationEmail";
import BookingReminderEmail from "@/emails/BookingReminderEmail";
import MembershipExpiringEmail from "@/emails/MembershipExpiringEmail";
import PaymentReceivedEmail from "@/emails/PaymentReceivedEmail";
import WaitlistPromotedEmail from "@/emails/WaitlistPromotedEmail";

import { formatMessage, messages } from "./messages";
import type {
  NotificationData,
  NotificationType,
} from "./types";
import type { Language } from "@/prisma/generated/client";

let clientSingleton: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!clientSingleton) clientSingleton = new Resend(key);
  return clientSingleton;
}

interface EmailContext {
  to: string;
  studio: { name: string; primaryColor: string; logoUrl: string | null };
  language: Language;
  data: NotificationData;
}

/**
 * Build the React Email element to render for each notification type.
 * Returns `null` when the type does not have an email template (e.g.
 * `win_back` ships only as WhatsApp text).
 */
function pickTemplate(
  type: NotificationType,
  ctx: EmailContext,
): ReactElement | null {
  const studio = ctx.studio;
  const d = ctx.data;
  switch (type) {
    case "booking_confirmed":
      return createElement(BookingConfirmationEmail, {
        studio,
        memberName: d.memberName ?? "",
        className: d.className ?? "",
        instructorName: d.instructorName ?? "",
        date: d.date ?? "",
        time: d.time ?? "",
        cancellationLink: d.cancellationLink,
      });
    case "booking_reminder":
      return createElement(BookingReminderEmail, {
        studio,
        className: d.className ?? "",
        time: d.time ?? "",
      });
    case "waitlist_promoted":
      return createElement(WaitlistPromotedEmail, {
        studio,
        className: d.className ?? "",
        date: d.date ?? "",
      });
    case "payment_received":
      return createElement(PaymentReceivedEmail, {
        studio,
        membershipName: d.membershipName ?? "",
        amount: d.amount ?? "",
        currency: d.currency ?? "",
        invoiceUrl: d.invoiceUrl,
      });
    case "membership_expiring":
      return createElement(MembershipExpiringEmail, {
        studio,
        membershipName: d.membershipName ?? "",
        expiryDate: d.expiryDate ?? "",
        renewUrl: d.renewUrl ?? "",
      });
    case "booking_cancelled":
    case "win_back":
      return null;
  }
}

export interface EmailSendResult {
  delivered: boolean;
  messageId?: string;
  reason?: string;
}

/**
 * Send an email via Resend. Uses the React Email template when one
 * exists; otherwise renders the WhatsApp message as plain text. In
 * non-production environments without an API key we log the payload to
 * the console so worker tests don't require credentials.
 */
export async function sendEmail(
  type: NotificationType,
  ctx: EmailContext,
): Promise<EmailSendResult> {
  const langBundle = messages[ctx.language];
  const tmpl = langBundle[type];
  if (!tmpl) {
    return { delivered: false, reason: "no_template" };
  }
  const subject = tmpl.subject ? formatMessage(tmpl.subject, ctx.data) : "";

  const client = getClient();
  const from = process.env.RESEND_FROM;
  if (!client || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email] (dev) would send", {
        to: ctx.to,
        subject,
        body: formatMessage(tmpl.whatsapp, ctx.data),
      });
      return { delivered: true, reason: "dev_console" };
    }
    return { delivered: false, reason: "not_configured" };
  }

  const react = pickTemplate(type, ctx);
  try {
    const response = await client.emails.send({
      from,
      to: ctx.to,
      subject,
      ...(react
        ? { react }
        : { text: formatMessage(tmpl.whatsapp, ctx.data) }),
    });
    if (response.error) {
      return { delivered: false, reason: response.error.message };
    }
    return { delivered: true, messageId: response.data?.id };
  } catch (error) {
    console.error("[email] send failed", error);
    return {
      delivered: false,
      reason: error instanceof Error ? error.message : "unknown",
    };
  }
}
