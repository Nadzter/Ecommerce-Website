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
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-ink/40" />
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-ink/40" />
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-ink/40" />
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
      <div className="rounded-2xl bg-brand-pale border border-brand/20 text-ink w-[88%] p-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand">
          <span className="w-5 h-5 rounded-full bg-brand text-white grid place-items-center text-[10px]">
            ✓
          </span>
          Settled instantly
        </div>
        <div className="mt-2 text-lg font-semibold">
          {formatCurrency(details.amount, details.currency)}
        </div>
        <div className="text-[10px] text-ink/55 mt-0.5">via {details.rail}</div>
        <div className="text-[9px] text-right text-ink/35 mt-1">9:42 ✓✓</div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-brand text-white w-[88%] p-3 shadow-md">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/90 font-semibold">
        <span className="flex items-center gap-1">
          <span className="text-sm leading-none">●</span>
          amwali pay
        </span>
        <span className="text-white/60">Secure link</span>
      </div>
      <div className="text-2xl font-bold mt-2">
        {formatCurrency(details.amount, details.currency)}
      </div>
      <div className="text-[10px] text-white/70 mt-0.5">{details.equivalentText}</div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
        <span>via {details.rail}</span>
        <span>Expires in 24h</span>
      </div>
      <button className="mt-3 w-full rounded-lg bg-white text-brand font-semibold py-2 text-xs">
        Tap to collect →
      </button>
      <div className="text-[9px] text-right text-white/50 mt-1">9:42 ✓</div>
    </div>
  )
}

const QWERTY_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

function QwertyKeyboard({ globeHighlighted }: { globeHighlighted: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#d1d5db] px-1.5 pt-2 pb-1.5">
      {QWERTY_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[3px] mb-[5px]">
          {ri === 2 && (
            <span className="w-7 h-7 rounded-[5px] bg-[#a5acb6] grid place-items-center text-white text-[10px]">
              ⇧
            </span>
          )}
          {row.map((k) => (
            <span
              key={k}
              className="flex-1 max-w-[24px] h-7 rounded-[5px] bg-white grid place-items-center text-[11px] text-ink font-medium shadow-[0_1px_0_rgba(0,0,0,0.18)]"
            >
              {k}
            </span>
          ))}
          {ri === 2 && (
            <span className="w-7 h-7 rounded-[5px] bg-[#a5acb6] grid place-items-center text-white text-[10px]">
              ⌫
            </span>
          )}
        </div>
      ))}
      <div className="flex items-center gap-[3px]">
        <span className="px-1.5 h-7 rounded-[5px] bg-[#a5acb6] grid place-items-center text-white text-[9px] font-semibold">
          123
        </span>
        <motion.span
          animate={
            globeHighlighted
              ? { scale: [1, 1.18, 1.1], boxShadow: '0 0 0 6px rgba(0,82,255,0.18)' }
              : { scale: 1, boxShadow: '0 0 0 0px rgba(0,82,255,0)' }
          }
          transition={{ duration: 0.6 }}
          className={`w-8 h-7 rounded-[5px] grid place-items-center text-[12px] ${
            globeHighlighted ? 'bg-brand text-white' : 'bg-[#a5acb6] text-white'
          }`}
          aria-label="Globe — switch keyboard"
        >
          🌐
        </motion.span>
        <span className="flex-1 h-7 rounded-[5px] bg-white grid place-items-center text-[10px] text-ink/60 font-medium">
          space
        </span>
        <span className="px-3 h-7 rounded-[5px] bg-brand grid place-items-center text-white text-[10px] font-semibold">
          return
        </span>
      </div>
    </div>
  )
}

function KeyboardSwitcher() {
  const items = [
    { label: 'English (US)', sub: 'Standard', emoji: 'A', active: false },
    { label: 'Emoji', sub: 'Standard', emoji: '😊', active: false },
    { label: 'amwali pay', sub: 'Send money in chat', emoji: '●', active: true, brand: true },
    { label: 'Arabic', sub: 'Standard', emoji: 'ع', active: false },
  ]
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 16, opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="absolute bottom-2 left-2 right-2 rounded-2xl bg-white/95 backdrop-blur shadow-2xl overflow-hidden border border-ink/5"
    >
      <div className="px-3 py-2 text-[10px] text-ink/50 uppercase tracking-wider font-semibold border-b border-ink/5 bg-off-white">
        Choose Keyboard
      </div>
      <ul>
        {items.map((it) => (
          <li
            key={it.label}
            className={`flex items-center gap-3 px-3 py-2.5 border-b border-ink/5 last:border-b-0 ${
              it.active ? 'bg-brand-pale' : 'bg-white'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md grid place-items-center text-xs font-bold ${
                it.brand
                  ? 'bg-brand text-white'
                  : 'bg-ink/8 text-ink'
              }`}
              style={!it.brand ? { backgroundColor: 'rgba(10,14,39,0.08)' } : undefined}
            >
              {it.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[12px] font-semibold ${
                  it.active ? 'text-brand' : 'text-ink'
                }`}
              >
                {it.label}
              </div>
              <div className="text-[10px] text-ink/55 truncate">{it.sub}</div>
            </div>
            {it.active && (
              <span className="text-brand text-base leading-none" aria-hidden>
                ✓
              </span>
            )}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function AmwaliKeypad({
  typed,
  details,
}: {
  typed: string
  details: PaymentDetails
}) {
  const displayAmount =
    typed && typed !== '0'
      ? formatCurrency(Number(typed), details.currency)
      : `${details.currency === 'USD' ? '$' : details.currency + ' '}0`
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']
  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 18, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-0 left-0 right-0 bg-ink text-white p-3"
      style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-brand grid place-items-center text-white text-[9px] font-bold">
            ●
          </span>
          <span className="text-[10px] font-semibold tracking-wide">amwali pay</span>
        </div>
        <span className="text-[9px] text-white/60 uppercase tracking-wider">
          Enter amount
        </span>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 mb-2">
        <div className="text-[9px] uppercase tracking-wider text-white/40">Amount</div>
        <div className="flex items-baseline justify-between mt-0.5">
          <div className="text-xl font-bold tabular-nums">{displayAmount}</div>
          <div className="text-[10px] text-brand-light">{details.equivalentText}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {keys.map((k) => (
          <div
            key={k}
            className="h-9 rounded-lg bg-white/8 text-white grid place-items-center text-base font-medium border border-white/8"
          >
            {k}
          </div>
        ))}
      </div>

      <button className="mt-2 w-full h-10 rounded-lg bg-brand text-white text-[12px] font-semibold flex items-center justify-center gap-2">
        <span className="w-4 h-4 rounded grid place-items-center bg-white/15 text-[9px]" aria-hidden>
          ⓘ
        </span>
        Send link · Confirm with Face ID
      </button>
    </motion.div>
  )
}

function FaceIdOverlay({ success }: { success: boolean }) {
  // iOS-style Face ID widget: small face icon near the Dynamic Island area,
  // green during scan, morphing into a green checkmark on success.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 bg-ink/35 backdrop-blur-[2px]"
    >
      {/* Centered widget high up near the selfie camera */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 text-center">
        <motion.div
          key={success ? 'ok' : 'scan'}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="relative w-14 h-14 mx-auto"
        >
          {!success && (
            <span
              className="absolute inset-0 rounded-full bg-emerald-400/25 pulse-ring"
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 rounded-full grid place-items-center shadow-lg"
            style={{
              background: success
                ? 'linear-gradient(135deg,#22C55E,#16A34A)'
                : 'linear-gradient(135deg,#22C55E,#15803D)',
              boxShadow: success
                ? '0 0 24px rgba(34,197,94,0.7)'
                : '0 0 18px rgba(34,197,94,0.5)',
            }}
          >
            {success ? (
              <motion.svg
                initial={{ pathLength: 0, scale: 0.7 }}
                animate={{ pathLength: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <motion.path
                  d="M5 12l5 5L20 7"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </motion.svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden>
                <rect x="6" y="6" width="14" height="3" rx="1.5" fill="white" />
                <rect x="6" y="6" width="3" height="14" rx="1.5" fill="white" />
                <rect x="44" y="6" width="14" height="3" rx="1.5" fill="white" />
                <rect x="55" y="6" width="3" height="14" rx="1.5" fill="white" />
                <rect x="6" y="55" width="14" height="3" rx="1.5" fill="white" />
                <rect x="6" y="44" width="3" height="14" rx="1.5" fill="white" />
                <rect x="44" y="55" width="14" height="3" rx="1.5" fill="white" />
                <rect x="55" y="44" width="3" height="14" rx="1.5" fill="white" />
                <circle cx="24" cy="28" r="2.2" fill="white" />
                <circle cx="40" cy="28" r="2.2" fill="white" />
                <path
                  d="M22 40 Q32 48 42 40"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </motion.div>
        <motion.div
          key={`${success ? 'ok' : 'scan'}-label`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="mt-2"
        >
          <div className="text-[11px] font-semibold text-white drop-shadow">
            {success ? 'Payment authorized' : 'Face ID'}
          </div>
          <div className="text-[9px] text-white/70 mt-0.5">
            {success ? 'Face ID ✓ · sending link' : 'Look at the camera'}
          </div>
        </motion.div>
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
      : usdAmount *
        (otherCurrency === 'USD'
          ? 1
          : market === 'lb'
            ? RATES.LBP_PER_USD
            : RATES.AED_PER_USD)
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
        className="relative rounded-[32px] overflow-hidden bg-[#f0f0f0]"
        style={{
          height: 600,
          boxShadow:
            '0 30px 60px -15px rgba(10, 14, 39, 0.28), 0 0 0 1px rgba(10, 14, 39, 0.06)',
        }}
      >
        <div className="relative h-full w-full">
          {/* No status bar — screen-only view per design reference */}

          {/* App header */}
          <div className="bg-white border-b border-ink/5 px-3 py-2 flex items-center gap-2">
            <button aria-label="Back" className="text-ink/60 text-base px-1">
              ‹
            </button>
            <div
              className="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-bold"
              style={{ backgroundColor: m.chatContact.color }}
            >
              {m.chatContact.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate">
                {m.chatContact.name}
              </div>
              <div className="text-[10px] text-emerald-600">online</div>
            </div>
            <div className="flex items-center gap-2 text-ink/45">
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
            style={{ height: 'calc(100% - 48px - 48px)' }}
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
                        msg.side === 'me'
                          ? 'bg-brand text-white'
                          : 'bg-white text-ink'
                      }`}
                    >
                      {msg.text}
                      <div
                        className={`text-[9px] text-right mt-0.5 ${
                          msg.side === 'me' ? 'text-white/55' : 'text-ink/40'
                        }`}
                      >
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
                    state.showTyping === 'me' ? 'bg-brand-pale' : 'bg-white'
                  }`}
                >
                  <TypingDots />
                </div>
              </motion.div>
            )}

            {/* Keyboard layers */}
            <AnimatePresence>
              {state.showQwerty &&
                !state.showAmwaliKeypad &&
                !state.showSwitcher && (
                  <motion.div
                    key="qwerty"
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute bottom-0 left-0 right-0"
                  >
                    <QwertyKeyboard globeHighlighted={state.globeHighlighted} />
                  </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
              {state.showSwitcher && (
                <KeyboardSwitcher key="switcher" />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {state.showAmwaliKeypad && (
                <AmwaliKeypad
                  key="amwali"
                  typed={state.typedDigits}
                  details={paymentDetails}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {state.showFaceId && <FaceIdOverlay success={state.faceIdSuccess} />}
            </AnimatePresence>
          </div>

          {/* Bottom message input — fixed at the absolute bottom only when no keyboard is shown */}
          {!state.showQwerty && !state.showAmwaliKeypad && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f0f0f0] px-3 py-2 flex items-center gap-2 border-t border-ink/5">
              <span className="text-ink/40 text-lg">😊</span>
              <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-ink/40">
                Message
              </div>
              <button
                aria-label="Open Amwali"
                className="w-8 h-8 rounded-full bg-brand grid place-items-center text-white text-sm"
              >
                ●
              </button>
              <span className="text-ink/40 text-lg">🎤</span>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  )
}
