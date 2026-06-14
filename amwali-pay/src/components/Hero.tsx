'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { PhoneMockup } from './PhoneMockup'

const STATS = [
  { value: '$9.9B', label: 'Lebanon cash economy' },
  { value: '90%+', label: 'internet penetration' },
  { value: '$500B+', label: 'UAE payments market' },
]

export function Hero() {
  const prefersReduced = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }
  const itemVariants = prefersReduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, x: -12, y: 12 }, show: { opacity: 1, x: 0, y: 0 } }

  return (
    <section id="top" className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 85% 90%, rgba(0, 82, 255, 0.06), transparent 55%), radial-gradient(circle at 10% 0%, rgba(0, 82, 255, 0.04), transparent 50%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] blue-radial opacity-70 z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-xl"
        >
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-pale px-3.5 py-1.5 text-xs font-medium text-brand"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            Chat-native payments for banks &amp; fintechs
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="mt-5 text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.05] text-ink"
          >
            Turn every conversation into a
            <br />
            <span className="text-brand">payment</span> moment
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-[17px] leading-relaxed text-ink/65"
          >
            Amwali Pay is a white-label payment SDK that lives inside the chat apps your
            customers already use. Multi-currency. One tap. Face ID secured. Settles via
            the fastest local rail every time.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors shadow-md shadow-brand/25"
            >
              Try live demo
              <span aria-hidden>→</span>
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink px-6 py-3 text-sm font-semibold hover:border-brand hover:text-brand transition-colors"
            >
              Learn more
            </a>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            transition={{ delayChildren: 0.6, staggerChildren: 0.2 }}
            className="mt-10 flex flex-wrap gap-2.5"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.value}
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-3.5 py-1.5 text-[12px] text-ink/80 shadow-sm"
              >
                <span className="font-bold text-brand">{s.value}</span>
                <span className="text-ink/55">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="relative"
        >
          <PhoneMockup market="lb" animated trigger={1} />
        </motion.div>
      </div>
    </section>
  )
}
