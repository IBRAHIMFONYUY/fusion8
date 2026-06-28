'use client';

import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'teacher' | 'admin')[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  // Track whether we've confirmed a live user in this session.
  // If so, a transient null (token refresh, strict-mode remount) won't
  // immediately redirect — we let Firebase settle first.
  const wasAuthenticated = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable string avoids re-running the effect every render (allowedRoles is a
  // new array literal on each parent render).
  const rolesKey = allowedRoles.join(',');

  useEffect(() => {
    if (user) wasAuthenticated.current = true;

    // Clear any pending redirect timer when auth state changes.
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }

    if (isLoading) return;

    if (!user) {
      if (wasAuthenticated.current) {
        // Had a user before — wait 600 ms before redirecting so Firebase has
        // time to restore from IndexedDB / complete a token refresh.
        redirectTimer.current = setTimeout(() => {
          const currentPath = window.location.pathname + window.location.search;
          router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }, 600);
      } else {
        // Never authenticated in this tab — redirect immediately.
        const currentPath = window.location.pathname + window.location.search;
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace('/unauthorized');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, isLoading, rolesKey, router]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

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
