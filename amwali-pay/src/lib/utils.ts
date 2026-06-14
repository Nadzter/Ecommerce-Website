import { FEE_TIERS, RATES, type Currency, type FeeTier } from './constants'

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  if (currency === 'AED') {
    return `AED ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return `${Math.round(amount).toLocaleString('en-US')} LBP`
}

export function toUSD(amount: number, currency: Currency): number {
  if (currency === 'USD') return amount
  if (currency === 'AED') return amount / RATES.AED_PER_USD
  return amount / RATES.LBP_PER_USD
}

export function fromUSD(amountUSD: number, currency: Currency): number {
  if (currency === 'USD') return amountUSD
  if (currency === 'AED') return amountUSD * RATES.AED_PER_USD
  return amountUSD * RATES.LBP_PER_USD
}

export function calcFee(amountUSD: number): { feeUSD: number | null; tier: FeeTier } {
  const tier =
    FEE_TIERS.find((t) => amountUSD >= t.minUSD && amountUSD < t.maxUSD) ??
    FEE_TIERS[FEE_TIERS.length - 1]
  return { feeUSD: tier.feeUSD, tier }
}

export function calcBankNet(amountUSD: number): {
  bankEarns: number
  amwaliFee: number
  bankKeeps: number
} {
  let bankEarns = 0
  if (amountUSD >= 20 && amountUSD < 100) bankEarns = 1.0
  else if (amountUSD >= 100 && amountUSD < 500) bankEarns = 1.5
  else if (amountUSD >= 500) bankEarns = 2.0

  const { feeUSD } = calcFee(amountUSD)
  const amwaliFee = feeUSD ?? 0
  return {
    bankEarns,
    amwaliFee,
    bankKeeps: Math.max(0, bankEarns - amwaliFee),
  }
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
