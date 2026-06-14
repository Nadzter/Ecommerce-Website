'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { HOW_STEPS } from '@/lib/constants'

export function HowItWorks() {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.4 })

  return (
    <section id="how" className="bg-ink py-20 lg:py-28 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0, 82, 255, 1) 1px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-brand-light font-semibold mb-3">
            Four steps
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">How it works</h2>
        </div>

        <div ref={containerRef} className="relative">
          <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-[2px] bg-white/10" aria-hidden />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: prefersReduced ? 0 : 1.2, delay: 0.4, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
            className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-[2px] bg-brand z-10"
            aria-hidden
          />

          <div className="relative z-20 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
            {HOW_STEPS.map((step, idx) => (
              <motion.div
                key={step.n}
                initial={prefersReduced ? false : { opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                transition={{ duration: 0.45, delay: 0.2 + idx * 0.15 }}
                className="text-center px-2"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-brand grid place-items-center text-white font-bold text-lg shadow-lg shadow-brand/30">
                  {step.n}
                </div>
                <h3 className="mt-4 text-sm font-bold text-white">{step.titleEn}</h3>
                <p className="text-[12px] text-white/60 mt-2 leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
