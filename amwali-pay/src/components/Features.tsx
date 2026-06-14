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

interface PanelProps {
  index: number
  total: number
  scrollYProgress: MotionValue<number>
  feature: (typeof FEATURES)[number]
  prefersReduced: boolean | null
}

function useFeatureMotion(
  index: number,
  total: number,
  scrollYProgress: MotionValue<number>,
  prefersReduced: boolean | null,
) {
  const peak = total > 1 ? index / (total - 1) : 0.5
  const reach = total > 1 ? 1 / (total - 1) : 1

  const opacity = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [peak - reach, peak, peak + reach],
    prefersReduced ? [1, 1] : [0, 1, 0],
  )
  const y = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [peak - reach, peak, peak + reach],
    prefersReduced ? [0, 0] : [30, 0, -30],
  )
  const scale = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [peak - reach, peak, peak + reach],
    prefersReduced ? [1, 1] : [0.94, 1, 0.94],
  )

  return { opacity, y, scale }
}

function FeatureCopy({ index, total, scrollYProgress, feature, prefersReduced }: PanelProps) {
  const { opacity, y } = useFeatureMotion(index, total, scrollYProgress, prefersReduced)
  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex items-center"
      aria-hidden={index !== 0}
    >
      <div className="w-full">
        <div className="text-xs uppercase tracking-[0.2em] text-brand font-semibold mb-3">
          {String(index + 1).padStart(2, '0')} · Capability
        </div>
        <h3 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-ink leading-[1.05] tracking-tight">
          {feature.titleEn}
        </h3>
        <p className="mt-5 text-[17px] text-ink/65 leading-relaxed max-w-md">
          {feature.body}
        </p>
      </div>
    </motion.div>
  )
}

function FeatureVisual({ index, total, scrollYProgress, feature, prefersReduced }: PanelProps) {
  const { opacity, scale } = useFeatureMotion(index, total, scrollYProgress, prefersReduced)
  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <div className="relative w-full max-w-[420px] aspect-square">
        <div
          aria-hidden
          className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-brand-pale to-white border border-brand/15 shadow-[0_30px_80px_-30px_rgba(0,82,255,0.35)]"
        />
        <div
          aria-hidden
          className="absolute inset-6 rounded-[28px] border border-brand/10 blue-radial opacity-50"
        />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <motion.div
              className="w-32 h-32 mx-auto rounded-full bg-white border border-brand/20 grid place-items-center text-6xl shadow-xl"
              animate={prefersReduced ? {} : { y: [0, -8, 0] }}
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

interface IndicatorProps {
  index: number
  total: number
  scrollYProgress: MotionValue<number>
  prefersReduced: boolean | null
}

function Indicator({ index, total, scrollYProgress, prefersReduced }: IndicatorProps) {
  const peak = total > 1 ? index / (total - 1) : 0.5
  const reach = total > 1 ? 1 / (total - 1) : 1
  const activeness = useTransform(
    scrollYProgress,
    prefersReduced ? [0, 1] : [peak - reach, peak, peak + reach],
    prefersReduced ? [0, 1] : [0, 1, 0],
  )
  const width = useTransform(activeness, (v) => `${28 + v * 16}px`)
  const bg = useTransform(activeness, (v) => {
    const r = Math.round(208 - v * 208)
    const g = Math.round(216 - v * 134)
    const b = Math.round(232 - v * (232 - 255))
    return `rgb(${r}, ${g}, ${b})`
  })
  return <motion.span className="block h-1.5 rounded-full" style={{ width, backgroundColor: bg }} />
}

export function Features() {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const total = FEATURES.length
  // Container height: 1 viewport for the pinned area + (n-1) viewports of scrolling = 1 viewport per transition
  const sectionHeight = `${total * 100}vh`

  return (
    <section id="features" className="bg-off-white">
      <div ref={containerRef} className="relative" style={{ height: sectionHeight }}>
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
                    total={total}
                    scrollYProgress={scrollYProgress}
                    prefersReduced={prefersReduced}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center h-full">
              <div className="relative h-[360px] sm:h-[420px] lg:h-[440px] order-2 lg:order-1">
                {FEATURES.map((f, i) => (
                  <FeatureCopy
                    key={f.titleEn}
                    index={i}
                    total={total}
                    scrollYProgress={scrollYProgress}
                    feature={f}
                    prefersReduced={prefersReduced}
                  />
                ))}
              </div>
              <div className="relative h-[360px] sm:h-[420px] lg:h-[440px] order-1 lg:order-2">
                {FEATURES.map((f, i) => (
                  <FeatureVisual
                    key={f.titleEn}
                    index={i}
                    total={total}
                    scrollYProgress={scrollYProgress}
                    feature={f}
                    prefersReduced={prefersReduced}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
