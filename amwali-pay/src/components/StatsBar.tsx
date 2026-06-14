'use client'

import { useEffect, useRef, useState } from 'react'
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from 'framer-motion'

interface Stat {
  prefix?: string
  value: number
  suffix?: string
  formatter?: (n: number) => string
  displayValue: string
  labelEn: string
  labelAr: string
}

const STATS: Stat[] = [
  {
    value: 9.9,
    displayValue: '$9.9B',
    formatter: (n) => `$${n.toFixed(1)}B`,
    labelEn: 'Lebanon cash economy (World Bank 2023)',
    labelAr: 'اقتصاد نقدي',
  },
  {
    value: 45.7,
    displayValue: '45.7%',
    formatter: (n) => `${n.toFixed(1)}%`,
    labelEn: 'of Lebanon GDP is cash-based',
    labelAr: 'من الناتج المحلي',
  },
  {
    value: 90,
    displayValue: '90%+',
    formatter: (n) => `${Math.round(n)}%+`,
    labelEn: 'internet penetration Lebanon',
    labelAr: 'انتشار الإنترنت',
  },
  {
    value: 500,
    displayValue: '$500B+',
    formatter: (n) => `$${Math.round(n)}B+`,
    labelEn: 'UAE payments market 2024',
    labelAr: 'سوق المدفوعات في الإمارات',
  },
]

function Counter({ stat }: { stat: Stat }) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (latest) => stat.formatter!(latest))
  const [text, setText] = useState(stat.formatter!(0))

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      motionValue.set(stat.value)
      return
    }
    const controls = animate(motionValue, stat.value, {
      duration: 2,
      ease: 'easeOut',
    })
    const unsub = display.on('change', (v) => setText(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [inView, motionValue, stat, display, prefersReduced])

  return (
    <span ref={ref} className="text-gold font-bold text-4xl sm:text-5xl tracking-tight">
      {prefersReduced && inView ? stat.displayValue : text}
    </span>
  )
}

export function StatsBar() {
  return (
    <section className="bg-navy py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {STATS.map((stat) => (
          <motion.div
            key={stat.labelEn}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="text-center sm:text-left"
          >
            <Counter stat={stat} />
            <div className="mt-2 text-[13px] text-white/65 leading-snug">{stat.labelEn}</div>
            <div
              className="mt-1 text-[11px] text-gold/75 font-arabic"
              lang="ar"
              dir="rtl"
            >
              {stat.labelAr}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
