
'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

export default function RecordingPage() {
  const params = useParams<{ id: string; recordingId: string }>();

  // Use dummy data since legacy mock data was purged
  const course = { 
      id: params.id, 
      title: 'Course Recording', 
      recordings: [{ id: params.recordingId, title: 'Session Recording', date: new Date().toLocaleDateString() }] 
  };
  const recording = course.recordings[0];

  if (!course || !recording) {
    notFound();
  }

  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'lesson-video-placeholder');

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-accent font-semibold">{course.title}</p>
        <h1 className="text-4xl font-bold tracking-tight">{recording.title}</h1>
        <p className="text-muted-foreground mt-1">Recorded on {recording.date}</p>
      </div>
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted flex items-center justify-center">
            {videoPlaceholder && 
                <Image 
                    src={videoPlaceholder.imageUrl} 
                    alt="Lesson video" 
                    width={1280} 
                    height={720} 
                    className="w-full h-full object-cover"
                    data-ai-hint={videoPlaceholder.imageHint}
                />
            }
        </div>
      </Card>
      <Card className="mt-6">
        <CardContent className="pt-6">
            <h3 className="font-semibold text-lg">Session Notes</h3>
            <p className="text-muted-foreground mt-2">
                This was a recorded live session. Any materials or chat logs would typically be available here for review.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
