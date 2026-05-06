'use client';

import type { ReactNode } from 'react';

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 390, maxWidth: '100%' }}>
      <div
        className="relative rounded-[56px] bg-ink-900 p-[12px] shadow-phone"
        style={{ aspectRatio: '390/844' }}
      >
        {/* Inner screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[44px] bg-sand-100">
          {/* Dynamic island */}
          <div className="pointer-events-none absolute top-2 left-1/2 z-50 -translate-x-1/2">
            <div className="h-[28px] w-[110px] rounded-full bg-black" />
          </div>
          <div className="relative h-full w-full">{children}</div>
          {/* Home indicator */}
          <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-50 -translate-x-1/2">
            <div className="h-[5px] w-[134px] rounded-full bg-ink-900/90" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenContainer({
  children,
  className = '',
  bg = 'bg-sand-100',
}: {
  children: ReactNode;
  className?: string;
  bg?: string;
}) {
  return (
    <div className={`flex h-full w-full flex-col ${bg} ${className}`}>{children}</div>
  );
}

export function ScreenHeader({
  title,
  onBack,
  trailing,
}: {
  title?: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-5 pt-12 pb-3">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex h-9 w-9 -ml-2 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50 active:bg-ink-100 transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-6-6 6-6" />
          </svg>
        </button>
      ) : null}
      <div className="flex-1 text-[17px] font-semibold tracking-tight text-ink-900">{title}</div>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}

export function ScreenBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto px-5 pb-5 scrollbar-none ${className}`}>{children}</div>
  );
}

export function ScreenFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 pb-8 pt-3 ${className}`}>{children}</div>
  );
}
