'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FEE_TIERS } from '@/lib/constants'

export function Pricing() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="pricing" className="bg-off-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">
            Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">
            Simple, transparent pricing
          </h2>
          <p
            className="font-arabic text-base text-navy/55 mt-2"
            lang="ar"
            dir="rtl"
          >
            تسعير بسيط وشفاف
          </p>
          <p className="mt-3 text-navy/60 text-sm sm:text-base">
            One tiered fee, charged once to your institution. Never visible to the end
            customer.
          </p>
        </div>

        <div className="rounded-2xl bg-gold-pale border border-gold/30 p-5 sm:p-6 mb-10 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-gold text-2xl leading-none">✦</span>
            <div>
              <div className="text-sm font-semibold text-navy">
                The fee is charged B2B to your institution — never shown to the end customer.
              </div>
              <div
                className="text-[13px] font-arabic text-navy/65 mt-1"
                lang="ar"
                dir="rtl"
              >
                الرسوم تُحصَّل من المؤسسة المالية، وليس من العميل
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-white border-2 border-red-300 p-7"
          >
            <div className="text-xs uppercase tracking-wider text-red-500 font-semibold">
              Avoid
            </div>
            <h3 className="mt-2 text-xl font-bold text-navy">❌ Flat $0.25 on any transfer</h3>
            <p className="mt-3 text-sm text-navy/65 leading-relaxed">
              A flat fee makes small transfers economically absurd: on a $1 micro-payment
              the fee becomes 25%. It kills adoption, looks predatory, and erodes trust the
              moment a power-user does the math.
            </p>
            <ul className="mt-4 space-y-2 text-[13px] text-navy/65">
              <li className="flex items-start gap-2">
                <span className="text-red-500">×</span>
                Punishes the most active retail users
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">×</span>
                No path to scale on micro-transactions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">×</span>
                Loud risk of regulatory pushback
              </li>
            </ul>
            <div className="mt-5 text-sm italic text-red-600 border-t border-red-200 pt-4">
              Reject this model.
            </div>
          </motion.div>

          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl bg-white border-2 border-emerald-400 p-7 shadow-md"
          >
            <div className="text-xs uppercase tracking-wider text-emerald-600 font-semibold">
              Recommended
            </div>
            <h3 className="mt-2 text-xl font-bold text-navy">✅ Tiered fee structure</h3>
            <p className="mt-3 text-sm text-navy/65 leading-relaxed">
              Charge proportionally to transfer size. Below $20 we don&apos;t process at
              all — protects the customer experience.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-navy/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-off-white text-navy/55 text-[11px] uppercase tracking-wider">
                    <th className="text-left px-3 py-2 font-semibold">Range</th>
                    <th className="text-left px-3 py-2 font-semibold">Fee</th>
                    <th className="text-right px-3 py-2 font-semibold">Effective %</th>
                  </tr>
                </thead>
                <tbody>
                  {FEE_TIERS.map((t, idx) => {
                    const highlight = idx === 1
                    return (
                      <tr
                        key={t.label}
                        className={`border-t border-navy/5 ${
                          highlight ? 'bg-gold-pale' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 text-navy font-medium">{t.label}</td>
                        <td className="px-3 py-2.5 text-navy">
                          {t.feeUSD === null
                            ? <span className="text-red-500">Not supported</span>
                            : `$${t.feeUSD.toFixed(2)}`}
                        </td>
                        <td className="px-3 py-2.5 text-right text-navy/65 text-[12px]">
                          {t.note}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 text-sm italic text-emerald-600 border-t border-emerald-200 pt-4">
              OMT earns more than it pays.
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="mt-10 rounded-2xl bg-navy text-white p-6 sm:p-7 max-w-4xl mx-auto"
        >
          <div className="text-xs uppercase tracking-wider text-gold font-semibold mb-2">
            Worked example
          </div>
          <p className="text-[15px] leading-relaxed text-white/90">
            OMT Intra charges from <strong>$1</strong> on local transfers. On a{' '}
            <strong>$50</strong> transfer the bank earns ~<strong>$1–2</strong> in fees.
            Amwali&apos;s <strong>$0.25</strong> cut means the bank keeps{' '}
            <strong>$0.75–$1.75</strong>. <span className="text-gold">Net positive every time.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
