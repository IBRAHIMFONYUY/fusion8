'use client';

import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'teacher' | 'admin')[];
}

/**
 * Client-side role gate for portal layouts.
 *
 * States:
 * 1. Loading — Firebase auth state not yet resolved. Shows branded spinner so
 *    there is never a white flash or content reveal before auth completes.
 * 2. Unauthenticated — redirects to /login with a `redirect` param so the user
 *    lands back on the intended page after signing in.
 * 3. Wrong role — redirects to /unauthorized.
 * 4. Authorised — renders children.
 *
 * This guard is defence-in-depth. The primary gate is the middleware cookie check
 * which blocks unauthenticated requests from ever receiving protected HTML.
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace('/unauthorized');
    }
  }, [user, role, isLoading, allowedRoles, router]);

  // Loading state — always show something, never a blank screen
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — render a placeholder while the redirect fires
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground font-medium">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Wrong role — show a brief visual before redirect
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <ShieldOff className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground font-medium">
            Access restricted. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
