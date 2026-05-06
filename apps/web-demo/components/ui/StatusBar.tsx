'use client';

export function StatusBar({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const text = tone === 'dark' ? 'text-ink-900' : 'text-white';
  return (
    <div className={`flex items-center justify-between px-7 pt-3 pb-1 text-[13px] font-semibold ${text}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="0.5" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
      <path d="M7.5 2.5C9.6 2.5 11.55 3.3 13 4.65L12 5.85C10.85 4.7 9.25 4 7.5 4S4.15 4.7 3 5.85L2 4.65C3.45 3.3 5.4 2.5 7.5 2.5Z" />
      <path d="M7.5 5C8.85 5 10.05 5.5 10.95 6.3L9.95 7.5C9.3 6.95 8.45 6.6 7.5 6.6S5.7 6.95 5.05 7.5L4.05 6.3C4.95 5.5 6.15 5 7.5 5Z" />
      <circle cx="7.5" cy="9" r="1.3" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
      <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" opacity="0.4" />
      <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor" />
      <rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
