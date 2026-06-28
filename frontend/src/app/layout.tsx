import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import './globals.css';

// Self-hosted via next/font — no CDN round-trip, no GDPR data transfer to Google,
// no render-blocking <link>. Fonts are inlined as data URIs in the CSS.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E8461E',
};

export const metadata: Metadata = {
  title: {
    default: "Fusion8 — Build. Don't Just Learn.",
    template: '%s | Fusion8',
  },
  description:
    "Fusion8 is a hardtech innovation ecosystem building Africa's next generation of engineers, innovators, and founders. Based in Bamenda, Northwest Region, Cameroon.",
  keywords: [
    'engineering',
    'hardware',
    'Cameroon',
    'robotics',
    'IoT',
    'Arduino',
    'incubator',
    'accelerator',
    'Africa',
    'innovation',
    'Bamenda',
    'hardtech',
    'startup',
    'product acceleration',
    'mechatronics',
    'AI',
    'electronics',
  ],
  authors: [{ name: 'Fusion8' }],
  metadataBase: new URL('https://fusion8.tech'),
  openGraph: {
    title: "Fusion8 — Build. Don't Just Learn.",
    description:
      "Fusion8 is a hardtech innovation ecosystem building Africa's next generation of engineers, innovators, and founders.",
    url: 'https://fusion8.tech',
    siteName: 'Fusion8',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Fusion8 — Africa\'s Hardtech Innovation Ecosystem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Fusion8 — Build. Don't Just Learn.",
    description: "Africa's hardtech innovation ecosystem. Bamenda, Cameroon.",
    images: ['/og-default.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-body">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
