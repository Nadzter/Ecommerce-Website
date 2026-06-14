import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amwali Pay | Chat-native payments for banks and fintechs',
  description:
    'Amwali Pay is a white-label, chat-native payment SDK for banks and fintechs. Turn every conversation into a payment moment. Live in Lebanon, the UAE and beyond.',
  alternates: { canonical: 'https://amwali.com' },
  openGraph: {
    title: 'Amwali Pay',
    description:
      'Chat-native payments SDK for banks and fintechs. Built for Lebanon, the UAE and the broader MENA region.',
    url: 'https://amwali.com',
    siteName: 'Amwali Pay',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://amwali.com/og.png',
        width: 1200,
        height: 630,
        alt: 'Amwali Pay — chat-native payments',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amwali Pay',
    description: 'Chat-native payments SDK for banks and fintechs.',
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230052FF'/%3E%3Cpath d='M19 24h26v6H19zm0 10h26v6H19z' fill='%23ffffff'/%3E%3Ccircle cx='32' cy='32' r='4' fill='%230052FF'/%3E%3C/svg%3E",
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#0052FF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  )
}
