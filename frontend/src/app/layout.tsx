import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Fusion 8 — Build. Don\'t Just Learn.',
    template: '%s | Fusion 8',
  },
  description:
    'Fusion 8 is a hardtech innovation ecosystem building Africa\'s next generation of engineers, innovators, and founders. Based in Bamenda, Northwest Region, Cameroon.',
  keywords: [
    'engineering', 'hardware', 'Cameroon', 'robotics', 'IoT', 'Arduino',
    'incubator', 'accelerator', 'Africa', 'innovation', 'Bamenda',
    'hardtech', 'startup', 'product acceleration',
  ],
  authors: [{ name: 'Fusion 8' }],
  metadataBase: new URL('https://fusion8.tech'),
  openGraph: {
    title: 'Fusion 8 — Build. Don\'t Just Learn.',
    description: 'Fusion 8 is a hardtech innovation ecosystem building Africa\'s next generation of engineers, innovators, and founders.',
    url: 'https://fusion8.tech',
    siteName: 'Fusion 8',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fusion 8 — Build. Don\'t Just Learn.',
    description: 'Africa\'s hardtech innovation ecosystem. Bamenda, Cameroon.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
