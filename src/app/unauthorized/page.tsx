
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <ShieldAlert className="h-20 w-20 text-destructive mb-6" />
      <h1 className="text-4xl font-bold tracking-tight mb-2 font-headline">Access Denied</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        You do not have the necessary permissions to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild>
          <Link href="/login">Switch Account</Link>
        </Button>
      </div>
    </div>
  );
}
