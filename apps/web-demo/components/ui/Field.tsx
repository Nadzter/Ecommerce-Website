'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  trailing?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, trailing, className = '', ...props },
  ref,
) {
  return (
    <label className="block">
      {label ? (
        <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">{label}</span>
      ) : null}
      <div className="relative mt-1.5">
        <input
          ref={ref}
          className={[
            'w-full h-12 rounded-xl bg-white border border-ink-100 px-4 text-[15px] text-ink-900',
            'placeholder:text-ink-300 outline-none',
            'focus:border-accent-400 focus:ring-2 focus:ring-accent-100',
            'transition-all duration-150',
            trailing ? 'pr-12' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-3 flex items-center text-ink-400">{trailing}</div>
        ) : null}
      </div>
      {hint ? <span className="mt-1.5 block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
});
