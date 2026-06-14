'use client'

import { type Currency, type MarketCode, RATES } from '@/lib/constants'
import { calcBankNet, calcFee, formatCurrency, fromUSD, toUSD } from '@/lib/utils'

export interface FeeCalculatorProps {
  market: MarketCode
  amount: number
  currency: Currency
}

export function FeeCalculator({ market, amount, currency }: FeeCalculatorProps) {
  const amountUSD = toUSD(amount, currency)
  const { feeUSD, tier } = calcFee(amountUSD)
  const { bankEarns, amwaliFee, bankKeeps } = calcBankNet(amountUSD)

  if (amountUSD < 20) {
    const minLocal: Record<MarketCode, string> = {
      lb: `${RATES.LBP_PER_USD * 20} LBP`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      ae: `AED ${(RATES.AED_PER_USD * 20).toFixed(0)}`,
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-2">
          <span className="text-red-600 text-base">⚠️</span>
          <div>
            <div className="text-sm font-semibold text-red-700">Minimum transfer $20</div>
            <div className="text-xs text-red-600/80 mt-1">
              That&apos;s about{' '}
              {market === 'lb'
                ? '1,790,000 LBP'
                : `AED ${(RATES.AED_PER_USD * 20).toFixed(0)}`}{' '}
              · we don&apos;t charge below this threshold to keep fees fair.
            </div>
            <div className="text-[11px] text-red-500/70 mt-2 font-mono">
              Local equivalent: {minLocal[market]}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const fee = feeUSD ?? 0
  const localFee = fromUSD(fee, currency)
  const effectivePct = (fee / amountUSD) * 100
  const color =
    effectivePct < 1
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : effectivePct < 2
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border p-4 ${color}`}>
        <div className="flex items-center justify-between text-xs uppercase tracking-wider opacity-75">
          <span>Amwali fee · {tier.label}</span>
          <span>{tier.note}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="text-2xl font-bold">{formatCurrency(fee, 'USD')}</div>
          <div className="text-sm opacity-80">{formatCurrency(localFee, currency)}</div>
        </div>
        <div className="mt-2 text-[12px] opacity-80">
          Effective rate <strong>{effectivePct.toFixed(2)}%</strong> of transaction
        </div>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-4">
        <div className="text-[11px] uppercase tracking-wider text-navy/50 font-semibold mb-3">
          Bank economics
        </div>
        <dl className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <dt className="text-navy/70">Bank earns on transfer</dt>
            <dd className="font-semibold text-navy">{formatCurrency(bankEarns, 'USD')}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-navy/70">Amwali fee</dt>
            <dd className="font-semibold text-navy">− {formatCurrency(amwaliFee, 'USD')}</dd>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-navy/5">
            <dt className="text-navy font-medium">Bank keeps</dt>
            <dd className="font-bold text-emerald-600">{formatCurrency(bankKeeps, 'USD')}</dd>
          </div>
        </dl>
        <div className="mt-3 text-[12px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 font-medium">
          ✓ Net positive for the bank every time
        </div>
      </div>
    </div>
  )
}
