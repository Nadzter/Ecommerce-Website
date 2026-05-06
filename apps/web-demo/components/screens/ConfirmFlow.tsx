'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { formatAed, maskIban } from '@/lib/data';

export function ConfirmScreen() {
  const { goBack, goTo, contacts, kbd, setKbd, draft } = useDemo();
  const recipient = contacts.find((c) => c.id === kbd.recipientId);
  const [reference, setReference] = useState(kbd.reference);

  if (!recipient) return null;

  return (
    <ScreenContainer bg="bg-ink-900">
      <div className="flex h-full flex-col text-white">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button onClick={goBack} className="text-[14px] text-white/60 hover:text-white">
            Back
          </button>
          <span className="text-[15px] font-semibold">Review</span>
          <span className="w-12" />
        </div>

        <div className="flex-1 px-5 pt-2 overflow-y-auto scrollbar-none">
          <div className="text-center pt-4">
            <Avatar emoji={recipient.emoji} color="rgba(255,255,255,0.15)" size={64} />
            <p className="mt-3 text-[14px] text-white/60">To {recipient.name}</p>
            <p className="font-display text-[56px] leading-none tracking-tight text-white mt-2">
              {formatAed(kbd.amountAed)}
            </p>
          </div>

          <Card className="mt-6 bg-white/[0.06] border-white/10 backdrop-blur p-0 overflow-hidden">
            <Row label="From" value={`${draft.selectedBank?.shortName ?? 'Bank'} · •••• 0142`} />
            <Divider />
            <Row label="To IBAN" value={maskIban(recipient.iban)} mono />
            <Divider />
            <Row label="Phone" value={recipient.phone} />
            <Divider />
            <Row label="Fee" value="No fee" emphasis="text-accent-300" />
            <Divider />
            <Row label="Arrives" value="Within seconds" />
          </Card>

          <div className="mt-5">
            <label className="text-[12px] uppercase tracking-wider text-white/50">Reference (optional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={36}
              placeholder="What's it for?"
              onBlur={() => setKbd({ reference })}
              className="mt-1.5 w-full h-12 rounded-xl bg-white/[0.06] border border-white/10 px-4 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-accent-400 focus:bg-white/[0.1]"
            />
          </div>

          <p className="mt-5 text-center text-[12px] text-white/40 leading-relaxed">
            By holding to confirm, you authorise {draft.selectedBank?.shortName ?? 'your bank'} to send
            this transfer. Money moves directly bank-to-bank.
          </p>
        </div>

        <div className="px-5 pb-8 pt-3">
          <Button
            full
            size="lg"
            variant="secondary"
            onClick={() => {
              setKbd({ reference });
              goTo('face-id');
            }}
          >
            Confirm with Face ID
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}

function Row({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px] text-white/60">{label}</span>
      <span
        className={`text-[14px] font-medium text-white ${mono ? 'font-mono text-[13px]' : ''} ${emphasis ?? ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/10" />;
}

// ─── Face ID ───────────────────────────────────────────────────────────────

export function FaceIdScreen() {
  const { goTo } = useDemo();
  const [phase, setPhase] = useState<'scanning' | 'success'>('scanning');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('success'), 1400);
    const t2 = setTimeout(() => goTo('sending'), 2100);
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
                <FaceGlyph />
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
          {phase === 'scanning' ? 'Look at your phone' : 'Confirmed'}
        </p>
      </div>
    </ScreenContainer>
  );
}

function FaceGlyph() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white/80">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2" />
        <circle cx="9" cy="11" r="0.6" fill="currentColor" />
        <circle cx="15" cy="11" r="0.6" fill="currentColor" />
        <path strokeLinecap="round" d="M9 15c1 0.6 2 1 3 1s2-0.4 3-1" />
      </svg>
    </div>
  );
}

// ─── Sending ───────────────────────────────────────────────────────────────

export function SendingScreen() {
  const { goTo, contacts, kbd, recordTransfer, setLastSentMessage, resetKbd } = useDemo();
  const [step, setStep] = useState(0);
  const recipient = contacts.find((c) => c.id === kbd.recipientId);
  const steps = ['Authorising at your bank…', 'Sending to recipient bank…', 'Sent.'];

  useEffect(() => {
    const intervals = steps.map((_, i) =>
      setTimeout(() => setStep(i + 1), 700 * (i + 1)),
    );
    const finalize = setTimeout(() => {
      if (recipient) {
        recordTransfer({
          contactId: recipient.id,
          amountAed: kbd.amountAed,
          reference: kbd.reference || 'Sent via keyboard',
          state: 'completed',
          initiatedAt: new Date(),
        });
        setLastSentMessage(
          `✅ Sent ${formatAed(kbd.amountAed)} via Amwali` + (kbd.reference ? ` · ${kbd.reference}` : ''),
        );
      }
      goTo('sent');
    }, 700 * (steps.length + 1));
    return () => {
      intervals.forEach(clearTimeout);
      clearTimeout(finalize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer bg="bg-ink-900">
      <div className="flex h-full flex-col items-center justify-center text-white px-8">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-white/10 border-t-accent-400 animate-spin" />
        </div>
        <p className="mt-8 font-display text-[24px] text-white">
          {formatAed(kbd.amountAed)}
        </p>
        <p className="mt-1 text-[13px] text-white/50">to {recipient?.name}</p>

        <div className="mt-10 w-full max-w-[260px] space-y-3">
          {steps.map((label, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-3 text-[14px]"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: i <= step - 1 ? 1 : 0.4 }}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i < step - 1
                    ? 'bg-accent-500 text-white'
                    : i === step - 1
                      ? 'bg-white text-ink-900'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {i < step - 1 ? '✓' : i + 1}
              </span>
              <span className={i <= step - 1 ? 'text-white' : 'text-white/40'}>{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </ScreenContainer>
  );
}

// ─── Sent ──────────────────────────────────────────────────────────────────

export function SentScreen() {
  const { goTo, kbd, contacts, resetKbd } = useDemo();
  const recipient = contacts.find((c) => c.id === kbd.recipientId);

  useEffect(() => {
    const t = setTimeout(() => {
      goTo('chat');
      setTimeout(resetKbd, 200);
    }, 1900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer bg="bg-ink-900">
      <div className="relative flex h-full flex-col items-center justify-center text-white overflow-hidden">
        {/* Confetti pulse */}
        <Confetti />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative flex h-28 w-28 items-center justify-center rounded-full bg-accent-500 shadow-2xl shadow-accent-500/50 z-10"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-7 font-display text-[36px] leading-none tracking-tight z-10"
        >
          {formatAed(kbd.amountAed)}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-[14px] text-white/60 z-10"
        >
          sent to {recipient?.name}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-[12px] text-white/40 z-10"
        >
          Returning to chat…
        </motion.p>
      </div>
    </ScreenContainer>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 22 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((_, i) => {
        const left = (i * 4.7 + 7) % 100;
        const delay = (i % 7) * 0.05;
        const duration = 1.2 + (i % 5) * 0.2;
        const colors = ['#1FCEAA', '#54D9BC', '#A6F0DC', '#FFD89B', '#F8F6F1'];
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
