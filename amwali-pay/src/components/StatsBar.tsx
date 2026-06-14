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
  value: number
  formatter: (n: number) => string
  displayValue: string
  label: string
}

const STATS: Stat[] = [
  {
    value: 9.9,
    displayValue: '$9.9B',
    formatter: (n) => `$${n.toFixed(1)}B`,
    label: 'Lebanon cash economy (World Bank 2023)',
  },
  {
    value: 45.7,
    displayValue: '45.7%',
    formatter: (n) => `${n.toFixed(1)}%`,
    label: 'of Lebanon GDP is cash-based',
  },
  {
    value: 90,
    displayValue: '90%+',
    formatter: (n) => `${Math.round(n)}%+`,
    label: 'internet penetration Lebanon',
  },
  {
    value: 500,
    displayValue: '$500B+',
    formatter: (n) => `$${Math.round(n)}B+`,
    label: 'UAE payments market 2024',
  },
]

function Counter({ stat }: { stat: Stat }) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (latest) => stat.formatter(latest))
  const [text, setText] = useState(stat.formatter(0))

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
    <span ref={ref} className="text-white font-bold text-4xl sm:text-5xl tracking-tight">
      {prefersReduced && inView ? stat.displayValue : text}
    </span>
  )
}

export function StatsBar() {
  return (
    <section className="bg-ink py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="text-center sm:text-left"
          >
            <Counter stat={stat} />
            <div className="mt-2 text-[13px] text-white/65 leading-snug">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
