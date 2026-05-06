'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, IdCard, Camera, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { ScreenBody, ScreenContainer, ScreenFooter, ScreenHeader } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';

export function KycIntroScreen() {
  const { goTo, draft, setDraft } = useDemo();
  const [name, setName] = useState(draft.fullName || 'Sara Al Maktoum');

  return (
    <ScreenContainer>
      <ScreenHeader title="Verify your identity" />
      <ScreenBody>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100">
          <ShieldCheck size={24} className="text-accent-700" />
        </div>
        <h1 className="mt-4 font-display text-[28px] leading-tight tracking-tight text-ink-900">
          A quick check, then you're in.
        </h1>
        <p className="mt-2 text-[14px] text-ink-500">
          UAE regulations need us to confirm your identity before you can move money.
        </p>

        <ul className="mt-6 space-y-2.5">
          {[
            { icon: IdCard, label: 'Emirates ID front & back' },
            { icon: Camera, label: 'Quick selfie video' },
            { icon: Sparkles, label: 'Usually approved in under a minute' },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-[14px] text-ink-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-50 text-ink-600">
                <Icon size={16} />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-7">
          <Field
            label="Full legal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="As shown on your Emirates ID"
          />
        </div>
      </ScreenBody>

      <ScreenFooter>
        <Button
          full
          size="lg"
          disabled={!name.trim()}
          onClick={() => {
            setDraft({ fullName: name.trim() });
            goTo('kyc-processing');
          }}
        >
          Start verification
        </Button>
        <p className="mt-2 text-center text-[11px] text-ink-400">
          Demo preview — no documents are uploaded.
        </p>
      </ScreenFooter>
    </ScreenContainer>
  );
}

export function KycProcessingScreen() {
  const { goTo } = useDemo();
  const [step, setStep] = useState(0);
  const steps = [
    'Scanning Emirates ID…',
    'Matching your selfie…',
    'Cross-checking the registry…',
    'All clear.',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => goTo('kyc-done'), 700);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer>
      <ScreenHeader title="Verifying" />
      <ScreenBody className="flex flex-col items-center justify-center pt-8">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-accent-400/40" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent-100">
            <ShieldCheck size={40} className="text-accent-600" />
          </div>
        </div>

        <div className="mt-10 w-full max-w-[260px] space-y-3">
          {steps.map((label, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-3 text-[14px]"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: i <= step ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i < step ? 'bg-accent-500 text-white' : i === step ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className={i <= step ? 'text-ink-800 font-medium' : 'text-ink-400'}>{label}</span>
            </motion.div>
          ))}
        </div>
      </ScreenBody>
    </ScreenContainer>
  );
}

export function KycDoneScreen() {
  const { goTo, draft } = useDemo();
  return (
    <ScreenContainer>
      <ScreenHeader title="" />
      <ScreenBody className="flex flex-col items-center justify-center pt-4 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-500 text-white shadow-card"
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h1 className="mt-8 font-display text-[30px] leading-tight tracking-tight text-ink-900">
          You're verified, {draft.fullName.split(' ')[0] || 'friend'}.
        </h1>
        <p className="mt-2 text-[14px] text-ink-500 max-w-[260px]">
          One more step — link a UAE bank account so you can start sending.
        </p>
      </ScreenBody>
      <ScreenFooter>
        <Button full size="lg" onClick={() => goTo('bank-list')}>
          Link my bank
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}
