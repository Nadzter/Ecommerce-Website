import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amwali Pay — أموالي pay | Chat-native payments for MENA',
  description:
    'Amwali Pay is a chat-native payment SDK for banks and fintechs in Lebanon and the UAE. Turn every conversation into a payment moment. أموالك في كل محادثة.',
  alternates: { canonical: 'https://amwali.com' },
  openGraph: {
    title: 'Amwali Pay — أموالي pay',
    description:
      'Chat-native payments SDK for MENA. Built for banks and fintechs in Lebanon, the UAE and beyond.',
    url: 'https://amwali.com',
    siteName: 'Amwali Pay',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://amwali.com/og.png',
        width: 1200,
        height: 630,
        alt: 'Amwali Pay — Chat-native payments for MENA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amwali Pay — أموالي pay',
    description: 'Chat-native payments SDK for banks and fintechs in MENA.',
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230A1628'/%3E%3Cpath d='M32 12 L37 27 L52 27 L40 36 L45 51 L32 42 L19 51 L24 36 L12 27 L27 27 Z' fill='%23C9992B'/%3E%3C/svg%3E",
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#0A1628',
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
      <body className="min-h-full flex flex-col bg-off-white text-navy">
        {children}
      </body>
    </html>
  )
}
