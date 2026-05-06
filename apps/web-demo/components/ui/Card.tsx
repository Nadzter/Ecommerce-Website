'use client';

import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'rounded-2xl bg-white border border-ink-100 shadow-soft',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

export function CardRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className = '',
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-4 py-3 text-left',
        onClick ? 'hover:bg-ink-50 active:bg-ink-100 transition-colors' : '',
        className,
      ].join(' ')}
    >
      {leading ? <div className="flex-none">{leading}</div> : null}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink-900 truncate">{title}</div>
        {subtitle ? <div className="text-[13px] text-ink-500 truncate">{subtitle}</div> : null}
      </div>
      {trailing ? <div className="flex-none text-ink-400">{trailing}</div> : null}
    </Component>
  );
}

export function Avatar({
  initials,
  emoji,
  color,
  size = 40,
}: {
  initials?: string;
  emoji?: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold tracking-tight"
      style={{
        width: size,
        height: size,
        background: color ?? '#0A2540',
        fontSize: size * 0.36,
      }}
    >
      {emoji ? <span style={{ fontSize: size * 0.55 }}>{emoji}</span> : initials}
    </div>
  );
}
