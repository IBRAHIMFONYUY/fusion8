'use client';

import { Video } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';

export default function LiveSessionPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <EmptyState
        icon={Video}
        title="In-app video isn't available yet"
        description="Live sessions currently run through Google Meet. Schedule a class with a Meet link from the Broadcast Scheduler, and students will join from their Live Sessions page."
        action={{ text: 'Go to Schedule', href: '/teacher/schedule' }}
      />
    </div>
  );
}
