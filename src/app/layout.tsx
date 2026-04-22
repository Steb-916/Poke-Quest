import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { Navigation } from '@/components/ui/Navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import { Providers } from './providers';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Vault — Pokemon Card Portfolio',
  description: 'A curated collection of 15 SWSH-era alternate art Pokemon cards, tracked and visualized.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-[var(--font-body)] antialiased"
      >
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-black focus:rounded focus:text-sm focus:font-medium"
          >
            Skip to content
          </a>
          <Navigation />
          <PageTransition>
            <main id="main-content">{children}</main>
          </PageTransition>
        </Providers>
      </body>
    </html>
  );
}
