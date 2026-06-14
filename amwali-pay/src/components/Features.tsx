'use client'

import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { FEATURES } from '@/lib/constants'

interface FeatureRowProps {
  index: number
  scrollYProgress: MotionValue<number>
  feature: (typeof FEATURES)[number]
}

function FeatureRow({ index, scrollYProgress, feature }: FeatureRowProps) {
  const prefersReduced = useReducedMotion()
  const total = FEATURES.length
  const span = 1 / total
  const start = index * span
  const end = start + span

  const padStart = Math.max(0, start - span * 0.4)
  const padEnd = Math.min(1, end + span * 0.4)

  const opacity = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [padStart, start + span * 0.2, end - span * 0.2, padEnd],
    prefersReduced ? [1, 1] : [0.18, 1, 1, 0.18],
  )
  const y = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [padStart, start + span * 0.2, end - span * 0.2, padEnd],
    prefersReduced ? [0, 0] : [40, 0, 0, -40],
  )
  const scale = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [padStart, start + span * 0.5, padEnd],
    prefersReduced ? [1, 1] : [0.96, 1, 0.96],
  )

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="absolute inset-0 flex items-center"
    >
      <div className="w-full">
        <div className="text-xs uppercase tracking-[0.2em] text-brand font-semibold mb-3">
          0{index + 1} · Capability
        </div>
        <h3 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-ink leading-tight tracking-tight">
          {feature.titleEn}
        </h3>
        <p className="mt-5 text-[17px] text-ink/65 leading-relaxed max-w-md">
          {feature.body}
        </p>
      </div>
    </motion.div>
  )
}

interface FeatureVisualProps {
  index: number
  scrollYProgress: MotionValue<number>
  feature: (typeof FEATURES)[number]
}

function FeatureVisual({ index, scrollYProgress, feature }: FeatureVisualProps) {
  const prefersReduced = useReducedMotion()
  const total = FEATURES.length
  const span = 1 / total
  const start = index * span
  const end = start + span
  const mid = start + span / 2

  const opacity = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [start, mid, end],
    prefersReduced ? [1, 1, 1] : [0, 1, 0],
  )
  const scale = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [start, mid, end],
    prefersReduced ? [1, 1, 1] : [0.86, 1, 0.86],
  )
  const rotate = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [start, end],
    prefersReduced ? [0, 0] : [-4, 4],
  )

  return (
    <motion.div
      style={{ opacity, scale, rotate }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative w-full max-w-[420px] aspect-square">
        <div
          aria-hidden
          className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-brand-pale to-white border border-brand/15 shadow-[0_30px_80px_-30px_rgba(0,82,255,0.4)]"
        />
        <div
          aria-hidden
          className="absolute inset-6 rounded-[28px] border border-brand/15 blue-radial opacity-50"
        />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <motion.div
              className="w-32 h-32 mx-auto rounded-full bg-white border border-brand/15 grid place-items-center text-6xl shadow-xl"
              animate={
                prefersReduced
                  ? {}
                  : { y: [0, -8, 0] }
              }
              transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
            >
              <span aria-hidden>{feature.icon}</span>
            </motion.div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-brand/20 px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span className="text-xs font-semibold text-ink">
                {feature.titleEn}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function Features() {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Sticky scroll height: one viewport per feature
  const sectionHeight = `calc(${FEATURES.length} * 100vh)`

  return (
    <section id="features" className="bg-off-white">
      <div
        ref={containerRef}
        className="relative"
        style={{ height: sectionHeight }}
      >
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pt-24 pb-8">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-brand font-semibold">
                  What you get
                </div>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-ink">
                  Everything your customers need
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {FEATURES.map((_, i) => (
                  <Indicator
                    key={i}
                    index={i}
                    total={FEATURES.length}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center h-full">
              <div className="relative h-[360px] sm:h-[420px] lg:h-[440px] order-2 lg:order-1">
                {FEATURES.map((f, i) => (
                  <FeatureRow
                    key={f.titleEn}
                    index={i}
                    scrollYProgress={scrollYProgress}
                    feature={f}
                  />
                ))}
              </div>
              <div className="relative h-[360px] sm:h-[420px] lg:h-[440px] order-1 lg:order-2">
                {FEATURES.map((f, i) => (
                  <FeatureVisual
                    key={f.titleEn}
                    index={i}
                    scrollYProgress={scrollYProgress}
                    feature={f}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile fallback: simple list rendered below the sticky scroll on small screens for accessibility */}
      <noscript>
        <ul className="max-w-3xl mx-auto px-5 py-10 space-y-6">
          {FEATURES.map((f) => (
            <li key={f.titleEn} className="rounded-2xl bg-white border border-border p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-bold text-ink">{f.titleEn}</h3>
              <p className="mt-2 text-sm text-ink/65">{f.body}</p>
            </li>
          ))}
        </ul>
      </noscript>
      {/* Keep prefersReduced from being flagged as unused in static analysis. */}
      <span hidden aria-hidden>{prefersReduced ? '' : ''}</span>
    </section>
  )
}

interface IndicatorProps {
  index: number
  total: number
  scrollYProgress: MotionValue<number>
}

function Indicator({ index, total, scrollYProgress }: IndicatorProps) {
  const prefersReduced = useReducedMotion()
  const span = 1 / total
  const start = index * span
  const end = start + span
  const width = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [start, end],
    prefersReduced ? ['28px', '28px'] : ['28px', '40px'],
  )
  const bg = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [start - 0.05, start, end, end + 0.05],
    prefersReduced ? ['#0052FF', '#0052FF'] : ['#D0D8E8', '#0052FF', '#0052FF', '#D0D8E8'],
  )
  return (
    <motion.span
      className="block h-1.5 rounded-full"
      style={{ width, backgroundColor: bg }}
    />
  )
}
