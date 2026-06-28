'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { createSession } from '@/lib/auth-actions';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  // When Firebase restores auth from IndexedDB the __session cookie may have
  // expired. Re-issue it before navigating so middleware never loops back here.
  useEffect(() => {
    if (isLoading || !user || !role) return;

    const returnTo = new URLSearchParams(window.location.search).get('redirect');

    user.getIdToken().then(async (idToken) => {
      const result = await createSession(idToken);
      if (result.success) {
        router.push(returnTo || `/${role}/dashboard`);
      }
      // If createSession fails the user stays on the login page — no loop.
    });
  }, [user, role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Validating session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center bg-secondary py-12 px-4">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12 bg-background rounded-lg shadow-2xl w-full max-w-md">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="text-muted-foreground">Initializing secure portal...</p>
          </div>
        }>
          <AuthForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
