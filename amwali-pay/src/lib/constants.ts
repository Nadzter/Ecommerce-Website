export const BRAND = {
  name: 'Amwali Pay',
  nameAr: 'أموالي pay',
  taglineEn: 'Your money. Every conversation.',
  taglineAr: 'أموالك في كل محادثة',
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
  nameAr: string
  currencies: Currency[]
  defaultCurrency: Currency
  defaultAmount: number
  accentColor: string
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
    nameAr: 'لبنان',
    currencies: ['USD', 'LBP'],
    defaultCurrency: 'USD',
    defaultAmount: 200,
    accentColor: '#E85C0D',
    rails: ['OMT Intra', 'OMT Western Union', 'BDL Circular 158'],
    platforms: ['WhatsApp', 'Instagram', 'SMS'],
    chatContact: { name: 'Nour Khalil', initials: 'NK', color: '#25D366' },
    sampleMessages: [
      { text: 'Can you send me the rent contribution?', side: 'them' },
      { text: 'Sure! How much?', side: 'me' },
      { text: '$200 or 18,000,000 LBP — whichever is easier', side: 'them' },
    ],
    settlementRail: 'OMT Intra',
    fact: '$9.9B cash economy · World Bank 2023',
  },
  ae: {
    code: 'ae',
    flag: '🇦🇪',
    name: 'UAE',
    nameAr: 'الإمارات',
    currencies: ['AED', 'USD'],
    defaultCurrency: 'AED',
    defaultAmount: 500,
    accentColor: '#009B77',
    rails: ['UAEFTS', 'eDirham', 'AECB', 'UAE SWIFT'],
    platforms: ['WhatsApp', 'Instagram', 'Telegram'],
    chatContact: { name: 'Sara Al Mansoori', initials: 'SM', color: '#128C7E' },
    sampleMessages: [
      { text: 'Can you transfer your share of the booking?', side: 'them' },
      { text: 'Of course, sending it now!', side: 'me' },
      { text: 'Shukran habibti 🙏', side: 'them' },
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
  titleAr: string
  body: string
}

export const FEATURES: Feature[] = [
  {
    icon: '💬',
    titleEn: 'Chat-native payments',
    titleAr: 'مدفوعات داخل المحادثة',
    body:
      'Payment links sent directly inside WhatsApp, Instagram, Telegram, or iMessage. No app switching. Money moves inside the conversation.',
  },
  {
    icon: '🏷️',
    titleEn: 'Fully white-label',
    titleAr: 'علامتك التجارية كاملاً',
    body:
      'Your brand, your colors, your trust signals. The Amwali SDK adapts to your institution. Available for iOS, Android and React Native.',
  },
  {
    icon: '👆',
    titleEn: 'One-tap after first use',
    titleAr: 'نقرة واحدة بعد أول مرة',
    body:
      'Recipients enter details once. Every subsequent payment is a single tap. Fewer errors, fewer support calls, faster settlement.',
  },
  {
    icon: '📲',
    titleEn: 'NFC & QR in-person',
    titleAr: 'NFC وQR للدفع الحضوري',
    body:
      'Generate payment links via NFC tap or QR code. No account numbers exchanged. Perfect for splitting bills or vendor payments on the spot.',
  },
  {
    icon: '🔐',
    titleEn: 'Your security, your compliance',
    titleAr: 'أمانك وامتثالك',
    body:
      'Amwali runs inside your infrastructure. KYC, AML, and transaction monitoring stay entirely in your hands. Every link is tokenized and time-limited.',
  },
  {
    icon: '⚡',
    titleEn: 'Local rails, instant settlement',
    titleAr: 'تسوية فورية عبر القنوات المحلية',
    body:
      'Settles via the fastest available local rail — OMT Intra, UAEFTS, SEPA Instant, Pix, UPI and more. No fund custody, no new compliance burden.',
  },
]

export interface HowStep {
  n: string
  titleEn: string
  titleAr: string
  body: string
}

export const HOW_STEPS: HowStep[] = [
  {
    n: '01',
    titleEn: 'Open any chat',
    titleAr: 'افتح أي محادثة',
    body: 'User is in WhatsApp, Instagram or any messaging app with someone they need to pay',
  },
  {
    n: '02',
    titleEn: 'Tap Amwali',
    titleAr: 'اضغط أموالي',
    body: 'Amwali keyboard opens inside the chat — fully branded to your institution — zero app switching',
  },
  {
    n: '03',
    titleEn: 'Send link',
    titleAr: 'أرسل الرابط',
    body: 'A secure, tokenized, time-limited payment link is generated and shared in the conversation',
  },
  {
    n: '04',
    titleEn: 'Instant settlement',
    titleAr: 'تسوية فورية',
    body: 'Recipient claims in one tap. Money settles on your local rails in under 60 seconds',
  },
]
