'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FEATURES } from '@/lib/constants'

export function Features() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="features" className="bg-off-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">
            What you get
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">
            Everything your customers need
          </h2>
          <p
            className="font-arabic text-base text-navy/55 mt-2"
            lang="ar"
            dir="rtl"
          >
            كل ما يحتاجه عملاؤك
          </p>
          <p className="mt-3 text-navy/60 text-sm sm:text-base">
            One SDK. Six capabilities. Built for the conversation-first reality of MENA.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.titleEn}
              variants={
                prefersReduced
                  ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                  : { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }
              }
              transition={{ duration: 0.4 }}
              className="group relative rounded-2xl bg-white border border-navy/10 p-7 transition-all hover:-translate-y-1 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              <div className="w-12 h-12 rounded-full bg-navy text-gold grid place-items-center text-2xl mb-5">
                <span aria-hidden>{f.icon}</span>
              </div>
              <h3 className="text-base font-bold text-navy">{f.titleEn}</h3>
              <p
                className="text-[13px] font-arabic text-navy/55 mt-0.5"
                lang="ar"
                dir="rtl"
              >
                {f.titleAr}
              </p>
              <p className="text-sm text-navy/65 mt-3 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
