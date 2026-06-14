export const BRAND = {
  name: 'Amwali Pay',
  taglineEn: 'Your money. Every conversation.',
  shortName: 'Amwali',
  domain: 'amwali.com',
  year: 2026,
} as const

export const RATES = {
  LBP_PER_USD: 89500,
  AED_PER_USD: 3.67,
} as const

export type Currency = 'USD' | 'LBP' | 'AED'
export type MarketCode = 'lb' | 'ae'
export type MessageSide = 'me' | 'them'

export interface FeeTier {
  minUSD: number
  maxUSD: number
  feeUSD: number | null
  label: string
  note: string
}

export const FEE_TIERS: FeeTier[] = [
  { minUSD: 0,   maxUSD: 20,       feeUSD: null, label: 'Under $20',   note: 'Not supported' },
  { minUSD: 20,  maxUSD: 100,      feeUSD: 0.25, label: '$20 – $100',  note: '= 0.25–1.25%' },
  { minUSD: 100, maxUSD: 500,      feeUSD: 0.50, label: '$100 – $500', note: '= 0.1–0.5%'   },
  { minUSD: 500, maxUSD: Infinity, feeUSD: 1.00, label: '$500+',       note: '= <0.2%'      },
]

export interface ChatContact {
  name: string
  initials: string
  color: string
}

export interface SampleMessage {
  text: string
  side: MessageSide
}

export interface Market {
  code: MarketCode
  flag: string
  name: string
  currencies: Currency[]
  defaultCurrency: Currency
  defaultAmount: number
  rails: string[]
  platforms: string[]
  chatContact: ChatContact
  sampleMessages: SampleMessage[]
  settlementRail: string
  fact: string
}

export const MARKETS: Record<MarketCode, Market> = {
  lb: {
    code: 'lb',
    flag: '🇱🇧',
    name: 'Lebanon',
    currencies: ['USD', 'LBP'],
    defaultCurrency: 'USD',
    defaultAmount: 200,
    rails: ['BDL Instant', 'BDL Circular 158', 'Local card networks'],
    platforms: ['WhatsApp', 'Instagram', 'SMS'],
    chatContact: { name: 'Nour Khalil', initials: 'NK', color: '#0052FF' },
    sampleMessages: [
      { text: 'Can you send me the rent contribution?', side: 'them' },
      { text: 'Sure! How much?', side: 'me' },
      { text: '$200 or 18,000,000 LBP — whichever is easier', side: 'them' },
    ],
    settlementRail: 'BDL Instant',
    fact: '$9.9B cash economy · World Bank 2023',
  },
  ae: {
    code: 'ae',
    flag: '🇦🇪',
    name: 'UAE',
    currencies: ['AED', 'USD'],
    defaultCurrency: 'AED',
    defaultAmount: 500,
    rails: ['UAEFTS', 'eDirham', 'AECB', 'UAE SWIFT'],
    platforms: ['WhatsApp', 'Instagram', 'Telegram'],
    chatContact: { name: 'Sara Al Mansoori', initials: 'SM', color: '#0A2540' },
    sampleMessages: [
      { text: 'Can you transfer your share of the booking?', side: 'them' },
      { text: 'Of course, sending it now!', side: 'me' },
      { text: 'Thanks — really appreciate it!', side: 'them' },
    ],
    settlementRail: 'UAEFTS',
    fact: '$500B+ payments market · 2024',
  },
}

export interface GlobalRail {
  label: string
  region: string
}

export const GLOBAL_RAILS: GlobalRail[] = [
  { label: 'SEPA Instant',    region: 'Europe' },
  { label: 'Pix',             region: 'Brazil' },
  { label: 'Faster Payments', region: 'UK' },
  { label: 'UPI',             region: 'India' },
  { label: 'Bizum',           region: 'Spain' },
  { label: 'Blik',            region: 'Poland' },
  { label: 'SPEI',            region: 'Mexico' },
]

export interface Feature {
  icon: string
  titleEn: string
  body: string
}

export const FEATURES: Feature[] = [
  {
    icon: '💬',
    titleEn: 'Chat-native payments',
    body:
      'Payment links sent directly inside WhatsApp, Instagram, Telegram, or iMessage. No app switching. Money moves inside the conversation.',
  },
  {
    icon: '🏷️',
    titleEn: 'Fully white-label',
    body:
      'Your brand, your colors, your trust signals. The Amwali SDK adapts to your institution. Available for iOS, Android and React Native.',
  },
  {
    icon: '👆',
    titleEn: 'One-tap after first use',
    body:
      'Recipients enter details once. Every subsequent payment is a single tap. Fewer errors, fewer support calls, faster settlement.',
  },
  {
    icon: '📲',
    titleEn: 'NFC & QR in-person',
    body:
      'Generate payment links via NFC tap or QR code. No account numbers exchanged. Perfect for splitting bills or vendor payments on the spot.',
  },
  {
    icon: '🔐',
    titleEn: 'Your security, your compliance',
    body:
      'Amwali runs inside your infrastructure. KYC, AML, and transaction monitoring stay entirely in your hands. Every link is tokenized, time-limited, and confirmed with Face ID.',
  },
  {
    icon: '⚡',
    titleEn: 'Local rails, instant settlement',
    body:
      'Settles via the fastest available local rail — SEPA Instant, Pix, UAEFTS, UPI and more. No fund custody, no new compliance burden.',
  },
]

export interface HowStep {
  n: string
  titleEn: string
  body: string
}

export const HOW_STEPS: HowStep[] = [
  {
    n: '01',
    titleEn: 'Open any chat',
    body: 'Customer is in WhatsApp, Instagram or any messaging app with someone they need to pay.',
  },
  {
    n: '02',
    titleEn: 'Switch keyboard',
    body: 'A single tap on the globe icon brings up the Amwali Pay keyboard — fully branded to your institution.',
  },
  {
    n: '03',
    titleEn: 'Confirm with Face ID',
    body: 'Enter the amount on a secure numerical keypad. Face ID confirms the customer in under a second.',
  },
  {
    n: '04',
    titleEn: 'Instant settlement',
    body: 'A tokenized payment link is shared in the chat. Recipient claims in one tap. Settles on your local rails in under 60 seconds.',
  },
]
