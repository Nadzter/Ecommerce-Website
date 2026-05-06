export interface Bank {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  brandColor: string;
}

export const UAE_BANKS: Bank[] = [
  { id: 'enbd', name: 'Emirates NBD', shortName: 'ENBD', initials: 'EN', brandColor: '#A6192E' },
  { id: 'adcb', name: 'Abu Dhabi Commercial Bank', shortName: 'ADCB', initials: 'AC', brandColor: '#003E51' },
  { id: 'fab', name: 'First Abu Dhabi Bank', shortName: 'FAB', initials: 'FA', brandColor: '#0A2540' },
  { id: 'mashreq', name: 'Mashreq', shortName: 'Mashreq', initials: 'MQ', brandColor: '#FF6B00' },
  { id: 'cbd', name: 'Commercial Bank of Dubai', shortName: 'CBD', initials: 'CB', brandColor: '#0033A0' },
  { id: 'rakbank', name: 'RAKBANK', shortName: 'RAKBANK', initials: 'RB', brandColor: '#E30613' },
];

export interface SeedContact {
  id: string;
  name: string;
  phone: string;
  iban: string;
  emoji: string;
  isFavorite?: boolean;
}

export const SEED_CONTACTS: SeedContact[] = [
  {
    id: 'c1',
    name: 'Ahmed Al Mansouri',
    phone: '+971 50 123 4567',
    iban: 'AE07 0331 2345 6789 0123 456',
    emoji: '🧔🏽',
    isFavorite: true,
  },
  {
    id: 'c2',
    name: 'Layla Khalid',
    phone: '+971 55 987 6543',
    iban: 'AE21 0260 0010 1234 5678 901',
    emoji: '👩🏻',
    isFavorite: true,
  },
  {
    id: 'c3',
    name: 'Faisal Hassan',
    phone: '+971 52 444 7788',
    iban: 'AE45 0033 0099 8877 6655 443',
    emoji: '🧑🏽',
  },
  {
    id: 'c4',
    name: 'Mariam Saeed',
    phone: '+971 56 222 1100',
    iban: 'AE63 0400 0001 1223 3445 567',
    emoji: '👩🏽‍🦱',
  },
];

export interface SeedTransfer {
  id: string;
  contactId: string;
  amountAed: number;
  reference: string;
  state: 'completed' | 'failed' | 'pending';
  initiatedAt: Date;
}

export const SEED_TRANSFERS: SeedTransfer[] = [
  {
    id: 't1',
    contactId: 'c1',
    amountAed: 200,
    reference: 'Coffee meet-up',
    state: 'completed',
    initiatedAt: hoursAgo(3),
  },
  {
    id: 't2',
    contactId: 'c2',
    amountAed: 1500,
    reference: 'July rent share',
    state: 'completed',
    initiatedAt: daysAgo(2),
  },
  {
    id: 't3',
    contactId: 'c3',
    amountAed: 75,
    reference: 'Lunch',
    state: 'completed',
    initiatedAt: daysAgo(5),
  },
];

export const FAKE_OTP = '482913';

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

export function maskIban(iban: string): string {
  const cleaned = iban.replace(/\s+/g, '');
  if (cleaned.length < 8) return iban;
  return `${cleaned.slice(0, 4)} •••• •••• •••• •••• ${cleaned.slice(-4)}`;
}

export function formatAed(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}
