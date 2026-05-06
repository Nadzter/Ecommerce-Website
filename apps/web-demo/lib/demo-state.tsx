'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { SEED_CONTACTS, SEED_TRANSFERS, type SeedContact, type SeedTransfer, type Bank } from './data';

export type Screen =
  | 'welcome'
  | 'email'
  | 'otp'
  | 'kyc-intro'
  | 'kyc-processing'
  | 'kyc-done'
  | 'bank-list'
  | 'bank-auth'
  | 'bank-success'
  | 'home'
  | 'contacts'
  | 'add-contact'
  | 'history'
  | 'settings'
  | 'chat'
  | 'keypad'
  | 'recipient-picker'
  | 'confirm'
  | 'face-id'
  | 'sending'
  | 'sent';

export interface AppDraft {
  email: string;
  fullName: string;
  selectedBank: Bank | null;
}

export interface KeyboardDraft {
  amountAed: number;
  recipientId: string | null;
  reference: string;
}

interface DemoState {
  // navigation
  screen: Screen;
  history: Screen[];
  goTo: (screen: Screen) => void;
  goBack: () => void;
  reset: () => void;

  // onboarding
  draft: AppDraft;
  setDraft: (patch: Partial<AppDraft>) => void;

  // entities
  contacts: SeedContact[];
  addContact: (c: Omit<SeedContact, 'id'>) => void;
  transfers: SeedTransfer[];
  recordTransfer: (t: Omit<SeedTransfer, 'id'>) => void;

  // keyboard flow
  kbd: KeyboardDraft;
  setKbd: (patch: Partial<KeyboardDraft>) => void;
  resetKbd: () => void;

  // chat sim
  lastSentMessage: string | null;
  setLastSentMessage: (s: string | null) => void;
}

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [history, setHistory] = useState<Screen[]>([]);
  const [draft, setDraftState] = useState<AppDraft>({ email: '', fullName: '', selectedBank: null });
  const [contacts, setContacts] = useState<SeedContact[]>(SEED_CONTACTS);
  const [transfers, setTransfers] = useState<SeedTransfer[]>(SEED_TRANSFERS);
  const [kbd, setKbdState] = useState<KeyboardDraft>({ amountAed: 0, recipientId: null, reference: '' });
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null);

  const value = useMemo<DemoState>(
    () => ({
      screen,
      history,
      goTo: (s) => {
        setHistory((h) => [...h, screen]);
        setScreen(s);
      },
      goBack: () => {
        setHistory((h) => {
          if (h.length === 0) return h;
          const next = h[h.length - 1]!;
          setScreen(next);
          return h.slice(0, -1);
        });
      },
      reset: () => {
        setScreen('welcome');
        setHistory([]);
        setDraftState({ email: '', fullName: '', selectedBank: null });
        setKbdState({ amountAed: 0, recipientId: null, reference: '' });
        setLastSentMessage(null);
      },
      draft,
      setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })),
      contacts,
      addContact: (c) =>
        setContacts((cs) => [...cs, { ...c, id: `c${cs.length + 1}_${Date.now()}` }]),
      transfers,
      recordTransfer: (t) =>
        setTransfers((ts) => [
          { ...t, id: `t${ts.length + 1}_${Date.now()}` },
          ...ts,
        ]),
      kbd,
      setKbd: (patch) => setKbdState((k) => ({ ...k, ...patch })),
      resetKbd: () => setKbdState({ amountAed: 0, recipientId: null, reference: '' }),
      lastSentMessage,
      setLastSentMessage,
    }),
    [screen, history, draft, contacts, transfers, kbd, lastSentMessage],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
