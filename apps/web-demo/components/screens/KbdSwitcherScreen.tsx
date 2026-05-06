'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Phone, Video, Sparkles } from 'lucide-react';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';

const SEED_MESSAGES = [
  { id: '1', fromMe: false, text: 'Yalla, did you get the bill?', ts: '2:14 PM' },
  { id: '2', fromMe: true, text: 'Yeah, AED 100 each, my treat last time tho 😄', ts: '2:15 PM' },
  { id: '3', fromMe: false, text: 'Haha fair. Send me my share?', ts: '2:15 PM' },
];

export function KbdSwitcherScreen() {
  const { goTo, goBack, recipient } = useDemo();

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-3 pt-12 pb-2 bg-[#1F2C34] text-white">
        <button onClick={goBack} className="p-1 -ml-1">
          <ChevronLeft size={22} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-base">
          {recipient.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate">{recipient.shortName}</div>
          <div className="text-[11px] text-white/60">online</div>
        </div>
        <button className="p-2 text-white/80"><Video size={18} /></button>
        <button className="p-2 text-white/80"><Phone size={18} /></button>
      </div>

      {/* Faded chat */}
      <div className="flex-1 overflow-hidden px-3 py-3 space-y-1.5 opacity-50">
        {SEED_MESSAGES.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[14px] leading-snug ${
                m.fromMe ? 'bg-emerald-700 text-white' : 'bg-[#1F2C34] text-white'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Backdrop dim */}
      <button
        onClick={goBack}
        className="absolute inset-0 bg-black/35"
        aria-label="Close keyboard switcher"
      />

      {/* Switcher sheet */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-[#1F1F1F]/95 backdrop-blur-xl text-white shadow-2xl border border-white/5 overflow-hidden"
      >
        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-white/10">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
            Keyboards
          </p>
          <button onClick={goBack} className="text-[13px] text-white/50 hover:text-white">
            Done
          </button>
        </div>
        <div className="py-1">
          <KbdRow icon="🇺🇸" label="English (US)" subtitle="Active" active />
          <KbdRow icon="😀" label="Emoji" />
          <KbdRow
            icon={<AmwaliGlyph />}
            label="Amwali Fast Pay"
            subtitle="Tap to send money"
            badge="NEW"
            highlight
            onClick={() => goTo('keypad')}
          />
          <KbdRow icon="⌨️" label="Keyboard Settings…" muted />
        </div>
      </motion.div>
    </ScreenContainer>
  );
}

function KbdRow({
  icon,
  label,
  subtitle,
  active,
  highlight,
  badge,
  muted,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  active?: boolean;
  highlight?: boolean;
  badge?: string;
  muted?: boolean;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        highlight
          ? 'bg-accent-500/10 hover:bg-accent-500/20 active:bg-accent-500/25'
          : onClick
            ? 'hover:bg-white/5 active:bg-white/10'
            : ''
      } ${muted ? 'text-white/50' : ''}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-[20px] ${
          highlight ? 'bg-gradient-to-br from-accent-400 to-accent-600' : 'bg-white/5'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium">{label}</span>
          {badge ? (
            <span className="rounded-full bg-accent-500 text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className={`text-[12px] ${highlight ? 'text-accent-300' : 'text-white/50'}`}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {active ? <span className="text-accent-400 text-[16px]">✓</span> : null}
    </Component>
  );
}

function AmwaliGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <path d="M16 4 L4 26 L10 26 L16 16 L22 26 L28 26 Z" fill="white" />
    </svg>
  );
}
