import Link from 'next/link';
import { Mail, MapPin, MessageCircle } from 'lucide-react';

const ecosystemLinks = [
  { href: '/academy',     label: 'Fusion 8 Academy' },
  { href: '/incubator',   label: 'Innovation Incubator' },
  { href: '/accelerator', label: 'Product Accelerator' },
  { href: '/labs',        label: 'Engineering Labs' },
];

const communityLinks = [
  { href: '/apply',     label: 'Apply for Cohort 01' },
  { href: '/community', label: 'Join the Community' },
  { href: '/about',     label: 'Our Story' },
  { href: '/blog',      label: 'Blog' },
];

const platformLinks = [
  { href: '/courses',   label: 'Course Catalog' },
  { href: '/projects',  label: 'Innovation Hub' },
  { href: '/become-instructor', label: 'Become a Trainer' },
  { href: '/subscribe', label: 'Digital Campus' },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-black/[0.06]">
      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand — 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center font-black text-sm text-white shrink-0">
                F8
              </div>
              <span className="text-sm font-black tracking-[0.14em] uppercase">
                <span className="text-foreground">FUSI</span><span className="text-accent">ON</span><span className="text-foreground"> 8</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Africa&apos;s hardtech innovation ecosystem. Building the talent, systems,
              and infrastructure required to turn African ideas into globally
              competitive products.
            </p>

            <p className="text-xs font-black tracking-[0.2em] uppercase text-accent">
              Build. Don&apos;t Just Learn.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              <a
                href="mailto:fusion8.cohort01@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-accent shrink-0" />
                fusion8.cohort01@gmail.com
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                Bamenda, Northwest Region, Cameroon
              </div>
              <a
                href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                Join WhatsApp Community
              </a>
            </div>
          </div>

          {/* Ecosystem */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              Ecosystem
            </h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              Community
            </h4>
            <ul className="space-y-2.5">
              {communityLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-black/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Fusion 8 Innovation Ecosystem · Cohort 01 · 2026
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp button */}
      <a
        href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-2xl shadow-black/20 transition-all hover:scale-110 hover:shadow-[#25D366]/30"
        aria-label="Join WhatsApp community"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </footer>
  );
}
