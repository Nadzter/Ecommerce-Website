'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { GLOBAL_RAILS, MARKETS } from '@/lib/constants'

interface PillGroupProps {
  title: string
  pills: { label: string; flag?: string }[]
  pillStyle: { color: string; borderColor: string; backgroundColor: string }
}

function PillGroup({ title, pills, pillStyle }: PillGroupProps) {
  const prefersReduced = useReducedMotion()
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
      <div className="text-xs uppercase tracking-[0.18em] text-navy/55 font-semibold">
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
              borderColor: pillStyle.borderColor,
              color: pillStyle.color,
              backgroundColor: pillStyle.backgroundColor,
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
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">
            Settlement
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">Local rails, global reach</h2>
          <p
            className="font-arabic text-base text-navy/55 mt-2"
            lang="ar"
            dir="rtl"
          >
            قنوات محلية، انتشار عالمي
          </p>
          <p className="mt-3 text-navy/60 text-sm sm:text-base">
            We plug into the rail that&apos;s already winning in each market. No fund
            custody. No new licenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          <PillGroup
            title="Lebanon"
            pills={MARKETS.lb.rails.map((r) => ({ label: r, flag: '🇱🇧' }))}
            pillStyle={{
              color: MARKETS.lb.accentColor,
              borderColor: MARKETS.lb.accentColor,
              backgroundColor: '#fff8f5',
            }}
          />
          <PillGroup
            title="UAE"
            pills={MARKETS.ae.rails.map((r) => ({ label: r, flag: '🇦🇪' }))}
            pillStyle={{
              color: MARKETS.ae.accentColor,
              borderColor: MARKETS.ae.accentColor,
              backgroundColor: '#f0faf7',
            }}
          />
          <PillGroup
            title="Global"
            pills={GLOBAL_RAILS.map((r) => ({ label: r.label }))}
            pillStyle={{
              color: '#445566',
              borderColor: '#D0D8E8',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      </div>
    </section>
  )
}
