import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amwali — Send money from any chat',
  description:
    'Amwali is an iOS keyboard that lets you send bank-to-bank transfers from inside any chat app. UAE preview.',
  openGraph: {
    title: 'Amwali — Send money from any chat',
    description:
      'A clickable preview of Amwali, the iOS keyboard for bank-to-bank transfers.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
