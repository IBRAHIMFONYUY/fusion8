import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

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
      className=""
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
