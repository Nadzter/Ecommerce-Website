'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function CTA({ children }: { children?: ReactNode }) {
  const prefersReduced = useReducedMotion()

  return (
    <section className="bg-navy py-24 lg:py-28 relative overflow-hidden">
      <div
        aria-hidden
        className={`absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-gold blur-3xl opacity-[0.05] ${
          prefersReduced ? '' : 'animate-float-slow'
        }`}
      />
      <div
        aria-hidden
        className={`absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full bg-gold-light blur-3xl opacity-[0.05] ${
          prefersReduced ? '' : 'animate-float-slow-alt'
        }`}
      />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">
              Get started
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.08]">
              Ready to own every <span className="text-gold">payment moment?</span>
            </h2>
            <p
              className="mt-4 font-arabic text-lg text-gold/85"
              lang="ar"
              dir="rtl"
            >
              هل أنت مستعد لامتلاك كل لحظة دفع؟
            </p>
            <p className="mt-5 text-[15px] text-white/65 leading-relaxed max-w-md">
              Lebanon. UAE. Saudi Arabia next. Amwali is shipping the chat-native payment
              layer the Arab world has been waiting for — and your institution can lead it.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2"><span className="text-gold">✓</span> Fully white-labelled SDK</li>
              <li className="flex items-start gap-2"><span className="text-gold">✓</span> Live integration in &lt; 8 weeks</li>
              <li className="flex items-start gap-2"><span className="text-gold">✓</span> No fund custody, no new compliance burden</li>
            </ul>
          </motion.div>

          <div>{children}</div>
        </div>
      </div>
    </section>
  )
}
