import type { Metadata } from 'next';
import { Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sourceSans = Source_Sans_3({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

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
      className={`${sourceSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
