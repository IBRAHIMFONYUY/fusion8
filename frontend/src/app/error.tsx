'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {error?.message?.includes('permission')
          ? "You don't have permission to access this resource. Please sign in or contact support."
          : "An unexpected error occurred. Please try again or go back."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} className="bg-accent hover:bg-accent/90">
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
