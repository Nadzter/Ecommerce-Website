'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Phone, Video } from 'lucide-react';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { PaymentLinkCard, PerspectiveBanner } from './ReceiveFlow';
import { formatAed } from '@/lib/data';

interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  ts: string;
}

const SEED: ChatMessage[] = [
  { id: '1', fromMe: false, text: 'Yalla, did you get the bill?', ts: '2:14 PM' },
  { id: '2', fromMe: true, text: 'Yeah, AED 100 each, my treat last time tho 😄', ts: '2:15 PM' },
  { id: '3', fromMe: false, text: 'Haha fair. Send me my share?', ts: '2:15 PM' },
];

export function ChatScreen() {
  const { goBack, goTo, recipient, paymentLinkAmount } = useDemo();
  const [showAhmedSwitch, setShowAhmedSwitch] = useState(false);

  useEffect(() => {
    if (paymentLinkAmount) {
      const t = setTimeout(() => setShowAhmedSwitch(true), 800);
      return () => clearTimeout(t);
    }
    setShowAhmedSwitch(false);
    return undefined;
  }, [paymentLinkAmount]);

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      <PerspectiveBanner perspective="sender" />

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

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04) 0, transparent 40%)',
        }}
      >
        <AnimatePresence>
          {SEED.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}
            >
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
            </motion.div>
          ))}

          {/* Sent payment-link card (sender perspective: outbound) */}
          {paymentLinkAmount ? (
            <motion.div
              key="link"
              layout
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex justify-end"
            >
              <PaymentLinkCard amount={paymentLinkAmount} senderName="You" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!paymentLinkAmount ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center pt-3"
          >
            <div className="rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 text-[11px] text-white/70">
              Tap the message box below to start typing
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* WhatsApp input bar — tap goes to iOS keyboard */}
      <button
        onClick={() => goTo('ios-keyboard')}
        className="flex items-center gap-2 bg-[#1F2C34] px-3 py-2.5 border-t border-white/5 text-left"
      >
        <div className="flex h-9 flex-1 items-center rounded-full bg-[#2A3942] px-4 text-[14px] text-white/50">
          Message
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          ➤
        </div>
      </button>

      {/* "Switch to Ahmed's view" CTA after send */}
      <AnimatePresence>
        {showAhmedSwitch ? (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => goTo('receive-chat')}
            className="absolute left-1/2 -translate-x-1/2 bottom-20 z-30 rounded-full bg-ink-900/95 backdrop-blur text-white text-[12px] font-semibold px-4 py-2.5 shadow-2xl border border-white/10 flex items-center gap-2"
          >
            <span>👀 See what {recipient.shortName} sees</span>
            <span className="text-white/40">→</span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </ScreenContainer>
  );
}
