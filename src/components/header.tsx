'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2, Menu } from 'lucide-react';
import { useAuth } from '@/firebase';
import { UserNav } from '@/components/user-nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export function Header() {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left font-headline mt-4">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold hover:text-accent transition-colors">
                  Course Catalog
                </Link>
                <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold hover:text-accent transition-colors">
                  Innovation Hub
                </Link>
                <Link href="/become-instructor" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold hover:text-accent transition-colors">
                  Partner Program
                </Link>
                {!user && (
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full justify-start bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">Join Now</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
