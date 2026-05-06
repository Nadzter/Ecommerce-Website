'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { ScreenBody, ScreenContainer, ScreenFooter, ScreenHeader } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';

export function EmailScreen() {
  const { goBack, goTo, draft, setDraft } = useDemo();
  const [email, setEmail] = useState(draft.email || 'sara@example.ae');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function next() {
    setDraft({ email });
    goTo('otp');
  }

  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Sign in" />
      <ScreenBody>
        <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink-900">
          What's your email?
        </h1>
        <p className="mt-2 text-[14px] text-ink-500">
          We'll send you a 6-digit code to confirm it's you.
        </p>
        <div className="mt-8">
          <Field
            label="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.ae"
          />
        </div>
        <p className="mt-6 text-[12px] text-ink-400 leading-relaxed">
          By continuing you agree to Amwali's Terms and Privacy Policy. Demo preview only — no
          email is actually sent.
        </p>
      </ScreenBody>
      <ScreenFooter>
        <Button full size="lg" disabled={!valid} onClick={next}>
          Continue
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}
