/**
 * Transfer state machine.
 *
 *   pending ─► authorized ─► submitted ─► completed
 *      │           │             │
 *      │           │             └─► failed
 *      │           └─► failed
 *      └─► failed
 *      └─► (cancelled by user → failed with reason='cancelled')
 *
 *   completed ─► reversed   (chargeback / recall)
 *
 * `transition()` is a pure function: it does no I/O. Callers wrap it inside a
 * single DB transaction that updates `transfers` and inserts a row into
 * `transfer_events` atomically.
 */

export const TRANSFER_STATES = [
  'pending',
  'authorized',
  'submitted',
  'completed',
  'failed',
  'reversed',
] as const;

export type TransferState = (typeof TRANSFER_STATES)[number];

export type TransferEvent =
  | { type: 'authorize' }
  | { type: 'submit' }
  | { type: 'complete' }
  | { type: 'fail'; reason: string }
  | { type: 'cancel'; reason?: string }
  | { type: 'reverse'; reason: string };

export interface TransitionResult {
  to: TransferState;
  reason?: string;
}

export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: TransferState,
    public readonly event: TransferEvent,
  ) {
    super(`Illegal transition: ${from} --${event.type}-->`);
    this.name = 'IllegalTransitionError';
  }
}

export function transition(from: TransferState, event: TransferEvent): TransitionResult {
  switch (event.type) {
    case 'authorize':
      if (from === 'pending') return { to: 'authorized' };
      break;
    case 'submit':
      if (from === 'authorized') return { to: 'submitted' };
      break;
    case 'complete':
      if (from === 'submitted') return { to: 'completed' };
      break;
    case 'fail':
      if (from === 'pending' || from === 'authorized' || from === 'submitted') {
        return { to: 'failed', reason: event.reason };
      }
      break;
    case 'cancel':
      if (from === 'pending' || from === 'authorized') {
        return { to: 'failed', reason: event.reason ?? 'cancelled_by_user' };
      }
      break;
    case 'reverse':
      if (from === 'completed') return { to: 'reversed', reason: event.reason };
      break;
  }
  throw new IllegalTransitionError(from, event);
}

const TERMINAL = new Set<TransferState>(['completed', 'failed', 'reversed']);

export function isTerminal(state: TransferState): boolean {
  return TERMINAL.has(state);
}
