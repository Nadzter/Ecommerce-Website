'use client'

import { useEffect, useReducer, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  MARKETS,
  type Currency,
  type MarketCode,
  type SampleMessage,
} from '@/lib/constants'

export type SimStage =
  | 'idle'
  | 'opening'
  | 'meDraft'
  | 'meTyping'
  | 'keyboardOpen'
  | 'paymentSent'
  | 'recipientTyping'
  | 'recipientReply'
  | 'settled'

export interface SimMessage {
  id: string
  text: string
  side: 'me' | 'them'
  type?: 'text' | 'payment' | 'success'
}

export interface SimState {
  stage: SimStage
  messages: SimMessage[]
  showKeyboard: boolean
  showTyping: 'me' | 'them' | null
  showPaymentBubble: boolean
  paymentSettled: boolean
}

type Action =
  | { type: 'reset'; market: MarketCode }
  | { type: 'add'; message: SimMessage }
  | { type: 'set'; partial: Partial<SimState> }
  | { type: 'mark-success'; id: string }

const initialState: SimState = {
  stage: 'idle',
  messages: [],
  showKeyboard: false,
  showTyping: null,
  showPaymentBubble: false,
  paymentSettled: false,
}

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'reset':
      return {
        ...initialState,
        messages: MARKETS[action.market].sampleMessages.map<SimMessage>((m, i) => ({
          id: `seed-${i}`,
          text: m.text,
          side: m.side,
          type: 'text',
        })),
      }
    case 'add':
      return { ...state, messages: [...state.messages, action.message] }
    case 'set':
      return { ...state, ...action.partial }
    case 'mark-success':
      return {
        ...state,
        paymentSettled: true,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, type: 'success' } : m,
        ),
      }
  }
}

export interface ChatSimulationProps {
  market: MarketCode
  amount: number
  currency: Currency
  platform: string
  autoPlay?: boolean
  trigger: number
  onComplete?: () => void
}

export function useChatSimulation({
  market,
  amount,
  currency,
  platform,
  autoPlay = false,
  trigger,
  onComplete,
}: ChatSimulationProps): SimState {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => ({
    ...init,
    messages: MARKETS[market].sampleMessages.map<SimMessage>((m, i) => ({
      id: `seed-${i}`,
      text: m.text,
      side: m.side,
      type: 'text',
    })),
  }))

  const prefersReduced = useReducedMotion()
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastTriggerRef = useRef<number>(0)

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    dispatch({ type: 'reset', market })
  }, [market])

  useEffect(() => {
    if (trigger === 0 && !autoPlay) return
    if (trigger === lastTriggerRef.current && trigger !== 0) return
    lastTriggerRef.current = trigger

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    dispatch({ type: 'reset', market })

    const m = MARKETS[market]
    const paymentId = `pay-${Date.now()}`

    const at = (ms: number, fn: () => void) => {
      if (prefersReduced) {
        fn()
        return
      }
      const t = setTimeout(fn, ms)
      timersRef.current.push(t)
    }

    const initialMessages: SampleMessage[] = m.sampleMessages

    initialMessages.forEach((msg, idx) => {
      at(idx * 300, () => {
        if (idx === 0) {
          dispatch({ type: 'set', partial: { messages: [], stage: 'opening' } })
        }
        dispatch({
          type: 'add',
          message: { id: `seed-${idx}-${Date.now()}`, text: msg.text, side: msg.side, type: 'text' },
        })
      })
    })

    at(800 + initialMessages.length * 300, () => {
      dispatch({
        type: 'add',
        message: {
          id: `me-draft-${Date.now()}`,
          text: `Sending via Amwali on ${platform}…`,
          side: 'me',
          type: 'text',
        },
      })
      dispatch({ type: 'set', partial: { stage: 'meDraft' } })
    })

    at(1400 + initialMessages.length * 300, () => {
      dispatch({ type: 'set', partial: { showTyping: 'me', stage: 'meTyping' } })
    })

    at(2000 + initialMessages.length * 300, () => {
      dispatch({
        type: 'set',
        partial: { showTyping: null, showKeyboard: true, stage: 'keyboardOpen' },
      })
    })

    at(2800 + initialMessages.length * 300, () => {
      dispatch({
        type: 'add',
        message: { id: paymentId, text: '', side: 'me', type: 'payment' },
      })
      dispatch({
        type: 'set',
        partial: { showKeyboard: false, showPaymentBubble: true, stage: 'paymentSent' },
      })
    })

    at(3600 + initialMessages.length * 300, () => {
      dispatch({ type: 'set', partial: { showTyping: 'them', stage: 'recipientTyping' } })
    })

    at(4400 + initialMessages.length * 300, () => {
      dispatch({ type: 'set', partial: { showTyping: null } })
      dispatch({
        type: 'add',
        message: {
          id: `them-${Date.now()}`,
          text: 'Got it, claiming now!',
          side: 'them',
          type: 'text',
        },
      })
      dispatch({ type: 'set', partial: { stage: 'recipientReply' } })
    })

    at(5000 + initialMessages.length * 300, () => {
      dispatch({ type: 'mark-success', id: paymentId })
      dispatch({ type: 'set', partial: { stage: 'settled' } })
    })

    at(5500 + initialMessages.length * 300, () => {
      onComplete?.()
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  // Silence unused warning for amount/currency — they are consumed by PhoneMockup directly,
  // and we keep them on the hook signature for a stable public API.
  void amount
  void currency

  return state
}
