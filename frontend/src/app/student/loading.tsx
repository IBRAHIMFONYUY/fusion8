import { Loader2 } from 'lucide-react';

export default function StudentLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
          Loading student portal...
        </p>
      </div>
    </div>
  );
}
