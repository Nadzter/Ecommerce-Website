'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Delete } from 'lucide-react';
import { Avatar } from '../ui/Card';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { formatAed } from '@/lib/data';

export function KeypadScreen() {
  const { goTo, goBack, kbd, setKbd, recipient, draft } = useDemo();
  const [amountStr, setAmountStr] = useState(
    kbd.amountAed > 0 ? String(kbd.amountAed) : '',
  );

  useEffect(() => {
    setKbd({ amountAed: Number(amountStr) || 0 });
  }, [amountStr, setKbd]);

  function press(key: string) {
    setAmountStr((s) => {
      if (key === '⌫') return s.slice(0, -1);
      if (key === '.' && s.includes('.')) return s;
      if (key === '0' && s === '') return s;
      if (s.includes('.') && s.split('.')[1]!.length >= 2 && key !== '⌫') return s;
      return s + key;
    });
  }

  const amount = Number(amountStr) || 0;
  const ready = amount >= 1;

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      {/* Top: minimal context — who you're sending to (from the chat) */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <button
          onClick={goBack}
          className="text-[14px] flex items-center gap-1 text-white/70 hover:text-white"
        >
          <ChevronDown size={18} />
          Hide
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-accent-400 font-semibold">
            Amwali Fast Pay
          </span>
        </div>
        <span className="w-12" />
      </div>

      {/* Recipient pill — implicit from chat, no IBAN */}
      <div className="px-4">
        <div className="flex items-center justify-center gap-2 rounded-full bg-white/5 backdrop-blur px-3 py-2">
          <Avatar emoji={recipient.emoji} color="rgba(255,255,255,0.18)" size={28} />
          <span className="text-[13px] text-white/90">
            Sending to <span className="font-semibold">{recipient.shortName}</span>
          </span>
        </div>
      </div>

      {/* Amount display */}
      <div className="flex-1 flex items-center justify-center px-3">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wider text-white/40">You're sending</p>
          <motion.p
            key={amountStr}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="font-display text-[64px] leading-none tracking-tight text-white mt-2"
          >
            {amountStr === '' ? <span className="text-white/30">0</span> : amountStr}
            <span className="ml-2 text-[24px] text-white/50 align-baseline">AED</span>
          </motion.p>
          <p className="mt-3 text-[11px] text-white/40">
            From {draft.selectedBank?.shortName ?? 'your bank'} · No fee
          </p>
        </div>
      </div>

      {/* Keyboard */}
      <div className="bg-[#0A1014] border-t border-white/5 px-2 pb-3 pt-2">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[11px] text-white/30">
            🌐 To switch back, tap globe
          </span>
          <button
            disabled={!ready}
            onClick={() => goTo('confirm')}
            className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
              ready
                ? 'bg-gradient-to-r from-accent-400 to-accent-600 text-white shadow-lg shadow-accent-500/40'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            Send →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="h-12 rounded-xl bg-white/[0.06] text-white text-[20px] font-medium hover:bg-white/[0.12] active:bg-white/[0.18] transition-colors flex items-center justify-center"
            >
              {k === '⌫' ? <Delete size={18} /> : k}
            </button>
          ))}
        </div>

        <p className="mt-2 text-center text-[10px] text-white/30">
          Amwali · {ready ? formatAed(amount) : 'enter an amount'} · UAE
        </p>
      </div>
    </ScreenContainer>
  );
}
