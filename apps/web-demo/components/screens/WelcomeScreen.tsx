'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';

export function WelcomeScreen() {
  const { goTo } = useDemo();
  return (
    <ScreenContainer bg="bg-ink-900">
      <div className="relative flex h-full w-full flex-col text-white">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
          <div className="absolute top-40 -right-16 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Logo />
          </motion.div>
          <motion.h1
            className="mt-8 font-display text-[44px] leading-[1.05] tracking-tight text-balance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            Send money from
            <br />
            <span className="italic text-accent-400">any chat.</span>
          </motion.h1>
          <motion.p
            className="mt-4 text-[15px] leading-relaxed text-ink-200 max-w-[280px] text-balance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            Bank-to-bank transfers from inside WhatsApp, iMessage and beyond.
          </motion.p>
        </div>

        <motion.div
          className="relative px-6 pb-10 pt-2 space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <Button
            full
            size="lg"
            variant="secondary"
            onClick={() => goTo('email')}
          >
            Get started
          </Button>
          <button
            className="w-full text-center text-[14px] text-ink-200 hover:text-white transition-colors py-2"
            onClick={() => goTo('email')}
          >
            I already have an account
          </button>
          <p className="pt-2 text-[11px] text-ink-300/60 text-center">
            Demo preview · No real transfers · UAE only
          </p>
        </motion.div>
      </div>
    </ScreenContainer>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4 L4 26 L10 26 L16 16 L22 26 L28 26 Z"
            fill="url(#g1)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#54D9BC" />
              <stop offset="100%" stopColor="#00B398" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="mt-3 font-display text-[22px] tracking-tight">Amwali</span>
    </div>
  );
}
