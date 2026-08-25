import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import './extended.css';
import './admin.css';
import './admin-modern.css';
import './storefront-modern.css';
import './config-studio.css';
import './json-free-ui.css';
import './responsive.css';
import { CartProvider } from '@/components/cart-provider';
import { ThemeStyle } from '@/components/theme-style';
import { getSiteUrl, getSiteUrlObject } from '@/lib/site-url';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const siteUrlObject = getSiteUrlObject();
const siteUrlString = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrlObject,
  title: { default: 'GiftsByRashii — Gifts that feel made for them', template: '%s | GiftsByRashii' },
  description: 'Thoughtful gifts, personalised hampers and joyful surprises for every person and occasion.',
  openGraph: { title: 'GiftsByRashii — Gifts that feel made for them', description: 'Thoughtful gifts, personalised hampers and joyful surprises for every person and occasion.', images: ['/og.png'], type: 'website' },
  twitter: { card: 'summary_large_image', title: 'GiftsByRashii', description: 'Thoughtful gifts for every person and occasion.', images: ['/og.png'] },
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${display.variable} antialiased`}
      >
        <ThemeStyle />
        <CartProvider>{children}</CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'GiftsByRashii',url:siteUrlString,logo:`${siteUrlString}/favicon.svg`}).replace(/</g,'\\u003c')}} />
      </body>
    </html>
  );
}
