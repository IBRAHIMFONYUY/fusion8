'use client';

import { Video } from 'lucide-react';
import { useParams } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';

export default function RecordingPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="py-16">
      <EmptyState
        icon={Video}
        title="Recordings aren't available yet"
        description="Session recordings will appear here once this feature ships. Check the course's Live Sessions for upcoming classes in the meantime."
        action={{ text: 'Back to Course', href: `/student/courses/${params.id}` }}
      />
    </div>
  );
}
