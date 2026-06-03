import twilio from "twilio";

import { BookingStatus, type Language } from "@/prisma/generated/client";
import { cancelAndRefund } from "@/lib/booking";
import {
  enqueueNotification,
  removeNotificationJob,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { promoteNextFromWaitlist } from "@/lib/waitlist";

export const runtime = "nodejs";

const TWIML_HEADERS = { "content-type": "text/xml; charset=utf-8" };

interface HelpCopy {
  greeting: string;
  cancel: string;
  help: string;
  fallback: string;
  cancelledOk: string;
  cancelledNone: string;
}

const COPY: Record<Language, HelpCopy> = {
  es: {
    greeting: "Soy el bot de tu estudio.",
    cancel: "Escribe CANCELAR para cancelar tu próxima clase.",
    help: "Escribe AYUDA para ver las opciones.",
    fallback:
      "Lo siento, aún no entiendo otros mensajes. Escribe AYUDA o CANCELAR.",
    cancelledOk:
      "Tu reserva ha sido cancelada. ¡Hasta pronto!",
    cancelledNone:
      "No tienes ninguna reserva confirmada próximamente.",
  },
  en: {
    greeting: "I'm your studio's assistant.",
    cancel: "Reply CANCEL to cancel your next booking.",
    help: "Reply HELP to see what I can do.",
    fallback:
      "I don't understand that yet. Try HELP or CANCEL.",
    cancelledOk: "Your booking has been cancelled. See you soon!",
    cancelledNone: "You have no upcoming confirmed bookings.",
  },
  ar: {
    greeting: "أنا مساعد الاستوديو الآلي.",
    cancel: "اكتب إلغاء لإلغاء أقرب حصة.",
    help: "اكتب مساعدة لرؤية الخيارات.",
    fallback: "لا أفهم هذه الرسالة بعد. اكتب مساعدة أو إلغاء.",
    cancelledOk: "تم إلغاء حجزك. نراك قريباً!",
    cancelledNone: "لا توجد حصص مؤكدة قادمة.",
  },
};

function buildTwiml(message: string): string {
  const response = new twilio.twiml.MessagingResponse();
  response.message(message);
  return response.toString();
}

function normalisePhone(raw: string): string {
  return raw.replace(/^whatsapp:/, "").trim();
}

function matchesCancel(body: string): boolean {
  const cleaned = body.toLowerCase();
  return (
    cleaned.includes("cancelar") ||
    cleaned.includes("cancel") ||
    cleaned.includes("إلغاء")
  );
}

function matchesHelp(body: string): boolean {
  const cleaned = body.toLowerCase();
  return (
    cleaned.includes("ayuda") ||
    cleaned.includes("help") ||
    cleaned.includes("مساعدة")
  );
}

async function findUserByPhone(phone: string) {
  // A member may exist in multiple studios. Prefer the most recently
  // created account so a freshly-joined studio wins. Phase 5 will use
  // the inbound Twilio `To` (the studio's number) to disambiguate.
  return prisma.user.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
    include: { studio: { select: { id: true, timezone: true } } },
  });
}

async function readTwilioFormParams(
  request: Request,
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  let raw = "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([key, value]) => [key, String(value ?? "")]),
    );
  }
  raw = await request.text();
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [key, value] of params) out[key] = value;
  return out;
}

/**
 * Twilio inbound WhatsApp webhook. Returns TwiML so Twilio replies to
 * the sender with whatever we put in `Message`. Phase 5 will replace the
 * fallback path with the AI assistant.
 */
export async function POST(request: Request): Promise<Response> {
  const params = await readTwilioFormParams(request);
  const body = (params.Body ?? "").trim();
  const from = params.From ?? "";
  if (!body || !from) {
    return new Response(buildTwiml("Missing body or sender."), {
      headers: TWIML_HEADERS,
    });
  }

  const phone = normalisePhone(from);
  const user = await findUserByPhone(phone);
  const language: Language = user?.language ?? "en";
  const copy = COPY[language];

  if (!user) {
    return new Response(
      buildTwiml(
        "We could not find a FitStudio member with this phone. Sign in to the member portal to enable WhatsApp updates.",
      ),
      { headers: TWIML_HEADERS },
    );
  }

  if (matchesHelp(body)) {
    return new Response(
      buildTwiml(`${copy.greeting} ${copy.cancel} ${copy.help}`),
      { headers: TWIML_HEADERS },
    );
  }

  if (matchesCancel(body)) {
    const nextBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        studioId: user.studio.id,
        status: BookingStatus.CONFIRMED,
        class: { startTime: { gte: new Date() }, cancelledAt: null },
      },
      include: { class: true },
      orderBy: { class: { startTime: "asc" } },
    });
    if (!nextBooking) {
      return new Response(buildTwiml(copy.cancelledNone), {
        headers: TWIML_HEADERS,
      });
    }

    // Remove the reminder job first — same ordering as the HTTP DELETE
    // path so a follow-up cancel never lets a stale reminder fire.
    await removeNotificationJob(nextBooking.reminderJobId);
    const result = await cancelAndRefund(nextBooking.id);

    const dateLabel = formatDateTime(
      nextBooking.class.startTime,
      user.studio.timezone,
    );
    await enqueueNotification({
      type: "booking_cancelled",
      userId: user.id,
      studioId: user.studio.id,
      data: { className: nextBooking.class.title, date: dateLabel },
    });

    if (result.wasConfirmed && nextBooking.class.cancelledAt === null) {
      const promoted = await promoteNextFromWaitlist(
        nextBooking.classId,
        user.studio.id,
      );
      if (promoted.promotedBookingId && promoted.userId) {
        await enqueueNotification({
          type: "waitlist_promoted",
          userId: promoted.userId,
          studioId: user.studio.id,
          data: { className: nextBooking.class.title, date: dateLabel },
        });
      }
    }

    return new Response(buildTwiml(copy.cancelledOk), {
      headers: TWIML_HEADERS,
    });
  }

  // Phase 5 will route arbitrary text to the AI assistant. For now we
  // acknowledge so the sender doesn't think the channel is dead.
  return new Response(buildTwiml(copy.fallback), { headers: TWIML_HEADERS });
}
