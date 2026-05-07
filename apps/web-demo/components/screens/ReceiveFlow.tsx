'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Phone, Video, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Avatar, Card } from '../ui/Card';
import { ScreenContainer, ScreenBody, ScreenFooter, ScreenHeader } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { formatAed } from '@/lib/data';

// ─── Receiver: chat view ───────────────────────────────────────────────────
// Same WhatsApp chat, but from Ahmed's perspective: Sara's payment link is
// inbound. Receiver taps it.

const RECV_SEED = [
  { id: 'rs1', fromMe: false, text: 'Yalla, did you get the bill?', ts: '2:14 PM' },
  { id: 'rs2', fromMe: true, text: 'Yeah, AED 100 each, my treat last time tho 😄', ts: '2:15 PM' },
  { id: 'rs3', fromMe: false, text: 'Haha fair. Send me my share?', ts: '2:15 PM' },
];

export function ReceiveChatScreen() {
  const { goTo, paymentLinkAmount, paymentLinkSender } = useDemo();

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      {/* Banner: which view we're in */}
      <PerspectiveBanner perspective="receiver" />

      <div className="flex items-center gap-2 px-3 pt-2 pb-2 bg-[#1F2C34] text-white">
        <button className="p-1 -ml-1 text-white/80">
          <ChevronLeft size={22} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-base">
          👩🏽
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate">{paymentLinkSender}</div>
          <div className="text-[11px] text-white/60">online</div>
        </div>
        <button className="p-2 text-white/80"><Video size={18} /></button>
        <button className="p-2 text-white/80"><Phone size={18} /></button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04) 0, transparent 40%)',
        }}
      >
        {RECV_SEED.map((m) => (
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

        {/* Payment link bubble (inbound — Sara → Ahmed) */}
        <AnimatePresence>
          {paymentLinkAmount ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start pt-1"
            >
              <PaymentLinkCard
                amount={paymentLinkAmount}
                senderName={paymentLinkSender}
                onClick={() => goTo('receive-link')}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="bg-[#1F2C34] px-3 py-2.5 border-t border-white/5 flex items-center gap-2">
        <div className="flex h-9 flex-1 items-center rounded-full bg-[#2A3942] px-4 text-[14px] text-white/50">
          Message
        </div>
      </div>
    </ScreenContainer>
  );
}

// ─── Receiver: link-landing screen ─────────────────────────────────────────

export function ReceiveLinkScreen() {
  const { goTo, paymentLinkAmount, paymentLinkSender, receiver } = useDemo();
  const amount = paymentLinkAmount ?? 0;

  return (
    <ScreenContainer>
      <ScreenHeader title="amwali.app/c/abc123" />
      <ScreenBody className="text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-card"
        >
          <svg width="36" height="36" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 4 L4 26 L10 26 L16 16 L22 26 L28 26 Z" />
          </svg>
        </motion.div>

        <p className="mt-6 text-[12px] uppercase tracking-wider text-ink-400">You've received</p>
        <h1 className="mt-1 font-display text-[44px] leading-none tracking-tight text-ink-900">
          {formatAed(amount)}
        </h1>
        <p className="mt-2 text-[14px] text-ink-500">
          from <span className="font-medium text-ink-800">{paymentLinkSender}</span>
        </p>

        <Card className="mt-7 text-left p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-accent-600 flex-none" />
            <div>
              <p className="text-[13px] font-medium text-ink-900">Tap to receive directly to your bank</p>
              <p className="text-[12px] text-ink-500 mt-0.5">
                {receiver.isReturning
                  ? 'Account ending •••• 4729'
                  : 'First time? You\'ll add your bank account once. Saved for next time.'}
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-ink-400">
          <Lock size={12} />
          Secured by open banking · Amwali never holds your funds
        </div>
      </ScreenBody>

      <ScreenFooter>
        <Button
          full
          size="lg"
          onClick={() => goTo(receiver.isReturning ? 'receive-faceid' : 'receive-iban')}
        >
          Receive {formatAed(amount)}
        </Button>
        <FirstTimeToggle />
      </ScreenFooter>
    </ScreenContainer>
  );
}

function FirstTimeToggle() {
  const { receiver, setReceiver } = useDemo();
  return (
    <button
      onClick={() => setReceiver({ isReturning: !receiver.isReturning })}
      className="mt-2 w-full text-[11px] text-ink-400 hover:text-ink-600 transition-colors"
    >
      Demo toggle: {receiver.isReturning ? 'returning user (saved bank)' : 'first-time receiver'} →
      tap to switch
    </button>
  );
}

// ─── Receiver: enter IBAN (first time) ─────────────────────────────────────

export function ReceiveIbanScreen() {
  const { goBack, goTo, paymentLinkAmount, receiver, setReceiver } = useDemo();
  const [iban, setIban] = useState(receiver.iban || 'AE07 0331 1111 2222 4729');
  const valid = iban.replace(/\s+/g, '').length >= 15;
  const amount = paymentLinkAmount ?? 0;

  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Where should it go?" />
      <ScreenBody>
        <p className="text-[14px] text-ink-500">
          Enter the UAE bank account you'd like to receive {formatAed(amount)} into. We'll save it
          so next time you can accept in one tap.
        </p>

        <div className="mt-5 space-y-4">
          <Field
            label="IBAN"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="AE07 0331 2345 6789 0123 456"
            hint="UAE IBANs start with AE and are 23 characters."
          />
          <div className="rounded-xl bg-accent-100/60 border border-accent-300/40 p-3.5 text-[12px] text-accent-800 leading-relaxed">
            <span className="font-semibold">Saved on this device.</span> Next time someone sends
            you money via Amwali, this account auto-fills — just tap to receive.
          </div>
        </div>
      </ScreenBody>

      <ScreenFooter>
        <Button
          full
          size="lg"
          disabled={!valid}
          onClick={() => {
            setReceiver({ iban, isReturning: true });
            goTo('receive-faceid');
          }}
        >
          Continue
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}

// ─── Receiver: Face ID confirm ─────────────────────────────────────────────

export function ReceiveFaceIdScreen() {
  const { goTo } = useDemo();
  const [phase, setPhase] = useState<'scanning' | 'success'>('scanning');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('success'), 1300);
    const t2 = setTimeout(() => goTo('receive-success'), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [goTo]);

  return (
    <ScreenContainer bg="bg-black">
      <div className="flex h-full flex-col items-center justify-center text-white">
        <div className="relative h-32 w-32">
          <AnimatePresence mode="wait">
            {phase === 'scanning' ? (
              <motion.div
                key="scan"
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 rounded-full"
              >
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/30"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full border-2 border-white/50"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="ok"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-accent-500"
              >
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-8 text-[15px] text-white/80">
          {phase === 'scanning' ? 'Confirm receipt' : 'Approved'}
        </p>
      </div>
    </ScreenContainer>
  );
}

// ─── Receiver: success ─────────────────────────────────────────────────────

export function ReceiveSuccessScreen() {
  const { reset, paymentLinkAmount, receiver } = useDemo();
  const amount = paymentLinkAmount ?? 0;

  return (
    <ScreenContainer bg="bg-ink-900">
      <div className="relative flex h-full flex-col items-center justify-center text-white px-6 overflow-hidden">
        <ConfettiSmall />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-accent-500 shadow-2xl shadow-accent-500/40"
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="z-10 mt-7 text-[12px] uppercase tracking-wider text-white/60"
        >
          Received
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="z-10 font-display text-[48px] leading-none tracking-tight text-white mt-1"
        >
          {formatAed(amount)}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="z-10 mt-2 text-[14px] text-white/60 text-center"
        >
          Landed in your bank •••• 4729
        </motion.p>
        {receiver.isReturning ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="z-10 mt-1 text-[12px] text-accent-300"
          >
            Account saved — next time it auto-fills.
          </motion.p>
        ) : null}

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={reset}
          className="z-10 mt-10 rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-[14px] font-medium text-white hover:bg-white/15"
        >
          Replay the demo from start
        </motion.button>
      </div>
    </ScreenContainer>
  );
}

function ConfettiSmall() {
  const pieces = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((_, i) => {
        const left = (i * 5.7 + 7) % 100;
        const delay = (i % 6) * 0.06;
        const duration = 1.1 + (i % 4) * 0.2;
        const colors = ['#1FCEAA', '#54D9BC', '#A6F0DC', '#FFD89B'];
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: 600, opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration, delay, ease: 'easeIn' }}
            className="absolute top-0 h-2 w-1.5 rounded-sm"
            style={{ left: `${left}%`, background: color }}
          />
        );
      })}
    </div>
  );
}

// ─── Shared: payment link card ─────────────────────────────────────────────

export function PaymentLinkCard({
  amount,
  senderName,
  onClick,
}: {
  amount: number;
  senderName: string;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className="group max-w-[88%] text-left overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-500/30"
    >
      <div className="px-3.5 pt-3 pb-2.5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 4 L4 26 L10 26 L16 16 L22 26 L28 26 Z" />
          </svg>
          Amwali payment
        </div>
        <p className="mt-1.5 text-[12px] text-white/80">{senderName} sent you</p>
        <p className="mt-0.5 font-display text-[28px] leading-none tracking-tight">
          {formatAed(amount)}
        </p>
      </div>
      {onClick ? (
        <div className="px-3.5 py-2.5 bg-white/10 backdrop-blur border-t border-white/15 flex items-center justify-between text-[13px] font-semibold">
          <span>Tap to receive</span>
          <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      ) : (
        <div className="px-3.5 py-2 text-[11px] text-white/60">
          amwali.app/c/abc123 · sent
        </div>
      )}
    </Component>
  );
}

// ─── Shared: persona banner ────────────────────────────────────────────────

export function PerspectiveBanner({ perspective }: { perspective: 'sender' | 'receiver' }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pt-1 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-full bg-ink-900/85 backdrop-blur text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1 shadow-lg"
      >
        {perspective === 'sender' ? "Sara's phone" : "Ahmed's phone"}
      </motion.div>
    </div>
  );
}
