'use client'

import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FormState {
  fullName: string
  institution: string
  role: string
  country: string
  email: string
  phone: string
  message: string
}

const COUNTRIES = [
  'Lebanon',
  'UAE',
  'Saudi Arabia',
  'Kuwait',
  'Bahrain',
  'Qatar',
  'Other',
]

const INITIAL: FormState = {
  fullName: '',
  institution: '',
  role: '',
  country: 'Lebanon',
  email: '',
  phone: '',
  message: '',
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] uppercase tracking-wider font-semibold text-brand-light mb-1.5"
    >
      {children}
      {required && (
        <span className="text-rose-300 ml-0.5" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}

export function ContactForm() {
  const [state, setState] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!state.fullName.trim()) e.fullName = 'Required'
    if (!state.institution.trim()) e.institution = 'Required'
    if (!state.role.trim()) e.role = 'Required'
    if (!state.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) e.email = 'Enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    setStatus('loading')
    console.log('Amwali demo request:', state)
    await new Promise((r) => setTimeout(r, 900))
    setStatus('success')
  }

  const inputCls =
    'w-full rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 px-4 py-3 text-sm outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/30 transition'

  return (
    <div
      id="contact"
      className="rounded-2xl bg-ink-mid border border-white/10 p-6 sm:p-8 backdrop-blur-md"
    >
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10"
          >
            <div className="w-16 h-16 rounded-full bg-brand/20 grid place-items-center text-brand-light text-3xl mx-auto">
              ✓
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">Thank you!</h3>
            <p className="mt-2 text-sm text-white/65 max-w-sm mx-auto">
              We&apos;ll be in touch within 24 hours to schedule your live walkthrough.
            </p>
            <button
              onClick={() => {
                setState(INITIAL)
                setStatus('idle')
              }}
              className="mt-6 text-[12px] text-brand-light underline-offset-4 hover:underline"
            >
              Send another request
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={onSubmit}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" required>
                  Full name
                </Label>
                <input
                  id="fullName"
                  type="text"
                  value={state.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  className={inputCls}
                  placeholder="Layla Haddad"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-err' : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-err" className="text-xs text-rose-300 mt-1">
                    {errors.fullName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="institution" required>
                  Institution
                </Label>
                <input
                  id="institution"
                  type="text"
                  value={state.institution}
                  onChange={(e) => set('institution', e.target.value)}
                  className={inputCls}
                  placeholder="Your bank or fintech"
                  aria-invalid={!!errors.institution}
                />
                {errors.institution && <p className="text-xs text-rose-300 mt-1">{errors.institution}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" required>
                  Your role
                </Label>
                <input
                  id="role"
                  type="text"
                  value={state.role}
                  onChange={(e) => set('role', e.target.value)}
                  className={inputCls}
                  placeholder="Head of Digital"
                  aria-invalid={!!errors.role}
                />
                {errors.role && <p className="text-xs text-rose-300 mt-1">{errors.role}</p>}
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={state.country}
                  onChange={(e) => set('country', e.target.value)}
                  className={`${inputCls} appearance-none`}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-ink text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" required>
                  Work email
                </Label>
                <input
                  id="email"
                  type="email"
                  value={state.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputCls}
                  placeholder="layla@yourbank.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-rose-300 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <input
                  id="phone"
                  type="tel"
                  value={state.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className={inputCls}
                  placeholder="+961 or +971"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Tell us about your use case</Label>
              <textarea
                id="message"
                rows={4}
                value={state.message}
                onChange={(e) => set('message', e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Markets you serve, current pain points, timeline…"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-12 rounded-xl bg-brand text-white font-semibold hover:bg-brand-deep transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-brand/30"
            >
              {status === 'loading' ? (
                <span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden
                />
              ) : (
                <>Request demo →</>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
