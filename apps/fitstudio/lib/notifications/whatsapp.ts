import Twilio from "twilio";

let clientSingleton: ReturnType<typeof Twilio> | null = null;

function getClient(): ReturnType<typeof Twilio> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!clientSingleton) {
    clientSingleton = Twilio(sid, token);
  }
  return clientSingleton;
}

/**
 * Normalise the phone number we send WhatsApp to. Accepts the bare E.164
 * string (e.g. "+34612345678") or the already-prefixed form
 * ("whatsapp:+34612345678"). Returns the prefixed form Twilio expects.
 */
export function toWhatsAppAddress(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  if (!trimmed.startsWith("+")) {
    return `whatsapp:+${trimmed.replace(/[^0-9]/g, "")}`;
  }
  return `whatsapp:${trimmed}`;
}

export interface WhatsAppSendResult {
  delivered: boolean;
  messageSid?: string;
  reason?: string;
}

/**
 * Send a WhatsApp message via Twilio. In non-production environments we
 * log the body to the console instead so a developer can run the queue
 * without Twilio credentials.
 *
 * Returns a structured result so the caller (sendNotification) can fall
 * back to email cleanly when delivery fails.
 */
export async function sendWhatsApp(
  to: string,
  body: string,
): Promise<WhatsAppSendResult> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const client = getClient();

  if (process.env.NODE_ENV !== "production") {
    console.info("[whatsapp] (dev) would send", { to, body });
    return { delivered: true, reason: "dev_console" };
  }
  if (!client || !from) {
    return { delivered: false, reason: "not_configured" };
  }
  try {
    const message = await client.messages.create({
      from,
      to: toWhatsAppAddress(to),
      body,
    });
    return { delivered: true, messageSid: message.sid };
  } catch (error) {
    console.error("[whatsapp] send failed", error);
    return {
      delivered: false,
      reason: error instanceof Error ? error.message : "unknown",
    };
  }
}
