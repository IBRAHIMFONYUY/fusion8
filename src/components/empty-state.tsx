
'use client';

import { Button } from '@/components/ui/button';
import { Rocket, BookOpen, Users, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    text: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center text-muted-foreground py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm">{description}</p>
      {action && (
        <Button asChild className="mt-4">
          <Link href={action.href}>{action.text}</Link>
        </Button>
      )}
    </div>
  );
}
