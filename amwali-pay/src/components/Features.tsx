'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FEATURES } from '@/lib/constants'

const GRID_BG_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(10,14,39,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,14,39,0.035) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
}

function MiniKeypad({
  scheme = 'brand',
  highlightSend = true,
}: {
  scheme?: 'brand' | 'green' | 'purple' | 'amber'
  highlightSend?: boolean
}) {
  const sendColor =
    scheme === 'brand'
      ? '#0052FF'
      : scheme === 'green'
        ? '#22C55E'
        : scheme === 'purple'
          ? '#A855F7'
          : '#F59E0B'
  const sideColumn = scheme === 'brand' ? '#0A0E27' : sendColor
  return (
    <div className="w-[148px] rounded-2xl bg-white shadow-[0_18px_40px_-12px_rgba(10,14,39,0.18)] border border-ink/10 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 bg-white">
        <span className="text-[8px] text-ink/40 inline-flex items-center gap-0.5">
          <span className="inline-block w-3 h-2 rounded-[3px] border border-ink/30" />
        </span>
        <span className="text-[14px] font-bold text-brand">$0</span>
        <span className="text-[8px] text-ink/40 font-semibold">MXN ▾</span>
      </div>
      <div className="grid grid-cols-[18px_1fr] gap-0">
        <div
          style={{ backgroundColor: sideColumn }}
          className="text-[8px] text-white font-medium flex flex-col items-center justify-around py-1"
        >
          <span>1</span>
          <span>4</span>
          <span>7</span>
          <span>.</span>
        </div>
        <div className="grid grid-cols-3 text-[10px] text-ink/80 font-medium py-1">
          <span className="text-center">2</span>
          <span className="text-center">3</span>
          <span className="text-center text-ink/30">⌫</span>
          <span className="text-center">5</span>
          <span className="text-center">6</span>
          <span />
          <span className="text-center">8</span>
          <span className="text-center">9</span>
          <span />
          <span className="text-center">0</span>
          <span />
          <span />
        </div>
      </div>
      <div className="px-2 pb-2">
        <div
          className="rounded-md py-1 text-center text-[10px] font-semibold text-white"
          style={{ backgroundColor: highlightSend ? sendColor : '#0A0E27' }}
        >
          ● Send
        </div>
      </div>
    </div>
  )
}

function ChatNativeVisual({ reduced }: { reduced: boolean | null }) {
  const apps = [
    { id: 'wa',     bg: '#25D366', label: 'W',  angle: -90 },
    { id: 'ig',     bg: 'linear-gradient(135deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)', label: 'I',  angle: -30 },
    { id: 'tg',     bg: '#26A5E4', label: 'T',  angle: 30 },
    { id: 'msg',    bg: '#34C759', label: '✉',  angle: 90 },
    { id: 'fbm',    bg: '#0084FF', label: 'M',  angle: 150 },
    { id: 'sms',    bg: '#5856D6', label: 'S',  angle: -150 },
  ]
  const radius = 110

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />

      <svg
        viewBox="-160 -160 320 320"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {apps.map((app, idx) => {
          const rad = (app.angle * Math.PI) / 180
          const x = Math.cos(rad) * radius
          const y = Math.sin(rad) * radius
          return (
            <g key={app.id}>
              <line
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                stroke="rgba(0,82,255,0.18)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {!reduced && (
                <motion.circle
                  r={3}
                  fill="#0052FF"
                  initial={{ cx: 0, cy: 0, opacity: 0 }}
                  animate={{
                    cx: [0, x, x],
                    cy: [0, y, y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: idx * 0.35,
                    ease: 'easeOut',
                  }}
                />
              )}
            </g>
          )
        })}
      </svg>

      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <MiniKeypad />
      </div>

      {apps.map((app) => {
        const rad = (app.angle * Math.PI) / 180
        const x = Math.cos(rad) * radius
        const y = Math.sin(rad) * radius
        return (
          <div
            key={app.id}
            className="absolute left-1/2 top-1/2 w-9 h-9 rounded-full text-white grid place-items-center text-[14px] font-bold shadow-lg"
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              background: app.bg,
            }}
            aria-hidden
          >
            {app.label}
          </div>
        )
      })}
    </div>
  )
}

function WhiteLabelVisual({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-[210px] w-[260px]">
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reduced ? false : { rotate: -10, x: -38 }}
            animate={reduced ? {} : { rotate: [-12, -10, -12], x: -38 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MiniKeypad scheme="purple" />
          </motion.div>
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reduced ? false : { rotate: 5, x: 38 }}
            animate={reduced ? {} : { rotate: [3, 5, 3], x: 38 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MiniKeypad scheme="green" />
          </motion.div>
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reduced ? false : { y: 4 }}
            animate={reduced ? {} : { y: [4, -4, 4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MiniKeypad scheme="brand" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function OneTapVisual({ reduced }: { reduced: boolean | null }) {
  const cards = [
    { bank: 'BLOM Bank', name: 'Layla Haddad', currency: 'USD', rotate: -6, dx: -28, z: 0 },
    { bank: 'Audi Bank',  name: 'Karim Saad',    currency: 'USD', rotate: -2, dx: -10, z: 1 },
    { bank: 'Bank Med',   name: 'Sara Mansoori', currency: 'AED', rotate: 4,  dx: 18,  z: 2 },
  ]
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[280px] h-[180px]">
          {cards.map((c, idx) => (
            <motion.div
              key={c.bank}
              initial={reduced ? false : { y: 14, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="absolute left-1/2 top-1/2 w-[210px] rounded-2xl bg-white border border-ink/10 shadow-[0_18px_40px_-18px_rgba(10,14,39,0.25)] p-3"
              style={{
                transform: `translate(calc(-50% + ${c.dx}px), -50%) rotate(${c.rotate}deg)`,
                zIndex: c.z,
                outline: idx === cards.length - 1 ? '2px solid #0052FF' : 'none',
                outlineOffset: idx === cards.length - 1 ? -2 : 0,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-ink/45 uppercase tracking-wider">
                  Currency
                </div>
                {idx === cards.length - 1 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-brand grid place-items-center text-white text-[8px]">
                    ✓
                  </span>
                )}
              </div>
              <div className="text-[12px] font-semibold text-ink">{c.currency}</div>
              <div className="mt-2 text-[9px] text-ink/45 uppercase tracking-wider">Bank</div>
              <div className="text-[12px] font-semibold text-ink">{c.bank}</div>
              <div className="mt-2 text-[9px] text-ink/45 uppercase tracking-wider">Beneficiary</div>
              <div className="text-[12px] font-semibold text-ink">{c.name}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NfcQrVisual({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[260px] h-[200px]">
          {/* Left phone */}
          <div
            className="absolute left-[8%] top-1/2 w-[90px] h-[150px] rounded-[18px] bg-ink shadow-2xl"
            style={{ transform: 'translateY(-50%) rotate(-14deg)' }}
            aria-hidden
          >
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-black" />
            <div className="absolute inset-1.5 mt-4 rounded-[14px] bg-gradient-to-br from-brand to-brand-deep grid place-items-center">
              <span className="text-white text-2xl">●</span>
            </div>
          </div>
          {/* Right phone */}
          <div
            className="absolute right-[8%] top-1/2 w-[90px] h-[150px] rounded-[18px] bg-white border border-ink/10 shadow-2xl"
            style={{ transform: 'translateY(-50%) rotate(14deg)' }}
            aria-hidden
          >
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-ink/85" />
            <div className="absolute inset-1.5 mt-4 rounded-[14px] bg-brand-pale grid place-items-center">
              <div className="grid grid-cols-3 gap-[3px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 ${i % 2 === 0 ? 'bg-ink' : 'bg-transparent'} rounded-[1px]`}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Floating dots between phones */}
          {!reduced && (
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand"
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          )}
          {/* NFC arc */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 260 200"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <path
              d="M120 110 Q130 95 140 110"
              stroke="rgba(0,82,255,0.25)"
              strokeWidth="1.4"
              fill="none"
              strokeDasharray="3 3"
            />
            <path
              d="M115 118 Q130 90 145 118"
              stroke="rgba(0,82,255,0.18)"
              strokeWidth="1.4"
              fill="none"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

function SecurityVisual({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <div className="w-[160px] h-[160px] rounded-3xl bg-white border border-ink/10 shadow-[0_24px_60px_-20px_rgba(10,14,39,0.25)] grid place-items-center relative overflow-hidden">
            {/* Face ID brackets */}
            <svg viewBox="0 0 64 64" className="w-20 h-20" aria-hidden>
              <rect x="6" y="6" width="14" height="3" rx="1.5" fill="#0052FF" />
              <rect x="6" y="6" width="3" height="14" rx="1.5" fill="#0052FF" />
              <rect x="44" y="6" width="14" height="3" rx="1.5" fill="#0052FF" />
              <rect x="55" y="6" width="3" height="14" rx="1.5" fill="#0052FF" />
              <rect x="6" y="55" width="14" height="3" rx="1.5" fill="#0052FF" />
              <rect x="6" y="44" width="3" height="14" rx="1.5" fill="#0052FF" />
              <rect x="44" y="55" width="14" height="3" rx="1.5" fill="#0052FF" />
              <rect x="55" y="44" width="3" height="14" rx="1.5" fill="#0052FF" />
              <circle cx="24" cy="28" r="2.5" fill="#0A0E27" />
              <circle cx="40" cy="28" r="2.5" fill="#0A0E27" />
              <path
                d="M22 40 Q32 48 42 40"
                stroke="#0A0E27"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            {!reduced && (
              <motion.div
                className="absolute left-3 right-3 h-[2px] rounded-full bg-brand"
                animate={{ top: ['18%', '78%', '18%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ boxShadow: '0 0 12px rgba(0,82,255,0.6)' }}
              />
            )}
          </div>
          {/* Lock badge */}
          <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl bg-brand text-white grid place-items-center shadow-xl shadow-brand/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="white"
                strokeWidth="2"
              />
              <path
                d="M8 11V8a4 4 0 0 1 8 0v3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="15.5" r="1.2" fill="white" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function LocalRailsVisual({ reduced }: { reduced: boolean | null }) {
  const rails = [
    { name: 'BDL Instant',   flag: '🇱🇧' },
    { name: 'UAEFTS',        flag: '🇦🇪' },
    { name: 'SEPA Instant',  flag: '🇪🇺' },
    { name: 'Pix',           flag: '🇧🇷' },
    { name: 'UPI',           flag: '🇮🇳' },
    { name: 'Faster Payments', flag: '🇬🇧' },
  ]
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 p-6 grid grid-cols-2 gap-2 items-center justify-items-center content-center">
        {rails.map((r, i) => (
          <motion.div
            key={r.name}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            className="inline-flex items-center gap-2 rounded-full bg-white border border-ink/10 shadow-sm px-3 py-2 text-[12px] font-semibold text-ink"
          >
            <span className="text-base leading-none" aria-hidden>
              {r.flag}
            </span>
            <span>{r.name}</span>
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.3,
                delay: i * 0.08 + 0.25,
                type: 'spring',
                stiffness: 320,
                damping: 18,
              }}
              className="w-4 h-4 rounded-full bg-brand grid place-items-center text-white text-[9px]"
            >
              ✓
            </motion.span>
          </motion.div>
        ))}
      </div>
      {!reduced && (
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-brand text-white px-3 py-1 text-[11px] font-semibold shadow-md"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35, delay: 0.7 }}
        >
          <span aria-hidden>⚡</span>
          Settles in &lt; 60s
        </motion.div>
      )}
    </div>
  )
}

const VISUALS = [
  ChatNativeVisual,
  WhiteLabelVisual,
  OneTapVisual,
  NfcQrVisual,
  SecurityVisual,
  LocalRailsVisual,
] as const

interface FeatureCardProps {
  feature: (typeof FEATURES)[number]
  Visual: (typeof VISUALS)[number]
  prefersReduced: boolean | null
  index: number
}

function FeatureCard({ feature, Visual, prefersReduced, index }: FeatureCardProps) {
  return (
    <motion.article
      initial={prefersReduced ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 2) * 0.08 }}
      className="group rounded-[28px] bg-off-white border border-border p-3 transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(10,14,39,0.25)]"
    >
      <div className="relative h-[300px] sm:h-[320px] rounded-[20px] bg-white border border-border overflow-hidden">
        <Visual reduced={prefersReduced} />
      </div>
      <div className="px-4 pt-6 pb-5 text-center max-w-md mx-auto">
        <h3 className="text-lg sm:text-xl font-bold text-ink">{feature.titleEn}</h3>
        <p className="mt-2 text-sm text-ink/65 leading-relaxed">{feature.body}</p>
      </div>
    </motion.article>
  )
}

export function Features() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-brand font-semibold mb-3">
            What you get
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink">
            Everything your customers need
          </h2>
          <p className="mt-3 text-ink/60 text-sm sm:text-base">
            Six capabilities. One SDK. Built for the conversation-first reality of
            modern banking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((feature, idx) => (
            <FeatureCard
              key={feature.titleEn}
              feature={feature}
              Visual={VISUALS[idx]}
              prefersReduced={prefersReduced}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
