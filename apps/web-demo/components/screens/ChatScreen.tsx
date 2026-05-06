'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Phone, Video } from 'lucide-react';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';

interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  isAmwali?: boolean;
  ts: string;
}

const SEED: ChatMessage[] = [
  { id: '1', fromMe: false, text: 'Yalla, did you get the bill?', ts: '2:14 PM' },
  { id: '2', fromMe: true, text: 'Yeah, AED 100 each, my treat last time tho 😄', ts: '2:15 PM' },
  { id: '3', fromMe: false, text: 'Haha fair. Send me my share?', ts: '2:15 PM' },
];

export function ChatScreen() {
  const { goBack, goTo, contacts, lastSentMessage, setLastSentMessage } = useDemo();
  const ahmed = contacts.find((c) => c.name.includes('Ahmed')) ?? contacts[0]!;
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!lastSentMessage) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        fromMe: true,
        text: lastSentMessage,
        isAmwali: true,
        ts: 'just now',
      },
    ]);
    setShowHint(false);
    setLastSentMessage(null);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m_reply_${Date.now()}`,
          fromMe: false,
          text: 'Got it, mashallah 🙏',
          ts: 'just now',
        },
      ]);
    }, 2200);
  }, [lastSentMessage, setLastSentMessage]);

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      {/* Chat header — WhatsApp-style */}
      <div className="flex items-center gap-2 px-3 pt-12 pb-2 bg-[#1F2C34] text-white">
        <button onClick={goBack} className="p-1 -ml-1">
          <ChevronLeft size={22} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-base">
          {ahmed.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate">{ahmed.name.split(' ')[0]}</div>
          <div className="text-[11px] text-white/60">online</div>
        </div>
        <button className="p-2 text-white/80">
          <Video size={18} />
        </button>
        <button className="p-2 text-white/80">
          <Phone size={18} />
        </button>
      </div>

      {/* Chat body */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04) 0, transparent 40%), radial-gradient(circle at 80% 100%, rgba(255,255,255,0.03) 0, transparent 40%)',
        }}
      >
        <AnimatePresence>
          {messages.map((m) => (
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
                  m.fromMe
                    ? m.isAmwali
                      ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white'
                      : 'bg-emerald-700 text-white'
                    : 'bg-[#1F2C34] text-white'
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`mt-0.5 text-[10px] ${
                    m.fromMe ? 'text-white/70' : 'text-white/50'
                  } text-right`}
                >
                  {m.ts} {m.fromMe ? '✓✓' : ''}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {showHint ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center pt-3"
          >
            <div className="rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 text-[11px] text-white/70">
              Tap the keyboard icon below to open Amwali
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Input bar — pretends to be iOS keyboard input */}
      <button
        onClick={() => goTo('keypad')}
        className="flex items-center gap-2 bg-[#1F2C34] px-3 py-2.5 border-t border-white/5 text-left"
      >
        <div className="flex h-9 flex-1 items-center rounded-full bg-[#2A3942] px-4 text-[14px] text-white/50">
          Message
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-lg">
          <AmwaliKbdGlyph />
        </div>
      </button>
    </ScreenContainer>
  );
}

function AmwaliKbdGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 L4 19 L8 19 L12 11 L16 19 L20 19 Z"
        fill="white"
      />
    </svg>
  );
}
