import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitStudio",
    template: "%s — FitStudio",
  },
  description:
    "FitStudio is a multi-tenant booking platform for boutique fitness studios across Spain, the UAE and Lebanon.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
