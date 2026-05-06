'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { SEED_CONTACTS, SEED_TRANSFERS, type SeedContact, type SeedTransfer, type Bank } from './data';

export type Screen =
  // Onboarding
  | 'welcome'
  | 'email'
  | 'otp'
  | 'kyc-intro'
  | 'kyc-processing'
  | 'kyc-done'
  | 'bank-list'
  | 'bank-auth'
  | 'bank-success'
  // Sender main app
  | 'home'
  | 'contacts'
  | 'add-contact'
  | 'history'
  | 'settings'
  // Sender — chat keyboard flow
  | 'chat'
  | 'ios-keyboard'
  | 'kbd-switcher'
  | 'keypad'
  | 'confirm'
  | 'face-id'
  | 'sending'
  | 'sent'
  // Receiver flow (the person clicking the link)
  | 'receive-chat'
  | 'receive-link'
  | 'receive-iban'
  | 'receive-faceid'
  | 'receive-success';

export type Persona = 'sender' | 'receiver';

export interface AppDraft {
  email: string;
  fullName: string;
  selectedBank: Bank | null;
}

export interface KeyboardDraft {
  amountAed: number;
  reference: string;
}

/**
 * The "fixed" recipient for the demo. Everywhere that used to need a
 * RecipientPicker now reads from here. The recipient is *implicit* — you're
 * already in their WhatsApp chat.
 */
export interface ChatRecipient {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  phone: string;
}

export interface ReceiverDraft {
  isReturning: boolean; // false = first time, must enter IBAN; true = saved
  iban: string;
}

interface DemoState {
  // navigation
  screen: Screen;
  history: Screen[];
  goTo: (screen: Screen) => void;
  goBack: () => void;
  reset: () => void;

  // persona — controls which "phone" we're showing
  persona: Persona;
  setPersona: (p: Persona) => void;

  // onboarding
  draft: AppDraft;
  setDraft: (patch: Partial<AppDraft>) => void;

  // entities
  contacts: SeedContact[];
  addContact: (c: Omit<SeedContact, 'id'>) => void;
  transfers: SeedTransfer[];
  recordTransfer: (t: Omit<SeedTransfer, 'id'>) => void;

  // chat / keyboard flow
  recipient: ChatRecipient;
  kbd: KeyboardDraft;
  setKbd: (patch: Partial<KeyboardDraft>) => void;
  resetKbd: () => void;

  // payment-link state
  paymentLinkAmount: number | null;
  setPaymentLinkAmount: (n: number | null) => void;

  // receiver onboarding
  receiver: ReceiverDraft;
  setReceiver: (patch: Partial<ReceiverDraft>) => void;
}

const DEFAULT_RECIPIENT: ChatRecipient = {
  id: 'ahmed',
  name: 'Ahmed Al Mansouri',
  shortName: 'Ahmed',
  emoji: '🧔🏽',
  phone: '+971 50 123 4567',
};

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [history, setHistory] = useState<Screen[]>([]);
  const [persona, setPersona] = useState<Persona>('sender');
  const [draft, setDraftState] = useState<AppDraft>({ email: '', fullName: '', selectedBank: null });
  const [contacts, setContacts] = useState<SeedContact[]>(SEED_CONTACTS);
  const [transfers, setTransfers] = useState<SeedTransfer[]>(SEED_TRANSFERS);
  const [kbd, setKbdState] = useState<KeyboardDraft>({ amountAed: 0, reference: '' });
  const [paymentLinkAmount, setPaymentLinkAmount] = useState<number | null>(null);
  const [receiver, setReceiverState] = useState<ReceiverDraft>({ isReturning: false, iban: '' });

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
        setPersona('sender');
        setDraftState({ email: '', fullName: '', selectedBank: null });
        setKbdState({ amountAed: 0, reference: '' });
        setPaymentLinkAmount(null);
        setReceiverState({ isReturning: false, iban: '' });
      },
      persona,
      setPersona,
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
      recipient: DEFAULT_RECIPIENT,
      kbd,
      setKbd: (patch) => setKbdState((k) => ({ ...k, ...patch })),
      resetKbd: () => setKbdState({ amountAed: 0, reference: '' }),
      paymentLinkAmount,
      setPaymentLinkAmount,
      receiver,
      setReceiver: (patch) => setReceiverState((r) => ({ ...r, ...patch })),
    }),
    [screen, history, persona, draft, contacts, transfers, kbd, paymentLinkAmount, receiver],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
