export type CurrencyCode = 'AED' | 'GHS';

export interface Money {
  amountMinor: bigint;
  currency: CurrencyCode | string;
}

/** Decimal places for the currencies we support. */
const SCALE: Record<string, number> = {
  AED: 2, // fils
  GHS: 2, // pesewas
  USD: 2,
};

export function scaleFor(currency: string): number {
  return SCALE[currency] ?? 2;
}

/** Format minor units as a major-unit decimal string. Pure, allocation-light. */
export function formatMinor(amountMinor: bigint, currency: string): string {
  const scale = scaleFor(currency);
  const negative = amountMinor < 0n;
  const abs = negative ? -amountMinor : amountMinor;
  const s = abs.toString().padStart(scale + 1, '0');
  const intPart = s.slice(0, -scale);
  const fracPart = s.slice(-scale);
  return `${negative ? '-' : ''}${intPart}.${fracPart}`;
}

/** JSON-safe Money: bigint as string. */
export interface MoneyJSON {
  amountMinor: string;
  currency: string;
}

export function moneyToJSON(m: Money): MoneyJSON {
  return { amountMinor: m.amountMinor.toString(), currency: m.currency };
}

export function moneyFromJSON(j: MoneyJSON): Money {
  return { amountMinor: BigInt(j.amountMinor), currency: j.currency };
}
