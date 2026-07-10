'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url?: string;
  title?: string;
  className?: string;
}

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

function getGoogleDriveId(url?: string): string | null {
  if (!url) return null;
  // Handles: /file/d/FILE_ID/view, /file/d/FILE_ID/preview
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  // Handles: ?id=FILE_ID or &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

function isDirectVideoUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function VideoPlayer({ url, title, className }: VideoPlayerProps) {
  const youtubeId = getYouTubeId(url);
  const driveId = !youtubeId ? getGoogleDriveId(url) : null;
  const isDirect = !youtubeId && !driveId ? isDirectVideoUrl(url) : false;

  const wrapperClass = cn(
    'relative group rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video ring-1 ring-white/10',
    className
  );

  const overlay = (
    <>
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute top-4 left-6 flex items-center gap-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          Secure Internal Stream
        </span>
      </div>
    </>
  );

  if (youtubeId) {
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&disablekb=1&autoplay=0`;
    return (
      <div className={wrapperClass}>
        <iframe
          className="w-full h-full pointer-events-auto"
          src={embedUrl}
          title={title || 'Technical Stream'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {overlay}
      </div>
    );
  }

  if (driveId) {
    const embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    return (
      <div className={wrapperClass}>
        <iframe
          className="w-full h-full pointer-events-auto"
          src={embedUrl}
          title={title || 'Technical Stream'}
          frameBorder="0"
          allow="autoplay"
          allowFullScreen
        />
        {overlay}
      </div>
    );
  }

  if (isDirect && url) {
    return (
      <div className={wrapperClass}>
        <video
          className="w-full h-full"
          src={url}
          title={title || 'Technical Stream'}
          controls
          controlsList="nodownload"
        />
        {overlay}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-secondary/30 rounded-3xl border-2 border-dashed border-border aspect-video p-8 text-center',
        className
      )}
    >
      <div className="p-6 bg-background rounded-full mb-4 shadow-sm">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-bold tracking-tight">Video Not Available</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Paste a YouTube or Google Drive share link to stream this lesson.
      </p>
    </div>
  );
}
