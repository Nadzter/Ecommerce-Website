'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-800 text-white hover:bg-ink-700 active:bg-ink-900 disabled:bg-ink-300 disabled:text-white',
  secondary:
    'bg-accent text-ink-900 hover:bg-accent-400 active:bg-accent-500 disabled:bg-accent-100 disabled:text-ink-300',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-50 active:bg-ink-100',
  subtle:
    'bg-ink-50 text-ink-800 hover:bg-ink-100 active:bg-ink-200',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', full, className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight',
        'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    />
  );
});
