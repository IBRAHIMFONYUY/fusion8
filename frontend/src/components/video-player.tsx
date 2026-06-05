'use client';

import { PlayCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url?: string;
  title?: string;
  className?: string;
}

/**
 * Technical Utility: YouTube ID Extractor
 * Supports: 
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function getYouTubeId(url?: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function VideoPlayer({ url, title, className }: VideoPlayerProps) {
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-secondary/30 rounded-3xl border-2 border-dashed border-border aspect-video p-8 text-center",
        className
      )}>
        <div className="p-6 bg-background rounded-full mb-4 shadow-sm">
          <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Payload Unavailable</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          The instructor has not synchronized the video payload for this technical unit.
        </p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&disablekb=1&autoplay=0`;

  return (
    <div className={cn(
      "relative group rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video ring-1 ring-white/10",
      className
    )}>
      <iframe
        className="w-full h-full pointer-events-auto"
        src={embedUrl}
        title={title || "Technical Stream"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      
      {/* Interaction Guard: Masks branding and prevents external context leakage */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute top-4 left-6 flex items-center gap-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              Secure Internal Stream
          </span>
      </div>
    </div>
  );
}
