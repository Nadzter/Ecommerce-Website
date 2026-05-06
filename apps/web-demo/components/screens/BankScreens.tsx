'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar, Card, CardRow } from '../ui/Card';
import { ScreenBody, ScreenContainer, ScreenFooter, ScreenHeader } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { UAE_BANKS, type Bank } from '@/lib/data';

export function BankListScreen() {
  const { goBack, goTo, setDraft } = useDemo();
  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Pick your bank" />
      <ScreenBody>
        <p className="text-[14px] text-ink-500">
          Choose where money will be sent from. You'll authorise on your bank's site — Amwali never
          sees your password.
        </p>
        <div className="mt-5 space-y-2">
          {UAE_BANKS.map((bank) => (
            <button
              key={bank.id}
              onClick={() => {
                setDraft({ selectedBank: bank });
                goTo('bank-auth');
              }}
              className="w-full text-left"
            >
              <Card className="hover:border-ink-200 transition-colors">
                <CardRow
                  leading={<Avatar initials={bank.initials} color={bank.brandColor} />}
                  title={bank.name}
                  subtitle={bank.shortName}
                  trailing={<ChevronRight size={18} />}
                />
              </Card>
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-ink-50 px-3.5 py-3 text-[12px] text-ink-600">
          <Lock size={14} className="flex-none text-ink-500" />
          <span>
            Open banking — read-only. Your credentials never leave your bank.
          </span>
        </div>
      </ScreenBody>
    </ScreenContainer>
  );
}

export function BankAuthScreen() {
  const { goTo, draft } = useDemo();
  const bank = draft.selectedBank;
  const [step, setStep] = useState<'redirecting' | 'authing' | 'approving'>('redirecting');

  useEffect(() => {
    const t1 = setTimeout(() => setStep('authing'), 800);
    return () => clearTimeout(t1);
  }, []);

  if (!bank) return null;

  return (
    <ScreenContainer bg="bg-white">
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-center gap-2 px-5 pt-12 pb-3">
          <Lock size={14} className="text-ink-400" />
          <span className="text-[12px] font-medium text-ink-500">{bank.id}.ae</span>
        </div>

        {step === 'redirecting' ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-100 border-t-ink-700" />
            <p className="mt-4 text-[14px] text-ink-500">Securely connecting to {bank.name}…</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col px-6 pt-2"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-white text-xl font-bold"
              style={{ background: bank.brandColor }}
            >
              {bank.initials}
            </div>
            <h1 className="mt-6 font-display text-[26px] leading-tight tracking-tight text-ink-900">
              Approve transfer access
            </h1>
            <p className="mt-2 text-[14px] text-ink-500">
              <span className="font-semibold text-ink-700">Amwali</span> is requesting permission to
              initiate transfers from one of your accounts.
            </p>

            <Card className="mt-5 p-4 text-[13px]">
              <p className="font-semibold text-ink-900">Permissions</p>
              <ul className="mt-2 space-y-1.5 text-ink-600">
                <li>• View your account name & last 4 digits</li>
                <li>• Initiate single transfers you confirm in-app</li>
                <li>• You stay in control — revoke anytime</li>
              </ul>
            </Card>

            <p className="mt-5 text-[12px] text-ink-400 leading-relaxed">
              By approving, you agree to {bank.shortName}'s open banking terms. Consent expires in
              90 days unless renewed.
            </p>

            <div className="mt-auto flex flex-col gap-2 pb-8 pt-6">
              <Button
                full
                size="lg"
                style={{ background: bank.brandColor, color: 'white' }}
                onClick={() => {
                  setStep('approving');
                  setTimeout(() => goTo('bank-success'), 1100);
                }}
              >
                {step === 'approving' ? 'Approving…' : `Approve with ${bank.shortName}`}
              </Button>
              <Button full size="lg" variant="ghost" onClick={() => goTo('bank-list')}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ScreenContainer>
  );
}

export function BankSuccessScreen() {
  const { goTo, draft } = useDemo();
  const bank = draft.selectedBank;
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
        <h1 className="mt-8 font-display text-[28px] leading-tight tracking-tight text-ink-900">
          {bank?.shortName} is linked.
        </h1>
        <p className="mt-2 text-[14px] text-ink-500 max-w-[260px]">
          Now turn on the Amwali keyboard so you can send from any chat.
        </p>

        <Card className="mt-6 w-full max-w-[300px] p-4 text-left">
          <div className="flex items-center gap-3">
            <Avatar initials={bank?.initials ?? ''} color={bank?.brandColor ?? '#0A2540'} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink-900 truncate">{bank?.name}</p>
              <p className="text-[12px] text-ink-500">Salary account · •••• 0142</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-wider text-ink-400">Available</p>
          <p className="text-[22px] font-semibold tracking-tight text-ink-900">AED 14,820.50</p>
        </Card>
      </ScreenBody>
      <ScreenFooter>
        <Button full size="lg" onClick={() => goTo('home')}>
          Continue
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}
