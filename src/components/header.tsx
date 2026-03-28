'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { UserNav } from '@/components/user-nav';

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="bg-background/80 backdrop-blur-md sticky top-0 z-40 w-full border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Rocket className="h-7 w-7 text-accent" />
          <span className="font-headline tracking-tighter">FUSION8</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <Link href="/courses" className="text-foreground/70 transition-colors hover:text-foreground">
            Course Catalog
          </Link>
          <Link href="/projects" className="text-foreground/70 transition-colors hover:text-foreground">
            Innovation Hub
          </Link>
          <Link href="/become-instructor" className="text-foreground/70 transition-colors hover:text-foreground">
            Partner Program
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex font-bold">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 shadow-lg shadow-accent/20">
                <Link href="/login">Join Now</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
