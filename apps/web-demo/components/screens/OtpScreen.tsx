'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { ScreenBody, ScreenContainer, ScreenFooter, ScreenHeader } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { FAKE_OTP } from '@/lib/data';

const LENGTH = 6;

export function OtpScreen() {
  const { goBack, goTo, draft } = useDemo();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function setDigit(i: number, v: string) {
    const cleaned = v.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = cleaned;
      return next;
    });
    if (cleaned && i < LENGTH - 1) inputs.current[i + 1]?.focus();
    setError(null);
  }

  function paste(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, LENGTH).split('');
    if (cleaned.length === 0) return;
    const padded = [...cleaned, ...Array(LENGTH - cleaned.length).fill('')];
    setDigits(padded);
    const focusIdx = Math.min(cleaned.length, LENGTH - 1);
    inputs.current[focusIdx]?.focus();
  }

  function backspace(i: number) {
    if (digits[i]) {
      setDigit(i, '');
      return;
    }
    if (i > 0) inputs.current[i - 1]?.focus();
  }

  function submit() {
    if (digits.join('') === FAKE_OTP) {
      goTo('kyc-intro');
    } else {
      setError('That code is incorrect. Try again.');
    }
  }

  const ready = digits.every(Boolean);

  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Verify email" />
      <ScreenBody>
        <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink-900">
          Enter the code
        </h1>
        <p className="mt-2 text-[14px] text-ink-500">
          We sent a code to{' '}
          <span className="font-medium text-ink-700">{draft.email || 'your email'}</span>.
        </p>

        <div className="mt-8 grid grid-cols-6 gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                paste(e.clipboardData.getData('text'));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  e.preventDefault();
                  backspace(i);
                }
                if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
                if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
              }}
              inputMode="numeric"
              maxLength={1}
              className="h-14 w-full rounded-xl border border-ink-100 bg-white text-center text-2xl font-semibold text-ink-900 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
            />
          ))}
        </div>

        {error ? (
          <p className="mt-3 text-[13px] text-red-600">{error}</p>
        ) : (
          <p className="mt-3 text-[12px] text-ink-400">
            Demo hint: the code is{' '}
            <button
              type="button"
              onClick={() => paste(FAKE_OTP)}
              className="font-mono font-semibold text-accent-600 underline-offset-2 hover:underline"
            >
              {FAKE_OTP}
            </button>
          </p>
        )}

        <button className="mt-6 text-[13px] text-ink-500 hover:text-ink-700" type="button">
          Didn't get it? Resend
        </button>
      </ScreenBody>

      <ScreenFooter>
        <Button full size="lg" disabled={!ready} onClick={submit}>
          Verify
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}
