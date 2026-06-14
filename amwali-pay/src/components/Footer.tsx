'use client'

import { BRAND } from '@/lib/constants'

const PRODUCT_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Demo' },
  { href: '#how', label: 'How it works' },
  { href: '#contact', label: 'Contact' },
]

const MARKET_LINKS = [
  { label: 'Lebanon 🇱🇧' },
  { label: 'UAE 🇦🇪' },
  { label: 'Coming soon: Saudi Arabia 🇸🇦', muted: true },
  { label: 'Coming soon: Egypt 🇪🇬', muted: true },
]

const COMPANY_LINKS = [
  { href: '#', label: 'About' },
  { href: '#contact', label: 'Contact' },
  { href: '#', label: 'Privacy' },
]

function IconLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8c0 .33.27.6.6.6h16.8c.33 0 .6-.27.6-.6V3.6a.6.6 0 0 0-.6-.6ZM8.34 18.34H5.67V9.75h2.67v8.59Zm-1.33-9.75A1.55 1.55 0 1 1 7 5.48a1.55 1.55 0 0 1 0 3.11Zm11.34 9.75h-2.66v-4.18c0-1 0-2.27-1.39-2.27s-1.6 1.08-1.6 2.2v4.25H10v-8.59h2.56v1.17h.04a2.8 2.8 0 0 1 2.52-1.39c2.7 0 3.2 1.78 3.2 4.08v4.73Z" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.53 3H20.7l-6.91 7.9L22 21h-6.34l-4.96-6.49L4.99 21H1.81l7.4-8.45L2 3h6.5l4.48 5.92L17.53 3Zm-1.11 16.2h1.75L7.66 4.7H5.78l10.64 14.5Z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-ink-mid text-white/75 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <a
              href="#top"
              className="inline-flex items-center gap-1 text-2xl"
              aria-label="Amwali Pay home"
            >
              <span className="brand-logo-mark text-brand-light">amwali</span>
              <span className="font-bold text-white">pay</span>
            </a>
            <p className="mt-3 text-[13px] text-white/55 leading-relaxed max-w-xs">
              {BRAND.taglineEn}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full border border-white/15 grid place-items-center text-white/70 hover:text-brand-light hover:border-brand-light/50 transition-colors"
              >
                <IconLinkedIn />
              </a>
              <a
                href="#"
                aria-label="X (formerly Twitter)"
                className="w-9 h-9 rounded-full border border-white/15 grid place-items-center text-white/70 hover:text-brand-light hover:border-brand-light/50 transition-colors"
              >
                <IconX />
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-brand-light font-semibold mb-4">
              Product
            </div>
            <ul className="space-y-2.5 text-sm">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-white/70 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-brand-light font-semibold mb-4">
              Markets
            </div>
            <ul className="space-y-2.5 text-sm">
              {MARKET_LINKS.map((m) => (
                <li key={m.label} className={m.muted ? 'text-white/40' : 'text-white/70'}>
                  {m.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-brand-light font-semibold mb-4">
              Company
            </div>
            <ul className="space-y-2.5 text-sm">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-white/70 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 text-[12px]">
          <div className="text-white/55">
            © {BRAND.year} {BRAND.name} · Lebanon · UAE · Global
          </div>
          <div className="text-white/40">Built for the chat generation</div>
        </div>
      </div>
    </footer>
  )
}
