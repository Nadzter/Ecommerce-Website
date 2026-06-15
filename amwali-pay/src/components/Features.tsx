'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FEATURES } from '@/lib/constants'

const GRID_BG_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(10,14,39,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,14,39,0.035) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
}

/* ---------- Mini keypad used in chat-native + white-label visuals ---------- */

function MiniKeypad({
  scheme = 'brand',
}: {
  scheme?: 'brand' | 'green' | 'purple' | 'amber'
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
        <span className="inline-block w-3 h-2 rounded-[3px] border border-ink/30" />
        <span className="text-[14px] font-bold text-brand">$0</span>
        <span className="text-[8px] text-ink/40 font-semibold">USD ▾</span>
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
          style={{ backgroundColor: sendColor }}
        >
          ● Send
        </div>
      </div>
    </div>
  )
}

/* ---------- Brand-accurate chat-platform logos ---------- */

function WhatsAppLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center shadow-md"
      style={{ width: size, height: size, background: '#25D366', borderRadius: size * 0.22 }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} fill="white" aria-hidden>
        <path d="M16 5.3c-5.9 0-10.7 4.8-10.7 10.7 0 1.9.5 3.7 1.4 5.3l-1.4 5.4 5.5-1.4c1.6.9 3.3 1.3 5.2 1.3 5.9 0 10.7-4.8 10.7-10.7S21.9 5.3 16 5.3zm6.2 14.4c-.3.7-1.5 1.4-2.1 1.5-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3.1-1.3-5.1-4.5-5.3-4.7-.2-.2-1.3-1.7-1.3-3.3 0-1.6.8-2.3 1.1-2.7.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5.3.7.9 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.3-.3.5-.2.2-.4.4-.5.6-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.2 1.1 2.3 1.4 2.6 1.6.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.3-.2.6-.1.3.1 1.7.8 2.1 1 .3.1.5.2.6.3.1.3.1.8-.2 1.6z" />
      </svg>
    </div>
  )
}

function InstagramLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center shadow-md"
      style={{
        width: size,
        height: size,
        background:
          'linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5 100%)',
        borderRadius: size * 0.22,
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.6} height={size * 0.6} fill="none" aria-hidden>
        <rect x="7" y="7" width="18" height="18" rx="5" stroke="white" strokeWidth="2" />
        <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" />
        <circle cx="22.2" cy="9.8" r="1.4" fill="white" />
      </svg>
    </div>
  )
}

function TelegramLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center shadow-md"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #37BBFE, #007DBB)',
        borderRadius: '50%',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.6} height={size * 0.6} fill="white" aria-hidden>
        <path d="M24.5 8.6 L9 14.4c-1 .4-1 1 0 1.3l3.6 1.1 1.4 4.3c.2.5.4.5.8.2l2-1.7 4 2.9c.7.4 1.2.2 1.4-.7l2.5-11.8c.3-1-.4-1.6-1.5-1.1zM13.6 17.6L22 11.7l-7 7.8.5 3.1-1.9-4.9z" />
      </svg>
    </div>
  )
}

function MessengerLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center shadow-md"
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 30% 100%, #0099FF 0%, #A033FF 60%, #FF5285 100%)',
        borderRadius: '50%',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.65} height={size * 0.65} fill="white" aria-hidden>
        <path d="M16 5C9.4 5 4 10 4 16.2c0 3.5 1.7 6.6 4.4 8.6V29l4-2.2c1.1.3 2.3.5 3.6.5 6.6 0 12-5 12-11.2S22.6 5 16 5zm1.1 14.9-3-3.2-5.7 3.2 6.3-6.6 3 3.2 5.7-3.2-6.3 6.6z" />
      </svg>
    </div>
  )
}

function iMessageLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center shadow-md"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #5BE584, #00B931)',
        borderRadius: size * 0.22,
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.6} height={size * 0.6} fill="white" aria-hidden>
        <path d="M16 7c-5.5 0-10 3.8-10 8.5 0 2.6 1.4 5 3.6 6.5-.5 1.6-1.6 2.8-1.6 2.8s2.8.4 5.3-1.5c.9.2 1.8.3 2.7.3 5.5 0 10-3.8 10-8.5S21.5 7 16 7z" />
      </svg>
    </div>
  )
}

function SnapchatLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center shadow-md"
      style={{
        width: size,
        height: size,
        background: '#FFFC00',
        borderRadius: size * 0.22,
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.65} height={size * 0.65} fill="white" stroke="white" strokeWidth="0.4" aria-hidden>
        <path d="M16 6.5c2.7 0 4.7 1.4 5.6 3.3.7 1.6.3 3.7.1 5.3 0 .2 0 .3.2.4.4.2 1 .3 1.4.1.4-.1 1.1-.4 1.4.2.3.6-.4 1.1-1 1.4-.4.2-1.1.4-1.6.6-.5.2-.4.6-.3.9.2.5.5 1.1.9 1.5.5.4 1.5 1 2.7 1.1.4 0 .7.1.6.5-.1.6-1.6 1-2.4 1.1-.3 0-.6.1-.7.4-.1.3-.1.6-.2.9-.1.3-.3.6-.6.6-.4 0-.9-.3-1.7-.3-1.1 0-1.5.2-2.4.9-.8.7-1.8 1.2-3 1.2s-2.2-.5-3-1.2c-.9-.7-1.3-.9-2.4-.9-.8 0-1.3.3-1.7.3-.3 0-.5-.3-.6-.6-.1-.3-.1-.6-.2-.9-.1-.3-.4-.4-.7-.4-.8-.1-2.3-.5-2.4-1.1-.1-.4.2-.5.6-.5 1.2-.1 2.2-.7 2.7-1.1.4-.4.7-1 .9-1.5.1-.3.2-.7-.3-.9-.5-.2-1.2-.4-1.6-.6-.6-.3-1.3-.8-1-1.4.3-.6 1-.3 1.4-.2.4.2 1 .1 1.4-.1.2-.1.2-.2.2-.4-.2-1.6-.6-3.7.1-5.3.9-1.9 2.9-3.3 5.6-3.3z" />
      </svg>
    </div>
  )
}

/* ---------- Chat-native visual: brand logos around keypad ---------- */

function ChatNativeVisual({ reduced }: { reduced: boolean | null }) {
  const apps = [
    { id: 'wa',   Logo: WhatsAppLogo,  angle: -90  },
    { id: 'ig',   Logo: InstagramLogo, angle: -30  },
    { id: 'tg',   Logo: TelegramLogo,  angle: 30   },
    { id: 'im',   Logo: iMessageLogo,  angle: 90   },
    { id: 'msg',  Logo: MessengerLogo, angle: 150  },
    { id: 'snap', Logo: SnapchatLogo,  angle: -150 },
  ]
  const radius = 108

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
                stroke="rgba(0,82,255,0.2)"
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
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
          >
            <app.Logo size={40} />
          </div>
        )
      })}
    </div>
  )
}

/* ---------- White-label visual ---------- */

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

/* ---------- One-tap visual: 3 bank cards (USD, AED, LBP) ---------- */

interface PayeeCard {
  name: string
  bank: string
  account: string
  amount: string
  flag: string
  rotate: number
  dx: number
  dy: number
  z: number
}

function OneTapVisual({ reduced }: { reduced: boolean | null }) {
  const cards: PayeeCard[] = [
    {
      name: 'Layla Haddad',
      bank: 'Bank Audi',
      account: '•••• 6394',
      amount: '18,000,000 LBP',
      flag: '🇱🇧',
      rotate: -10,
      dx: -54,
      dy: -16,
      z: 0,
    },
    {
      name: 'Karim Saad',
      bank: 'BLOM Bank',
      account: '•••• 9120',
      amount: '$200.00 USD',
      flag: '🇱🇧',
      rotate: -2,
      dx: -16,
      dy: -6,
      z: 1,
    },
    {
      name: 'Sara Al Mansoori',
      bank: 'Emirates NBD',
      account: '•••• 4821',
      amount: 'AED 1,000',
      flag: '🇦🇪',
      rotate: 8,
      dx: 32,
      dy: 10,
      z: 2,
    },
  ]
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[280px] h-[200px]">
          {cards.map((c, idx) => {
            const isFront = idx === cards.length - 1
            return (
              <motion.div
                key={c.name}
                initial={reduced ? false : { y: 18, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="absolute left-1/2 top-1/2 w-[210px] rounded-2xl bg-white p-3 shadow-[0_18px_40px_-18px_rgba(10,14,39,0.32)]"
                style={{
                  transform: `translate(calc(-50% + ${c.dx}px), calc(-50% + ${c.dy}px)) rotate(${c.rotate}deg)`,
                  zIndex: c.z,
                  border: isFront ? '2px solid #0052FF' : '1px solid rgba(10,14,39,0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-ink/45 uppercase tracking-wider">
                    Saved payee
                  </div>
                  <span className="text-base leading-none" aria-hidden>
                    {c.flag}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full grid place-items-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: '#0A0E27' }}
                  >
                    {c.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-ink truncate">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-ink/50 truncate">{c.bank}</div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <div className="text-[9px] text-ink/45 uppercase tracking-wider">
                      Account
                    </div>
                    <div className="text-[11px] font-mono text-ink/85">{c.account}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-ink/45 uppercase tracking-wider">
                      Last sent
                    </div>
                    <div className="text-[11px] font-semibold text-brand">{c.amount}</div>
                  </div>
                </div>
                {isFront && (
                  <div className="mt-2 -mx-3 -mb-3 px-3 py-1.5 rounded-b-2xl bg-brand text-white text-[10px] font-semibold flex items-center justify-between">
                    <span>One-tap to send</span>
                    <span>→</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- NFC & QR visual: phones move apart and together ---------- */

function NfcQrVisual({ reduced }: { reduced: boolean | null }) {
  // Cycle (4.8s): close (NFC linked) → apart → close (QR shown) → apart
  const closeDuration = 4.8
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[280px] h-[200px]">
          {/* Left phone */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: 90, height: 150, marginTop: -75, marginLeft: -90 }}
            animate={
              reduced
                ? {}
                : {
                    x: [-32, 0, -32, 0, -32],
                    rotate: [-14, -6, -14, -6, -14],
                  }
            }
            transition={{
              duration: closeDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-full h-full rounded-[18px] bg-ink shadow-2xl relative">
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-black" />
              <div className="absolute inset-1.5 mt-4 rounded-[14px] bg-gradient-to-br from-brand to-brand-deep grid place-items-center">
                <span className="text-white text-2xl font-bold">$</span>
              </div>
            </div>
          </motion.div>

          {/* Right phone */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: 90, height: 150, marginTop: -75 }}
            animate={
              reduced
                ? {}
                : {
                    x: [32, 0, 32, 0, 32],
                    rotate: [14, 6, 14, 6, 14],
                  }
            }
            transition={{
              duration: closeDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-full h-full rounded-[18px] bg-white border border-ink/10 shadow-2xl relative">
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-ink/85" />
              <div className="absolute inset-1.5 mt-4 rounded-[14px] bg-brand-pale grid place-items-center p-2">
                {/* QR-ish dot grid */}
                <div className="grid grid-cols-4 gap-[2px]">
                  {[
                    1, 0, 1, 0,
                    0, 1, 1, 1,
                    1, 1, 0, 1,
                    0, 1, 1, 0,
                  ].map((v, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 ${v ? 'bg-ink' : 'bg-transparent'} rounded-[1px]`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* NFC arcs — visible when phones are close */}
          {!reduced && (
            <motion.svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 280 200"
              preserveAspectRatio="xMidYMid meet"
              animate={{ opacity: [0, 1, 0, 0, 0] }}
              transition={{
                duration: closeDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.18, 0.45, 0.55, 1],
              }}
            >
              <path
                d="M132 100 Q140 86 148 100"
                stroke="#0052FF"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M126 108 Q140 78 154 108"
                stroke="rgba(0,82,255,0.6)"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M120 116 Q140 70 160 116"
                stroke="rgba(0,82,255,0.3)"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
            </motion.svg>
          )}

          {/* QR badge — visible during the second close phase */}
          {!reduced && (
            <motion.div
              className="absolute top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/10 px-2.5 py-1 text-[10px] font-semibold text-ink shadow-md"
              animate={{ opacity: [0, 0, 0, 1, 0] }}
              transition={{
                duration: closeDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.55, 0.65, 0.85, 1],
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
                <rect x="0" y="0" width="3" height="3" />
                <rect x="7" y="0" width="3" height="3" />
                <rect x="0" y="7" width="3" height="3" />
                <rect x="4" y="4" width="2" height="2" />
              </svg>
              QR linked
            </motion.div>
          )}

          {/* Mode pills at bottom */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2">
            <span className="rounded-full bg-white border border-ink/10 px-2.5 py-1 text-[10px] font-semibold text-brand shadow-sm">
              📡 NFC tap
            </span>
            <span className="rounded-full bg-white border border-ink/10 px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm">
              ⊞ QR scan
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Security visual ---------- */

function SecurityVisual({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <div className="w-[160px] h-[160px] rounded-3xl bg-white border border-ink/10 shadow-[0_24px_60px_-20px_rgba(10,14,39,0.25)] grid place-items-center relative overflow-hidden">
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
          <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl bg-brand text-white grid place-items-center shadow-xl shadow-brand/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="white" strokeWidth="2" />
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

/* ---------- Local rails visual: scrolling logo rows + stationary center ---------- */

interface RailBadge {
  short: string
  color: string
}

const RAILS_TOP: RailBadge[] = [
  { short: 'SEPA',  color: '#003399' },
  { short: 'Pix',   color: '#32BCAD' },
  { short: 'UPI',   color: '#F4801E' },
  { short: 'SPEI',  color: '#9C0F2F' },
  { short: 'FPS',   color: '#1D3557' },
  { short: 'Bizum', color: '#04CDDD' },
  { short: 'Blik',  color: '#1A1A1A' },
  { short: 'ACH',   color: '#005EB8' },
]

const RAILS_MID: RailBadge[] = [
  { short: 'UAEFTS',  color: '#009B77' },
  { short: 'BDL',     color: '#E85C0D' },
  { short: 'AECB',    color: '#0052FF' },
  { short: 'eDirham', color: '#475569' },
  { short: 'SWIFT',   color: '#0F2C4F' },
  { short: 'Wero',    color: '#7C3AED' },
  { short: 'PayID',   color: '#0F766E' },
  { short: 'Interac', color: '#FFB81C' },
]

const RAILS_BOTTOM: RailBadge[] = [
  { short: 'Pix',     color: '#32BCAD' },
  { short: 'FPS',     color: '#1D3557' },
  { short: 'UPI',     color: '#F4801E' },
  { short: 'Blik',    color: '#1A1A1A' },
  { short: 'SEPA',    color: '#003399' },
  { short: 'Bizum',   color: '#04CDDD' },
  { short: 'UAEFTS',  color: '#009B77' },
  { short: 'BDL',     color: '#E85C0D' },
]

function RailBadgeCard({ badge }: { badge: RailBadge }) {
  return (
    <div
      className="flex-shrink-0 w-[68px] h-[44px] rounded-xl bg-white border border-ink/10 shadow-sm grid place-items-center"
      aria-hidden
    >
      <span
        className="text-[11px] font-bold tracking-tight"
        style={{ color: badge.color }}
      >
        {badge.short}
      </span>
    </div>
  )
}

function RailRow({
  items,
  direction,
  duration,
  reduced,
}: {
  items: RailBadge[]
  direction: 'left' | 'right'
  duration: number
  reduced: boolean | null
}) {
  const doubled = [...items, ...items]
  // Each badge is 68px + 10px gap = 78px.
  const distance = items.length * 78
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-2.5 w-max"
        animate={
          reduced
            ? {}
            : direction === 'left'
              ? { x: [0, -distance] }
              : { x: [-distance, 0] }
        }
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {doubled.map((b, i) => (
          <RailBadgeCard key={`${b.short}-${i}`} badge={b} />
        ))}
      </motion.div>
    </div>
  )
}

function LocalRailsVisual({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={GRID_BG_STYLE} aria-hidden />

      {/* Side fade gradients */}
      <div
        className="absolute inset-y-0 left-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, white, transparent)' }}
        aria-hidden
      />
      <div
        className="absolute inset-y-0 right-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, white, transparent)' }}
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col justify-center gap-3 px-4">
        <RailRow items={RAILS_TOP}    direction="left"  duration={28} reduced={reduced} />
        <RailRow items={RAILS_MID}    direction="right" duration={32} reduced={reduced} />
        <RailRow items={RAILS_BOTTOM} direction="left"  duration={26} reduced={reduced} />
      </div>

      {/* Stationary center brand mark */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="w-[72px] h-[72px] rounded-2xl bg-brand grid place-items-center shadow-2xl shadow-brand/40 border-[3px] border-white">
          <span className="text-white text-[11px] font-bold tracking-tight leading-none text-center">
            amwali
            <br />
            pay
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Section composition ---------- */

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
