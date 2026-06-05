'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/firebase';
import { UserNav } from '@/components/user-nav';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const navLinks = [
  {
    label: 'Programs',
    href: '/academy',
    children: [
      { href: '/academy', label: 'Fusion 8 Academy' },
      { href: '/incubator', label: 'Innovation Incubator' },
      { href: '/accelerator', label: 'Product Accelerator' },
    ],
  },
  { label: 'Academy',     href: '/academy' },
  { label: 'Accelerator', href: '/accelerator' },
  { label: 'Labs',        href: '/labs' },
  { label: 'Community',   href: '/community' },
];

export function Header() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#0A0E10]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-sm text-white tracking-tight shrink-0">
              F8
            </div>
            <span className="text-sm font-black tracking-[0.12em] uppercase text-foreground group-hover:text-white transition-colors">
              <span className="text-foreground">FUSI</span><span className="text-accent">ON</span><span className="text-foreground"> 8</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) =>
              item.children ? (
                <div key={item.label} className="relative group">
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-cream-55 hover:text-foreground transition-colors rounded-md"
                    onMouseEnter={() => setProgramsOpen(true)}
                    onMouseLeave={() => setProgramsOpen(false)}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-all group-hover:rotate-180" />
                  </button>
                  {programsOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-52 bg-card border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
                      onMouseEnter={() => setProgramsOpen(true)}
                      onMouseLeave={() => setProgramsOpen(false)}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-3 text-sm text-cream-80 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors rounded-md',
                    pathname === item.href
                      ? 'text-accent'
                      : 'text-cream-55 hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Right: auth + CTA */}
          <div className="flex items-center gap-2.5">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : user ? (
              <UserNav />
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:inline-flex text-sm font-medium text-cream-55 hover:text-foreground hover:bg-white/5 h-9 px-4"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-accent hover:bg-orange-600 text-white font-bold h-9 px-5 rounded-lg text-sm shadow-lg shadow-accent/20 transition-all hover:shadow-accent/40 hover:scale-[1.02]"
                >
                  <Link href="/apply">Apply Now →</Link>
                </Button>
              </>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#0A0E10] flex flex-col pt-16">
          <nav className="flex-1 flex flex-col px-6 py-8 gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.children ? item.children[0].href : item.href}
                className={cn(
                  'px-4 py-3.5 rounded-xl text-base font-semibold transition-colors',
                  pathname === item.href
                    ? 'bg-accent/10 text-accent'
                    : 'text-cream-80 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-3">
              {!user && (
                <>
                  <Button asChild variant="outline" className="w-full h-11 border-white/20 text-foreground hover:bg-white/5">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full h-11 bg-accent hover:bg-orange-600 text-white font-bold shadow-lg shadow-accent/20">
                    <Link href="/apply">Apply for Cohort 01 →</Link>
                  </Button>
                </>
              )}
              {user && <UserNav />}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
