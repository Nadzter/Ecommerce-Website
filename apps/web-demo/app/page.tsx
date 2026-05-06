'use client';

import { ArrowRight, RefreshCw, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { DemoProvider, useDemo } from '@/lib/demo-state';
import { DemoStage } from '@/components/DemoStage';

export default function HomePage() {
  return (
    <DemoProvider>
      <Page />
    </DemoProvider>
  );
}

function Page() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-sand-100 to-sand-200">
      {/* Top nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 4 L4 26 L10 26 L16 16 L22 26 L28 26 Z" fill="currentColor" />
            </svg>
          </div>
          <span className="font-display text-[20px] font-semibold tracking-tight text-ink-900">
            Amwali
          </span>
          <span className="ml-2 hidden rounded-full border border-ink-200 px-2 py-0.5 text-[11px] font-medium text-ink-500 sm:inline">
            UAE preview
          </span>
        </div>
        <ResetButton />
      </nav>

      {/* Hero + phone */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-4">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-700">
              <Sparkles size={12} />
              Clickable preview
            </span>
            <h1 className="mt-4 font-display text-[44px] sm:text-[58px] leading-[0.95] tracking-tight text-ink-900 text-balance">
              Send money from
              <br />
              inside <em className="not-italic text-accent-600">any chat.</em>
            </h1>
            <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-ink-600">
              Amwali is an iOS keyboard. Tap the keyboard icon in WhatsApp, iMessage or anywhere
              else, pick a recipient, send. Money moves bank-to-bank — Amwali never holds your funds.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Bullet icon={Zap} title="Instant" body="Bank-to-bank in seconds." />
              <Bullet icon={ShieldCheck} title="Secure" body="Open banking + Face ID." />
              <Bullet icon={Sparkles} title="Native" body="Works in every chat app." />
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <TryButton />
              <p className="text-[13px] text-ink-500">
                No real money moves · UAE only · Built for screen-share demos.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-ink-100 bg-white/60 backdrop-blur p-4 text-[13px] text-ink-600">
              <p className="font-semibold text-ink-800">How to use this demo</p>
              <ol className="mt-2 list-decimal list-inside space-y-1.5">
                <li>Tap <em className="font-medium text-ink-800">Get started</em> on the phone.</li>
                <li>Use email <span className="font-mono">sara@example.ae</span> and the OTP <span className="font-mono">482913</span>.</li>
                <li>Pick any UAE bank — auto-approves.</li>
                <li>From the home screen, tap <em className="font-medium text-ink-800">Try it</em> to enter a chat and use the keyboard.</li>
              </ol>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex items-center justify-center">
            <DemoStage />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl border-t border-ink-100 px-6 py-8 text-[12px] text-ink-400">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p>© 2026 Amwali · Demo preview · Not a financial product.</p>
          <p>UAE PISP product. Phase 1 built behind a mock provider.</p>
        </div>
      </footer>
    </main>
  );
}

function Bullet({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Zap;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-ink-100 bg-white/70 backdrop-blur p-3.5">
      <Icon size={18} className="text-accent-600" />
      <p className="mt-2 text-[14px] font-semibold text-ink-900">{title}</p>
      <p className="text-[13px] text-ink-500">{body}</p>
    </div>
  );
}

function TryButton() {
  const { goTo, screen } = useDemo();
  return (
    <button
      onClick={() => goTo(screen === 'welcome' ? 'email' : 'chat')}
      className="inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-[14px] font-semibold text-white hover:bg-ink-800 active:bg-ink-900 transition-colors"
    >
      Try the keyboard
      <ArrowRight size={16} />
    </button>
  );
}

function ResetButton() {
  const { reset } = useDemo();
  return (
    <button
      onClick={reset}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-600 hover:bg-ink-50 transition-colors"
    >
      <RefreshCw size={12} />
      Reset demo
    </button>
  );
}
