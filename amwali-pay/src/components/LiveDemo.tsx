'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MARKETS, type Currency, type MarketCode } from '@/lib/constants'
import { calcFee, formatCurrency, toUSD } from '@/lib/utils'
import { FeeCalculator } from './FeeCalculator'
import { PhoneMockup } from './PhoneMockup'

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, x: 16 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="fixed top-6 right-6 z-50 max-w-sm rounded-2xl bg-navy text-white shadow-2xl px-5 py-4 border border-gold/30"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="text-gold text-lg leading-none">✦</span>
        <div className="text-sm font-medium">{message}</div>
      </div>
    </motion.div>
  )
}

export default function LiveDemo() {
  const prefersReduced = useReducedMotion()
  const [market, setMarket] = useState<MarketCode>('lb')
  const m = MARKETS[market]

  const [currency, setCurrency] = useState<Currency>(m.defaultCurrency)
  const [amount, setAmount] = useState<number>(m.defaultAmount)
  const [platform, setPlatform] = useState<string>(m.platforms[0])
  const [simTrigger, setSimTrigger] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [prevMarket, setPrevMarket] = useState<MarketCode>(market)

  if (market !== prevMarket) {
    setPrevMarket(market)
    setCurrency(m.defaultCurrency)
    setAmount(m.defaultAmount)
    setPlatform(m.platforms[0])
    setSimTrigger((v) => v + 1)
  }

  const amountUSD = useMemo(() => toUSD(amount, currency), [amount, currency])
  const { feeUSD } = calcFee(amountUSD)
  const feeLabel = feeUSD !== null && amountUSD >= 20 ? formatCurrency(feeUSD, 'USD') : '—'

  function simulate() {
    setSimTrigger((v) => v + 1)
    setTimeout(() => setToast(`Payment settled via ${m.settlementRail}!`), 5500)
  }

  function reset() {
    setCurrency(m.defaultCurrency)
    setAmount(m.defaultAmount)
    setPlatform(m.platforms[0])
    setSimTrigger((v) => v + 1)
    setToast(null)
  }

  const steps = [
    `Customer taps Amwali keyboard in ${platform}`,
    `Enters ${formatCurrency(amount, currency)} and generates a secure link`,
    'Recipient claims in one tap — link is unique and time-limited',
    `Settles instantly via ${m.settlementRail} — bank earns, Amwali charges ${feeLabel}`,
  ]

  return (
    <section id="demo" className="bg-white py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">
            Interactive sandbox
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">Live market demo</h2>
          <p className="font-arabic text-base text-navy/55 mt-2" lang="ar" dir="rtl">
            جرّب أموالي في سوقك
          </p>
          <p className="mt-3 text-navy/60 text-sm sm:text-base">
            Pick a market, set an amount, and watch the entire payment flow play out
            inside a real chat thread.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-navy/10 bg-off-white">
            {(['lb', 'ae'] as MarketCode[]).map((code) => {
              const country = MARKETS[code]
              const active = market === code
              return (
                <button
                  key={code}
                  onClick={() => setMarket(code)}
                  aria-pressed={active}
                  className={`relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-white' : 'text-navy/70 hover:text-navy'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="demo-toggle-pill"
                      className="absolute inset-0 rounded-full bg-navy -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span aria-hidden>{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={market}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start"
          >
            <div className="order-2 lg:order-1 mx-auto w-full max-w-[360px]">
              <PhoneMockup
                market={market}
                amount={amount}
                currency={currency}
                platform={platform}
                trigger={simTrigger}
                animated
              />
            </div>

            <div className="order-1 lg:order-2 rounded-2xl border border-navy/10 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-navy flex items-center gap-2">
                    <span>{m.flag}</span>
                    {m.name}
                  </h3>
                  <p
                    className="text-sm font-arabic text-navy/55 mt-0.5"
                    lang="ar"
                    dir="rtl"
                  >
                    {m.nameAr}
                  </p>
                </div>
                <span
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    color: m.accentColor,
                    backgroundColor: `${m.accentColor}14`,
                    border: `1px solid ${m.accentColor}33`,
                  }}
                >
                  {m.fact}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="amount-input"
                    className="text-xs font-semibold text-navy/55 uppercase tracking-wider"
                  >
                    Amount
                  </label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-navy/15 bg-white focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 transition">
                    <span className="pl-4 text-navy/40 text-lg font-medium">
                      {currency === 'USD' ? '$' : currency === 'AED' ? 'AED' : 'LBP'}
                    </span>
                    <input
                      id="amount-input"
                      type="number"
                      min={0}
                      value={Number.isFinite(amount) ? amount : ''}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setAmount(Number.isFinite(v) ? v : 0)
                      }}
                      className="w-full px-3 py-3 text-xl font-semibold text-navy bg-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-navy/55 uppercase tracking-wider mb-1.5">
                    Currency
                  </div>
                  <div className="inline-flex items-center gap-1 p-1 rounded-full border border-navy/10 bg-off-white">
                    {m.currencies.map((c) => {
                      const active = currency === c
                      return (
                        <button
                          key={c}
                          onClick={() => setCurrency(c)}
                          aria-pressed={active}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            active ? 'bg-navy text-white' : 'text-navy/70 hover:text-navy'
                          }`}
                        >
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-navy/55 uppercase tracking-wider mb-1.5">
                    Platform
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.platforms.map((p) => {
                      const active = platform === p
                      const emoji =
                        p === 'WhatsApp'
                          ? '💬'
                          : p === 'Instagram'
                            ? '📷'
                            : p === 'Telegram'
                              ? '✈️'
                              : '📱'
                      return (
                        <button
                          key={p}
                          onClick={() => setPlatform(p)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                            active
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-navy/75 border-navy/15 hover:border-navy/40'
                          }`}
                        >
                          <span aria-hidden>{emoji}</span>
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <FeeCalculator market={market} amount={amount} currency={currency} />

                <ol className="space-y-2.5 mt-2">
                  {steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-pale border border-gold/40 grid place-items-center text-[11px] font-bold text-gold">
                        {idx + 1}
                      </span>
                      <span className="text-[13px] text-navy/75 leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>

                <button
                  onClick={simulate}
                  className="w-full h-12 rounded-xl bg-navy text-white font-semibold flex items-center justify-center gap-2 hover:bg-navy-mid transition-colors"
                >
                  <span aria-hidden>▶</span>
                  Simulate payment in chat
                </button>
                <button
                  onClick={reset}
                  className="block mx-auto text-xs text-navy/55 hover:text-navy underline-offset-4 hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </section>
  )
}
