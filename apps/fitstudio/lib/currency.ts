import type { Currency } from "@/prisma/generated/client";

const LOCALE_BY_CURRENCY: Record<Currency, string> = {
  EUR: "es-ES",
  AED: "ar-AE",
  USD: "en-US",
  LBP: "ar-LB",
};

/**
 * Format a numeric amount in the currency used by the studio. We accept
 * `string | number` to be friendly to Prisma's `Decimal` type (which
 * serialises to string) without depending on it explicitly.
 */
export function formatCurrency(
  amount: number | string,
  currency: Currency,
): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot format non-finite currency value: ${amount}`);
  }
  const locale = LOCALE_BY_CURRENCY[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "LBP" ? 0 : 2,
  }).format(value);
}

/**
 * Return the currency symbol (e.g. "€", "د.إ", "$", "ل.ل") by asking the
 * Intl formatter for the part labelled `currency`.
 */
export function currencySymbol(currency: Currency): string {
  const locale = LOCALE_BY_CURRENCY[currency];
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}
