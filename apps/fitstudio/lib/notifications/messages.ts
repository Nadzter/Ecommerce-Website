import type { Language } from "@/prisma/generated/client";

import type { NotificationData, NotificationType } from "./types";

export interface MessageTemplate {
  whatsapp: string;
  subject?: string;
}

type MessagesByType = Record<NotificationType, MessageTemplate>;
type MessagesByLanguage = Record<Language, MessagesByType>;

/**
 * Source of truth for every outbound message string in ES / EN / AR.
 *
 * Tokens use `{name}` placeholders; `formatMessage` substitutes them from
 * a `NotificationData` payload. Tokens that are not provided are left
 * intact so missing data is obvious in QA.
 */
export const messages: MessagesByLanguage = {
  es: {
    booking_confirmed: {
      whatsapp:
        "¡Reserva confirmada! 🎉 {memberName}, tu clase de {className} con {instructorName} el {date} a las {time} está confirmada. ¿Necesitas cancelar? Escribe CANCELAR.",
      subject: "Reserva confirmada — {className}",
    },
    booking_reminder: {
      whatsapp:
        "⏰ Recordatorio: Tu clase de {className} empieza en 1 hora ({time}). ¡Nos vemos pronto!",
      subject: "Tu clase empieza pronto",
    },
    waitlist_promoted: {
      whatsapp:
        "¡Buenas noticias! 🌟 Se liberó un lugar en {className} el {date}. Tu reserva está CONFIRMADA.",
      subject: "Te has movido al cupo confirmado",
    },
    booking_cancelled: {
      whatsapp:
        "Tu reserva en {className} el {date} ha sido cancelada. Si tenías créditos, han sido devueltos.",
      subject: "Reserva cancelada",
    },
    payment_received: {
      whatsapp:
        "Pago recibido ✅ {amount} {currency} por {membershipName}. Descarga tu factura: {invoiceUrl}",
      subject: "Pago recibido — {membershipName}",
    },
    membership_expiring: {
      whatsapp:
        "⚠️ Tu membresía {membershipName} vence el {expiryDate}. Renueva aquí: {renewUrl}",
      subject: "Tu membresía vence pronto",
    },
    win_back: {
      whatsapp:
        "¡Te echamos de menos en {studioName}! 💪 Han pasado {daysSince} días desde tu última clase. Vuelve esta semana: {offerUrl}",
      subject: "Te echamos de menos",
    },
  },
  en: {
    booking_confirmed: {
      whatsapp:
        "Booking confirmed! 🎉 {memberName}, your {className} class with {instructorName} on {date} at {time} is confirmed. Need to cancel? Reply CANCEL.",
      subject: "Booking confirmed — {className}",
    },
    booking_reminder: {
      whatsapp:
        "⏰ Reminder: Your {className} class starts in 1 hour ({time}). See you soon!",
      subject: "Your class starts soon",
    },
    waitlist_promoted: {
      whatsapp:
        "Good news! 🌟 A spot opened in {className} on {date}. Your booking is CONFIRMED.",
      subject: "You moved off the waitlist",
    },
    booking_cancelled: {
      whatsapp:
        "Your booking for {className} on {date} has been cancelled. Credits have been refunded if applicable.",
      subject: "Booking cancelled",
    },
    payment_received: {
      whatsapp:
        "Payment received ✅ {amount} {currency} for {membershipName}. Download your invoice: {invoiceUrl}",
      subject: "Payment received — {membershipName}",
    },
    membership_expiring: {
      whatsapp:
        "⚠️ Your {membershipName} membership expires on {expiryDate}. Renew here: {renewUrl}",
      subject: "Your membership expires soon",
    },
    win_back: {
      whatsapp:
        "We miss you at {studioName}! 💪 It's been {daysSince} days since your last class. Come back this week: {offerUrl}",
      subject: "We miss you",
    },
  },
  ar: {
    booking_confirmed: {
      whatsapp:
        "تم تأكيد الحجز! 🎉 {memberName}، تم تأكيد حصتك في {className} مع {instructorName} بتاريخ {date} الساعة {time}. للإلغاء اكتب إلغاء.",
      subject: "تم تأكيد الحجز — {className}",
    },
    booking_reminder: {
      whatsapp:
        "⏰ تذكير: حصتك في {className} تبدأ خلال ساعة ({time}). نراك قريباً!",
      subject: "حصتك تبدأ قريباً",
    },
    waitlist_promoted: {
      whatsapp:
        "أخبار جيدة! 🌟 أصبح هناك مكان في {className} بتاريخ {date}. حجزك مؤكد الآن.",
      subject: "تم تأكيد حجزك من قائمة الانتظار",
    },
    booking_cancelled: {
      whatsapp:
        "تم إلغاء حجزك في {className} بتاريخ {date}. تم إعادة الرصيد إن وجد.",
      subject: "تم إلغاء الحجز",
    },
    payment_received: {
      whatsapp:
        "تم استلام الدفع ✅ {amount} {currency} لـ {membershipName}. تحميل الفاتورة: {invoiceUrl}",
      subject: "تم استلام الدفع — {membershipName}",
    },
    membership_expiring: {
      whatsapp:
        "⚠️ اشتراكك في {membershipName} ينتهي بتاريخ {expiryDate}. جدد هنا: {renewUrl}",
      subject: "اشتراكك ينتهي قريباً",
    },
    win_back: {
      whatsapp:
        "نشتاق إليك في {studioName}! 💪 مضى {daysSince} يوماً منذ آخر حصة. عد هذا الأسبوع: {offerUrl}",
      subject: "نشتاق إليك",
    },
  },
};

/**
 * Substitute `{token}` placeholders with values from `data`. Missing
 * tokens are left as-is so QA notices unfilled variables.
 */
export function formatMessage(
  template: string,
  data: NotificationData,
): string {
  return template.replace(/{(\w+)}/g, (match, key: string) => {
    const value = data[key as keyof NotificationData];
    return value === undefined || value === null ? match : String(value);
  });
}
