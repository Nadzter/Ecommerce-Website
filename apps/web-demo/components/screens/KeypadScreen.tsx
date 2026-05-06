'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Delete } from 'lucide-react';
import { Avatar } from '../ui/Card';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { formatAed } from '@/lib/data';

export function KeypadScreen() {
  const { goTo, goBack, contacts, kbd, setKbd } = useDemo();
  const [amountStr, setAmountStr] = useState(
    kbd.amountAed > 0 ? String(kbd.amountAed) : '',
  );
  const recipient = kbd.recipientId ? contacts.find((c) => c.id === kbd.recipientId) : null;

  useEffect(() => {
    setKbd({ amountAed: Number(amountStr) || 0 });
  }, [amountStr, setKbd]);

  function press(key: string) {
    setAmountStr((s) => {
      if (key === '⌫') return s.slice(0, -1);
      if (key === '.' && s.includes('.')) return s;
      if (key === '0' && s === '') return s;
      // limit to 2 decimals
      if (s.includes('.') && s.split('.')[1]!.length >= 2 && key !== '⌫') return s;
      return s + key;
    });
  }

  const amount = Number(amountStr) || 0;
  const ready = amount >= 1 && !!recipient;

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      {/* Mini chat preview at top */}
      <div className="relative flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 pt-12 pb-2 text-white/80">
          <button onClick={goBack} className="text-[14px] flex items-center gap-1 text-white/60 hover:text-white">
            <ChevronDown size={18} />
            Hide
          </button>
          <span className="text-[12px] uppercase tracking-wider text-white/40">
            Amwali keyboard
          </span>
          <span className="w-12" />
        </div>

        <div
          className="flex-1 px-3 pb-3 overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04) 0, transparent 40%)',
          }}
        >
          <div className="text-center pt-4">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              You're sending
            </p>
            <motion.p
              key={amountStr}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="font-display text-[64px] leading-none tracking-tight text-white mt-1"
            >
              {amountStr === '' ? (
                <span className="text-white/30">0</span>
              ) : (
                amountStr
              )}
              <span className="ml-2 text-[24px] text-white/50 align-baseline">AED</span>
            </motion.p>
          </div>

          {/* Recipient picker */}
          <button
            onClick={() => goTo('recipient-picker')}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-white/5 backdrop-blur px-4 py-3 text-left hover:bg-white/10"
          >
            {recipient ? (
              <>
                <Avatar emoji={recipient.emoji} color="rgba(255,255,255,0.15)" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-white truncate">
                    To {recipient.name}
                  </div>
                  <div className="text-[12px] text-white/50 truncate">{recipient.phone}</div>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/30 text-white/50">
                  ?
                </div>
                <div className="flex-1 text-[14px] text-white/70">Choose recipient</div>
              </>
            )}
            <ChevronDown size={16} className="text-white/40 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Keyboard */}
      <div className="bg-[#0A1014] border-t border-white/5 px-2 pb-3 pt-2">
        <div className="flex items-center justify-end px-2 pb-2">
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
          Amwali · {recipient ? formatAed(amount) : 'pick a recipient'} · UAE
        </p>
      </div>
    </ScreenContainer>
  );
}
