'use client'

import { useEffect, useReducer, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  MARKETS,
  type Currency,
  type MarketCode,
} from '@/lib/constants'

export type SimStage =
  | 'idle'
  | 'seedMessages'
  | 'qwertyOpen'
  | 'globeHighlight'
  | 'switcherOpen'
  | 'amwaliKeypad'
  | 'amountEntered'
  | 'faceIdScan'
  | 'faceIdSuccess'
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
  showQwerty: boolean
  globeHighlighted: boolean
  showSwitcher: boolean
  showAmwaliKeypad: boolean
  typedDigits: string
  showFaceId: boolean
  faceIdSuccess: boolean
  showTyping: 'me' | 'them' | null
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
  showQwerty: false,
  globeHighlighted: false,
  showSwitcher: false,
  showAmwaliKeypad: false,
  typedDigits: '',
  showFaceId: false,
  faceIdSuccess: false,
  showTyping: null,
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

    const digits = String(Math.round(amount))
    const seedLen = m.sampleMessages.length

    // Seed messages cascade
    m.sampleMessages.forEach((msg, idx) => {
      at(idx * 280, () => {
        if (idx === 0) {
          dispatch({ type: 'set', partial: { messages: [], stage: 'seedMessages' } })
        }
        dispatch({
          type: 'add',
          message: {
            id: `seed-${idx}-${Date.now()}`,
            text: msg.text,
            side: msg.side,
            type: 'text',
          },
        })
      })
    })

    const base = seedLen * 280 + 600

    // QWERTY keyboard slides up
    at(base, () => {
      dispatch({
        type: 'set',
        partial: { showQwerty: true, stage: 'qwertyOpen' },
      })
    })

    // Globe icon highlighted
    at(base + 900, () => {
      dispatch({
        type: 'set',
        partial: { globeHighlighted: true, stage: 'globeHighlight' },
      })
    })

    // Keyboard switcher opens
    at(base + 1500, () => {
      dispatch({
        type: 'set',
        partial: {
          globeHighlighted: false,
          showSwitcher: true,
          stage: 'switcherOpen',
        },
      })
    })

    // Amwali keypad opens
    at(base + 2600, () => {
      dispatch({
        type: 'set',
        partial: {
          showSwitcher: false,
          showAmwaliKeypad: true,
          stage: 'amwaliKeypad',
        },
      })
    })

    // Type digits one by one
    digits.split('').forEach((_, i) => {
      at(base + 3100 + i * 220, () => {
        dispatch({
          type: 'set',
          partial: { typedDigits: digits.slice(0, i + 1) },
        })
      })
    })

    const afterTyping = base + 3100 + digits.length * 220 + 350

    // Face ID scan
    at(afterTyping, () => {
      dispatch({
        type: 'set',
        partial: { showAmwaliKeypad: false, showFaceId: true, stage: 'faceIdScan' },
      })
    })

    // Face ID success
    at(afterTyping + 1400, () => {
      dispatch({
        type: 'set',
        partial: { faceIdSuccess: true, stage: 'faceIdSuccess' },
      })
    })

    // Payment bubble drops into chat
    at(afterTyping + 2100, () => {
      dispatch({
        type: 'set',
        partial: {
          showFaceId: false,
          faceIdSuccess: false,
          showQwerty: false,
          stage: 'paymentSent',
        },
      })
      dispatch({
        type: 'add',
        message: {
          id: paymentId,
          text: '',
          side: 'me',
          type: 'payment',
        },
      })
    })

    // Recipient typing
    at(afterTyping + 2900, () => {
      dispatch({
        type: 'set',
        partial: { showTyping: 'them', stage: 'recipientTyping' },
      })
    })

    // Recipient reply
    at(afterTyping + 3700, () => {
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

    // Settled
    at(afterTyping + 4300, () => {
      dispatch({ type: 'mark-success', id: paymentId })
      dispatch({ type: 'set', partial: { stage: 'settled' } })
    })

    at(afterTyping + 4800, () => {
      onComplete?.()
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  void platform
  void currency

  return state
}
