'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { GLOBAL_RAILS, MARKETS } from '@/lib/constants'

interface PillGroupProps {
  title: string
  pills: { label: string; flag?: string }[]
  variant: 'brand' | 'ink' | 'neutral'
}

function pillStyle(variant: PillGroupProps['variant']) {
  switch (variant) {
    case 'brand':
      return {
        color: '#0052FF',
        borderColor: '#0052FF',
        backgroundColor: '#EBF2FF',
      }
    case 'ink':
      return {
        color: '#0A0E27',
        borderColor: '#0A0E27',
        backgroundColor: '#F5F8FF',
      }
    case 'neutral':
    default:
      return {
        color: '#445566',
        borderColor: '#D0D8E8',
        backgroundColor: '#ffffff',
      }
  }
}

function PillGroup({ title, pills, variant }: PillGroupProps) {
  const prefersReduced = useReducedMotion()
  const style = pillStyle(variant)
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
      className="flex flex-col items-center gap-3"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-ink/55 font-semibold">
        {title}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pills.map((p) => (
          <motion.span
            key={p.label}
            variants={
              prefersReduced
                ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
            }
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-1.5 rounded-full border text-[13px] font-semibold"
            style={{
              padding: '10px 20px',
              borderColor: style.borderColor,
              color: style.color,
              backgroundColor: style.backgroundColor,
            }}
          >
            {p.flag && <span aria-hidden>{p.flag}</span>}
            {p.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}

export function Rails() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-brand font-semibold mb-3">
            Settlement
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink">Local rails, global reach</h2>
          <p className="mt-3 text-ink/60 text-sm sm:text-base">
            We plug into the rail that&apos;s already winning in each market. No fund
            custody. No new licenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          <PillGroup
            title="Lebanon"
            pills={MARKETS.lb.rails.map((r) => ({ label: r, flag: '🇱🇧' }))}
            variant="brand"
          />
          <PillGroup
            title="UAE"
            pills={MARKETS.ae.rails.map((r) => ({ label: r, flag: '🇦🇪' }))}
            variant="ink"
          />
          <PillGroup
            title="Global"
            pills={GLOBAL_RAILS.map((r) => ({ label: r.label }))}
            variant="neutral"
          />
        </div>
      </div>
    </section>
  )
}
