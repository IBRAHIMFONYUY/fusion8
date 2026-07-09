import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Rocket } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { SidebarNav } from './sidebar-nav';
import { getNavItemsByRole } from '@/lib/nav';
import type { UserRole } from '@/lib/auth';


interface DashboardHeaderProps {
  role: UserRole;
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
    const navItems = getNavItemsByRole(role);
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-40 transition-all">
        {/* Mobile: hamburger + brand */}
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <SidebarNav items={navItems} isMobile={true}/>
            </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-black text-base md:hidden">
            <Rocket className="h-5 w-5 text-accent" />
            <span className="tracking-tighter text-foreground">Fusion8</span>
        </Link>

        {/* Desktop: brand in nav */}
        <nav className="hidden md:flex flex-row items-center gap-5">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <Rocket className="h-6 w-6 text-accent" />
                <span className="sr-only">Fusion8</span>
            </Link>
        </nav>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial" />
            <UserNav />
        </div>
    </header>
  );
}
