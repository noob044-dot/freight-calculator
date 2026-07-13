import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: "FreightQuote India | Pincode-Precise Freight Calculator",
  description: "India's most accurate pincode-to-pincode freight calculator with exact NHAI tolls, competitor benchmarks, and multi-format export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-bg text-fg">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
