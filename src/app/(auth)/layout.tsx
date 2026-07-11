import { Source_Sans_3 } from 'next/font/google';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-source-sans',
  display: 'swap',
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sourceSans.variable} min-h-screen`} style={{ fontFamily: 'var(--font-source-sans)' }}>
      {children}
    </div>
  );
}
