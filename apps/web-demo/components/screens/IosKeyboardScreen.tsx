'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Phone, Video } from 'lucide-react';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';

const ROW_1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW_2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW_3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

const SEED_MESSAGES = [
  { id: '1', fromMe: false, text: 'Yalla, did you get the bill?', ts: '2:14 PM' },
  { id: '2', fromMe: true, text: 'Yeah, AED 100 each, my treat last time tho 😄', ts: '2:15 PM' },
  { id: '3', fromMe: false, text: 'Haha fair. Send me my share?', ts: '2:15 PM' },
];

export function IosKeyboardScreen() {
  const { goBack, goTo, recipient } = useDemo();

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      {/* WhatsApp chat header */}
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

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04) 0, transparent 40%)',
        }}
      >
        {SEED_MESSAGES.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[14px] leading-snug ${
                m.fromMe ? 'bg-emerald-700 text-white' : 'bg-[#1F2C34] text-white'
              }`}
            >
              <div>{m.text}</div>
              <div className={`mt-0.5 text-[10px] text-white/60 text-right`}>
                {m.ts} {m.fromMe ? '✓✓' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp input bar (focused) */}
      <div className="bg-[#1F2C34] px-3 py-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 rounded-full bg-[#2A3942] px-4 flex items-center text-[14px] text-white">
            <span className="inline-block w-px h-4 bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            ➤
          </div>
        </div>
      </div>

      {/* iOS keyboard */}
      <IosKeyboard onGlobeTap={() => goTo('kbd-switcher')} />
    </ScreenContainer>
  );
}

function IosKeyboard({ onGlobeTap }: { onGlobeTap: () => void }) {
  return (
    <div className="bg-[#D1D4D9] dark:bg-[#2C2C2E] px-1.5 pt-2 pb-4 select-none">
      <KeyRow keys={ROW_1} />
      <div className="px-3.5">
        <KeyRow keys={ROW_2} />
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <SpecialKey label="⇧" wide />
        <div className="flex-1 grid grid-cols-7 gap-1.5">
          {ROW_3.map((k) => (
            <Key key={k} label={k} />
          ))}
        </div>
        <SpecialKey label="⌫" wide />
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <SpecialKey label="123" />
        <GlobeKey onTap={onGlobeTap} />
        <SpecialKey label="space" wide flex />
        <SpecialKey label="return" wide />
      </div>
    </div>
  );
}

function Key({ label }: { label: string }) {
  return (
    <button className="h-10 rounded-md bg-white text-[18px] font-normal text-black shadow-[0_1px_0_rgba(0,0,0,0.35)] active:bg-[#A6AAB1] transition-colors">
      {label}
    </button>
  );
}

function KeyRow({ keys }: { keys: string[] }) {
  return (
    <div className="grid gap-1.5 mt-1.5" style={{ gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }}>
      {keys.map((k) => (
        <Key key={k} label={k} />
      ))}
    </div>
  );
}

function SpecialKey({ label, wide, flex }: { label: string; wide?: boolean; flex?: boolean }) {
  return (
    <button
      className={`h-10 rounded-md bg-[#A6AAB1] text-black text-[14px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.35)] ${
        flex ? 'flex-1' : wide ? 'w-12' : 'w-9'
      }`}
    >
      {label}
    </button>
  );
}

function GlobeKey({ onTap }: { onTap: () => void }) {
  return (
    <div className="relative">
      <motion.button
        onClick={onTap}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(0,194,168,0.7)',
            '0 0 0 12px rgba(0,194,168,0)',
            '0 0 0 0 rgba(0,194,168,0)',
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        className="relative h-10 w-12 rounded-md bg-[#A6AAB1] text-black flex items-center justify-center"
      >
        <GlobeIcon />
      </motion.button>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-lg bg-ink-900 text-white text-[11px] font-medium px-2.5 py-1.5 shadow-lg"
      >
        Tap the globe to switch keyboards
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 bg-ink-900" />
      </motion.div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13 13 0 010 18" />
      <path d="M12 3a13 13 0 000 18" />
    </svg>
  );
}
