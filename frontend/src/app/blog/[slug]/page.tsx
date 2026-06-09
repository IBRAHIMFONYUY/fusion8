'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Share2, Copy, Check, Calendar, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/firebase';
import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { MotionCard } from '@/components/ui/motion-card';

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { firestore } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!firestore || !params?.slug) return;
    
    let isMounted = true;
    
    const loadPost = async () => {
      try {
        const q = query(
          collection(firestore, 'blog_posts'),
          where('slug', '==', params.slug),
          where('status', '==', 'published'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty && isMounted) {
          setPost({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err: any) {
        console.error("Error loading blog post:", err);
        if (isMounted) {
          setError(err.code === 'permission-denied' 
            ? "You don't have permission to view this post. Check your Firestore Security Rules." 
            : "Failed to load the article.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadPost();
    
    return () => { isMounted = false; };
  }, [firestore, params?.slug]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post?.title, text: post?.excerpt, url: window.location.href });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading article...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <PageTransition className="flex-1 flex items-center justify-center py-24 px-4">
          <MotionCard hoverEffect={false} className="max-w-md w-full p-8 text-center border-black/[0.08] shadow-2xl bg-white/80 backdrop-blur-xl">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-black font-headline mb-3 text-foreground">Post Unavailable</h1>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {error || "The article you are looking for doesn't exist or has been removed."}
            </p>
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-accent/20">
              <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Return to Blog</Link>
            </Button>
          </MotionCard>
        </PageTransition>
        <Footer />
      </div>
    );
  }

  const publishedDate = post.publishedAt
    ? format(new Date(post.publishedAt.seconds ? post.publishedAt.seconds * 1000 : post.publishedAt), 'MMMM d, yyyy')
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-24">

        {/* Hero Header Section */}
        <div className="relative pt-24 lg:pt-32 pb-12 overflow-hidden border-b border-black/[0.06]">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <PageTransition className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            {/* Meta */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {post.category && (
                <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-0 text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1">
                  {post.category}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-headline tracking-tighter leading-[1.1] mb-8 text-foreground max-w-3xl mx-auto">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
                {post.excerpt}
              </p>
            )}

            {/* Author details */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-xs border border-accent/20">
                  {(post.authorName || 'F8')[0].toUpperCase()}
                </div>
                <span className="text-foreground">{post.authorName || 'Fusion8 Team'}</span>
              </div>
              <span className="opacity-40 hidden sm:inline">•</span>
              {publishedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 opacity-70" />
                  <span>{publishedDate}</span>
                </div>
              )}
            </div>
          </PageTransition>
        </div>

        {/* Cover Image Template */}
        {post.coverImageUrl && (
          <PageTransition className="container mx-auto px-4 max-w-5xl -mt-6 relative z-20 mb-16">
            <div className="w-full aspect-[21/9] md:aspect-[2.5/1] overflow-hidden rounded-3xl shadow-2xl border border-black/[0.08] bg-white">
              <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </PageTransition>
        )}

        {/* Article Body */}
        <PageTransition className="container mx-auto px-4 max-w-3xl">
          
          <article className="prose prose-slate prose-lg md:prose-xl dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap selection:bg-accent/20 selection:text-foreground">
            {post.content}
          </article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-[10px] uppercase tracking-widest bg-secondary text-muted-foreground border-0 font-bold px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-12 bg-white border border-black/[0.08] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-foreground mb-1">Share this article</p>
              <p className="text-xs text-muted-foreground">If you found this useful, pass it along to your network.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1 sm:flex-none gap-2 text-xs font-semibold rounded-xl h-10 border-black/[0.12] hover:bg-secondary">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
              <Button size="sm" onClick={handleShare} className="flex-1 sm:flex-none gap-2 text-xs font-bold rounded-xl h-10 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
            </div>
          </div>

        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
