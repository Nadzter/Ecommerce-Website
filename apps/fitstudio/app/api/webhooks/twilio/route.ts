import twilio from "twilio";

import { BookingStatus, type Language } from "@/prisma/generated/client";
import { cancelAndRefund } from "@/lib/booking";
import {
  runAgentBlocking,
  type ChatUserTurn,
} from "@/lib/chatbot/agent";
import {
  buildSystemPrompt,
  loadChatbotContext,
} from "@/lib/chatbot/systemPrompt";
import {
  enqueueNotification,
  removeNotificationJob,
} from "@/lib/notifications";
import { getRedisConnection } from "@/lib/notifications/queue";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { promoteNextFromWaitlist } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TWIML_HEADERS = { "content-type": "text/xml; charset=utf-8" };
const CHAT_HISTORY_TURNS = 10;
const CHAT_HISTORY_TTL_SECONDS = 24 * 60 * 60;

interface HelpCopy {
  greeting: string;
  cancel: string;
  help: string;
  cancelledOk: string;
  cancelledNone: string;
  unknownStudio: string;
  notFound: string;
}

const COPY: Record<Language, HelpCopy> = {
  es: {
    greeting: "Soy el bot de tu estudio.",
    cancel: "Escribe CANCELAR para cancelar tu próxima clase.",
    help: "Escribe AYUDA para ver las opciones. También puedes hacerme preguntas.",
    cancelledOk: "Tu reserva ha sido cancelada. ¡Hasta pronto!",
    cancelledNone: "No tienes ninguna reserva confirmada próximamente.",
    unknownStudio:
      "No reconozco este número de estudio. Verifica que el estudio haya configurado WhatsApp.",
    notFound:
      "No encontramos un miembro con este número. Inicia sesión en el portal y guarda tu número de teléfono.",
  },
  en: {
    greeting: "I'm your studio's assistant.",
    cancel: "Reply CANCEL to cancel your next booking.",
    help: "Reply HELP to see the options, or just ask me a question.",
    cancelledOk: "Your booking has been cancelled. See you soon!",
    cancelledNone: "You have no upcoming confirmed bookings.",
    unknownStudio:
      "We don't recognise this studio number — the studio may not have WhatsApp configured.",
    notFound:
      "We couldn't find a member with this phone. Sign in to the member portal and save your phone number.",
  },
  ar: {
    greeting: "أنا مساعد الاستوديو الآلي.",
    cancel: "اكتب إلغاء لإلغاء أقرب حصة.",
    help: "اكتب مساعدة لرؤية الخيارات، أو اسألني سؤالاً مباشرة.",
    cancelledOk: "تم إلغاء حجزك. نراك قريباً!",
    cancelledNone: "لا توجد حصص مؤكدة قادمة.",
    unknownStudio: "لم نتعرف على رقم الاستوديو هذا.",
    notFound:
      "لم نجد عضواً بهذا الرقم. سجّل الدخول إلى البوابة وأضف رقم هاتفك.",
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

async function readTwilioFormParams(
  request: Request,
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([key, value]) => [key, String(value ?? "")]),
    );
  }
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [key, value] of params) out[key] = value;
  return out;
}

function historyKey(studioId: string, phone: string): string {
  return `chat:${studioId}:${phone}:history`;
}

/**
 * Read the last `CHAT_HISTORY_TURNS` messages for this member, oldest
 * first. Each entry is JSON-encoded `{role, content}`.
 */
async function loadChatHistory(
  studioId: string,
  phone: string,
): Promise<ChatUserTurn[]> {
  const redis = getRedisConnection();
  const raw = await redis.lrange(historyKey(studioId, phone), 0, -1);
  const parsed: ChatUserTurn[] = [];
  for (const entry of raw) {
    try {
      const value = JSON.parse(entry) as ChatUserTurn;
      if (
        (value.role === "user" || value.role === "assistant") &&
        typeof value.content === "string"
      ) {
        parsed.push(value);
      }
    } catch {
      // Skip malformed entries.
    }
  }
  return parsed;
}

/**
 * Append the new user message + assistant reply to the rolling history.
 * `LTRIM` keeps only the most recent CHAT_HISTORY_TURNS messages so the
 * key never grows unbounded; the TTL resets on every write.
 */
async function appendChatHistory(
  studioId: string,
  phone: string,
  entries: ChatUserTurn[],
): Promise<void> {
  if (entries.length === 0) return;
  const redis = getRedisConnection();
  const key = historyKey(studioId, phone);
  const serialised = entries.map((entry) => JSON.stringify(entry));
  await redis.rpush(key, ...serialised);
  await redis.ltrim(key, -CHAT_HISTORY_TURNS, -1);
  await redis.expire(key, CHAT_HISTORY_TTL_SECONDS);
}

/**
 * Resolve the studio for an inbound message by matching the Twilio `To`
 * field against `Studio.whatsappFrom`. Replaces the phase 4 fallback
 * that picked the most-recent account globally.
 */
async function resolveStudioFromInbound(
  toRaw: string,
): Promise<{ id: string; timezone: string; language: Language } | null> {
  const normalised = toRaw.trim();
  if (!normalised) return null;
  return prisma.studio.findUnique({
    where: { whatsappFrom: normalised },
    select: { id: true, timezone: true, language: true },
  });
}

async function findStudioMember(
  studioId: string,
  phone: string,
): Promise<{
  id: string;
  language: Language;
} | null> {
  const user = await prisma.user.findFirst({
    where: { studioId, phone },
    select: { id: true, language: true },
    orderBy: { createdAt: "desc" },
  });
  return user;
}

/**
 * Twilio inbound WhatsApp webhook. Returns TwiML so Twilio replies to
 * the sender with whatever we put in `Message`. Phase 5 adds chatbot
 * fallback: when the message doesn't match CANCEL / HELP we route it to
 * Claude with the last 10 turns of Redis-backed history.
 */
export async function POST(request: Request): Promise<Response> {
  const params = await readTwilioFormParams(request);
  const body = (params.Body ?? "").trim();
  const from = params.From ?? "";
  const to = params.To ?? "";
  if (!body || !from || !to) {
    return new Response(buildTwiml("Missing body, sender, or recipient."), {
      headers: TWIML_HEADERS,
    });
  }

  const studio = await resolveStudioFromInbound(to);
  if (!studio) {
    return new Response(buildTwiml(COPY.en.unknownStudio), {
      headers: TWIML_HEADERS,
    });
  }
  const phone = normalisePhone(from);
  const user = await findStudioMember(studio.id, phone);
  const language: Language = user?.language ?? studio.language;
  const copy = COPY[language];

  if (!user) {
    return new Response(buildTwiml(copy.notFound), { headers: TWIML_HEADERS });
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
        studioId: studio.id,
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

    await removeNotificationJob(nextBooking.reminderJobId);
    const result = await cancelAndRefund(nextBooking.id);

    const dateLabel = formatDateTime(
      nextBooking.class.startTime,
      studio.timezone,
    );
    await enqueueNotification({
      type: "booking_cancelled",
      userId: user.id,
      studioId: studio.id,
      data: { className: nextBooking.class.title, date: dateLabel },
    });

    if (result.wasConfirmed && nextBooking.class.cancelledAt === null) {
      const promoted = await promoteNextFromWaitlist(
        nextBooking.classId,
        studio.id,
      );
      if (promoted.promotedBookingId && promoted.userId) {
        await enqueueNotification({
          type: "waitlist_promoted",
          userId: promoted.userId,
          studioId: studio.id,
          data: { className: nextBooking.class.title, date: dateLabel },
        });
      }
    }

    return new Response(buildTwiml(copy.cancelledOk), {
      headers: TWIML_HEADERS,
    });
  }

  // --- Chatbot fallback -------------------------------------------------
  const chatCtx = await loadChatbotContext({
    userId: user.id,
    studioId: studio.id,
  });
  if (!chatCtx) {
    return new Response(buildTwiml(copy.notFound), { headers: TWIML_HEADERS });
  }

  const previous = await loadChatHistory(studio.id, phone);
  const history: ChatUserTurn[] = [
    ...previous,
    { role: "user", content: body },
  ];

  let assistantReply: string;
  try {
    assistantReply = await runAgentBlocking({
      userId: user.id,
      studioId: studio.id,
      systemPrompt: buildSystemPrompt(chatCtx),
      history,
    });
  } catch (error) {
    console.error("[twilio-chatbot] agent error", error);
    return new Response(
      buildTwiml(
        language === "es"
          ? "Hubo un problema con el asistente. Intenta de nuevo en un momento."
          : language === "ar"
            ? "حدث خطأ. حاول مرة أخرى بعد قليل."
            : "There was a problem with the assistant. Please try again shortly.",
      ),
      { headers: TWIML_HEADERS },
    );
  }

  await appendChatHistory(studio.id, phone, [
    { role: "user", content: body },
    { role: "assistant", content: assistantReply },
  ]);

  return new Response(buildTwiml(assistantReply), { headers: TWIML_HEADERS });
}
