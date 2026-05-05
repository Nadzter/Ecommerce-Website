import { describe, expect, it } from 'vitest';
import {
  IllegalTransitionError,
  TRANSFER_STATES,
  type TransferEvent,
  type TransferState,
  isTerminal,
  transition,
} from './state-machine.js';

describe('transition', () => {
  it('drives the happy path pending → authorized → submitted → completed', () => {
    let s: TransferState = 'pending';
    s = transition(s, { type: 'authorize' }).to;
    expect(s).toBe('authorized');
    s = transition(s, { type: 'submit' }).to;
    expect(s).toBe('submitted');
    s = transition(s, { type: 'complete' }).to;
    expect(s).toBe('completed');
  });

  it('records the reason on fail/cancel/reverse', () => {
    expect(transition('pending', { type: 'fail', reason: 'insufficient_funds' })).toEqual({
      to: 'failed',
      reason: 'insufficient_funds',
    });
    expect(transition('authorized', { type: 'cancel' })).toEqual({
      to: 'failed',
      reason: 'cancelled_by_user',
    });
    expect(transition('completed', { type: 'reverse', reason: 'chargeback' })).toEqual({
      to: 'reversed',
      reason: 'chargeback',
    });
  });

  it('allows fail from pending, authorized, and submitted', () => {
    for (const from of ['pending', 'authorized', 'submitted'] as const) {
      expect(transition(from, { type: 'fail', reason: 'x' }).to).toBe('failed');
    }
  });

  it('forbids transitions out of terminal states', () => {
    for (const terminal of ['completed', 'failed', 'reversed'] as const) {
      const events: TransferEvent[] = [
        { type: 'authorize' },
        { type: 'submit' },
        { type: 'complete' },
        { type: 'cancel' },
      ];
      for (const e of events) {
        expect(() => transition(terminal, e)).toThrow(IllegalTransitionError);
      }
    }
  });

  it('forbids reverse from non-completed states', () => {
    for (const from of TRANSFER_STATES.filter((s) => s !== 'completed')) {
      expect(() => transition(from, { type: 'reverse', reason: 'x' })).toThrow(
        IllegalTransitionError,
      );
    }
  });

  it('forbids skip transitions (e.g. pending → submitted)', () => {
    expect(() => transition('pending', { type: 'submit' })).toThrow(IllegalTransitionError);
    expect(() => transition('pending', { type: 'complete' })).toThrow(IllegalTransitionError);
    expect(() => transition('authorized', { type: 'complete' })).toThrow(IllegalTransitionError);
  });

  it('throws an IllegalTransitionError carrying the from-state and event', () => {
    try {
      transition('completed', { type: 'submit' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(IllegalTransitionError);
      const e = err as IllegalTransitionError;
      expect(e.from).toBe('completed');
      expect(e.event.type).toBe('submit');
    }
  });
});

describe('isTerminal', () => {
  it('considers completed/failed/reversed terminal', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('reversed')).toBe(true);
  });

  it('considers pending/authorized/submitted non-terminal', () => {
    expect(isTerminal('pending')).toBe(false);
    expect(isTerminal('authorized')).toBe(false);
    expect(isTerminal('submitted')).toBe(false);
  });
});
