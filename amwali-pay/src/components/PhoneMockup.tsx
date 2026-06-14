'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  MARKETS,
  RATES,
  type Currency,
  type MarketCode,
} from '@/lib/constants'
import { formatCurrency, fromUSD, toUSD } from '@/lib/utils'
import { useChatSimulation } from './ChatSimulation'

export interface PhoneMockupProps {
  market: MarketCode
  amount?: number
  currency?: Currency
  platform?: string
  animated?: boolean
  trigger?: number
  onComplete?: () => void
}

const TypingDots = () => (
  <div className="flex gap-1 items-end h-4">
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-navy/40" />
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-navy/40" />
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-navy/40" />
  </div>
)

interface PaymentDetails {
  amount: number
  currency: Currency
  equivalentText: string
  rail: string
}

function PaymentBubble({ details, settled }: { details: PaymentDetails; settled: boolean }) {
  if (settled) {
    return (
      <div className="rounded-2xl bg-[#dcf8c6] text-navy w-[88%] p-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1f7a3d]">
          <span className="w-5 h-5 rounded-full bg-[#1f7a3d] text-white grid place-items-center text-[10px]">
            ✓
          </span>
          Settled instantly
        </div>
        <div className="mt-2 text-lg font-semibold">{formatCurrency(details.amount, details.currency)}</div>
        <div className="text-[10px] text-navy/60 mt-0.5">via {details.rail}</div>
        <div className="text-[9px] text-right text-navy/40 mt-1">9:42 ✓✓</div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-navy text-white w-[88%] p-3 shadow-md">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gold font-semibold">
        <span className="flex items-center gap-1">
          <span className="text-sm leading-none">✦</span>
          <span lang="ar" dir="rtl" className="font-arabic">
            أموالي
          </span>
          pay
        </span>
        <span className="text-white/60">Secure link</span>
      </div>
      <div className="text-2xl font-bold mt-2">{formatCurrency(details.amount, details.currency)}</div>
      <div className="text-[10px] text-white/60 mt-0.5">{details.equivalentText}</div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
        <span>via {details.rail}</span>
        <span>Expires in 24h</span>
      </div>
      <button className="mt-3 w-full rounded-lg bg-gold text-navy font-semibold py-2 text-xs">
        Tap to collect →
      </button>
      <div className="text-[9px] text-right text-white/40 mt-1">9:42 ✓</div>
    </div>
  )
}

function KeyboardPopup({ details }: { details: PaymentDetails }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-12 left-2 right-2 rounded-2xl bg-navy shadow-2xl p-3 text-white border border-gold/30"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-gold grid place-items-center text-navy font-bold text-xs">
            ✦
          </span>
          <span className="text-[11px] font-semibold">
            <span lang="ar" dir="rtl" className="font-arabic text-gold italic">
              أموالي
            </span>
            <span className="ml-1">pay</span>
          </span>
        </div>
        <span className="text-[9px] text-white/60 uppercase tracking-wider">Send link</span>
      </div>

      <div className="rounded-xl bg-navy-mid/80 p-2.5 border border-white/5">
        <div className="text-[9px] text-white/50 uppercase tracking-wider">Amount</div>
        <div className="flex items-baseline justify-between mt-0.5">
          <div className="text-xl font-bold">{formatCurrency(details.amount, details.currency)}</div>
          <div className="text-[10px] text-gold">{details.equivalentText}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button className="rounded-lg border border-white/15 text-white text-[10px] py-1.5 font-medium">
          Cancel
        </button>
        <button className="rounded-lg bg-gold text-navy text-[10px] py-1.5 font-semibold">
          Send link →
        </button>
      </div>
    </motion.div>
  )
}

export function PhoneMockup({
  market,
  amount,
  currency,
  platform = 'WhatsApp',
  animated = true,
  trigger = 0,
  onComplete,
}: PhoneMockupProps) {
  const prefersReduced = useReducedMotion()
  const m = MARKETS[market]
  const _amount = amount ?? m.defaultAmount
  const _currency: Currency = currency ?? m.defaultCurrency

  const usdAmount = toUSD(_amount, _currency)
  const otherCurrency: Currency =
    _currency === 'USD' ? (market === 'lb' ? 'LBP' : 'AED') : 'USD'
  const equivalentAmount =
    _currency === 'USD'
      ? fromUSD(usdAmount, otherCurrency)
      : usdAmount * (otherCurrency === 'USD' ? 1 : market === 'lb' ? RATES.LBP_PER_USD : RATES.AED_PER_USD)
  const equivalentText = `≈ ${formatCurrency(equivalentAmount, otherCurrency)}`

  const state = useChatSimulation({
    market,
    amount: _amount,
    currency: _currency,
    platform,
    autoPlay: animated,
    trigger,
    onComplete,
  })

  const paymentDetails: PaymentDetails = {
    amount: _amount,
    currency: _currency,
    equivalentText,
    rail: m.settlementRail,
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative mx-auto"
      style={{ width: 'min(320px, 100%)' }}
      aria-label={`${m.name} chat demonstration`}
    >
      <div
        className="relative rounded-[36px] bg-navy p-[10px] shadow-2xl"
        style={{ boxShadow: '0 30px 60px -15px rgba(10,22,40,0.45), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        {/* Notch */}
        <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-navy z-30" />

        <div className="relative rounded-[28px] overflow-hidden bg-[#f0f0f0]" style={{ height: 560 }}>
          {/* Status bar */}
          <div className="h-7 bg-navy flex items-center justify-between px-5 text-white text-[11px] font-semibold">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">●●●</span>
              <span className="text-[10px]">📶</span>
              <span className="text-[10px]">100%</span>
            </div>
          </div>

          {/* App header */}
          <div className="bg-white border-b border-black/5 px-3 py-2 flex items-center gap-2">
            <button aria-label="Back" className="text-navy/60 text-base px-1">
              ‹
            </button>
            <div
              className="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-bold"
              style={{ backgroundColor: m.chatContact.color }}
            >
              {m.chatContact.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-navy truncate">{m.chatContact.name}</div>
              <div className="text-[10px] text-green-600">online</div>
            </div>
            <div className="flex items-center gap-2 text-navy/50">
              <span className="text-base" aria-hidden>
                📹
              </span>
              <span className="text-base" aria-hidden>
                📞
              </span>
            </div>
          </div>

          {/* Chat area */}
          <div
            className="chat-bg overflow-hidden px-3 py-3 flex flex-col gap-2 relative"
            style={{ height: 'calc(100% - 28px - 48px - 56px)' }}
          >
            <AnimatePresence initial={false}>
              {state.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={prefersReduced ? false : { y: 8, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.22 }}
                  className={`flex ${msg.side === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'payment' || msg.type === 'success' ? (
                    <PaymentBubble details={paymentDetails} settled={msg.type === 'success'} />
                  ) : (
                    <div
                      className={`max-w-[78%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${
                        msg.side === 'me' ? 'bg-[#dcf8c6] text-navy' : 'bg-white text-navy'
                      }`}
                    >
                      {msg.text}
                      <div className="text-[9px] text-navy/40 text-right mt-0.5">
                        9:41 {msg.side === 'me' ? '✓✓' : ''}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {state.showTyping && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${state.showTyping === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl shadow-sm ${
                    state.showTyping === 'me' ? 'bg-[#dcf8c6]' : 'bg-white'
                  }`}
                >
                  <TypingDots />
                </div>
              </motion.div>
            )}

            <AnimatePresence>{state.showKeyboard && <KeyboardPopup details={paymentDetails} />}</AnimatePresence>
          </div>

          {/* Bottom message input */}
          <div className="absolute bottom-14 left-0 right-0 bg-[#f0f0f0] px-3 py-2 flex items-center gap-2 border-t border-black/5">
            <span className="text-navy/40 text-lg">😊</span>
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-navy/40">
              Message
            </div>
            <button
              aria-label="Open Amwali"
              className="w-8 h-8 rounded-full bg-navy grid place-items-center text-gold text-sm"
            >
              ✦
            </button>
            <span className="text-navy/40 text-lg">🎤</span>
          </div>

          {/* Bottom keyboard / app tray */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-black/5 px-3 flex items-center justify-around">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-navy grid place-items-center text-gold text-xs font-bold">
                ✦
              </div>
              <span className="text-[8px] text-navy/60 font-medium">
                <span lang="ar" dir="rtl" className="font-arabic">
                  أموالي
                </span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-[#25D366] grid place-items-center text-white text-xs">
                W
              </div>
              <span className="text-[8px] text-navy/60">{platform}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 grid place-items-center text-white text-xs">
                I
              </div>
              <span className="text-[8px] text-navy/60">Insta</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-blue-500 grid place-items-center text-white text-xs">
                T
              </div>
              <span className="text-[8px] text-navy/60">Telegram</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-navy/10 grid place-items-center text-navy text-xs">
                ⋯
              </div>
              <span className="text-[8px] text-navy/60">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side buttons */}
      <div className="absolute top-24 -left-[3px] w-1 h-12 bg-navy rounded-l-md" aria-hidden />
      <div className="absolute top-40 -left-[3px] w-1 h-20 bg-navy rounded-l-md" aria-hidden />
      <div className="absolute top-32 -right-[3px] w-1 h-20 bg-navy rounded-r-md" aria-hidden />
    </motion.div>
  )
}
