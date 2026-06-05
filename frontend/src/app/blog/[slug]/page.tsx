'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Share2, Copy, Check, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/firebase';
import { useEffect, useState } from 'react';

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { firestore } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!firestore || !params?.slug) return;
    (async () => {
      const q = query(
        collection(firestore, 'blog_posts'),
        where('slug', '==', params.slug),
        where('status', '==', 'published'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setPost({ id: snap.docs[0].id, ...snap.docs[0].data() });
      setLoading(false);
    })();
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
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-2xl font-black font-headline">Post Not Found</p>
          <Button asChild variant="outline">
            <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
          </Button>
        </main>
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
      <main className="flex-1 bg-secondary">

        {/* Cover */}
        {post.coverImageUrl && (
          <div className="w-full max-h-[480px] overflow-hidden">
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="container mx-auto px-4 py-12 max-w-3xl">

          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors mb-8">
            <ArrowLeft className="h-3 w-3" /> All Articles
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {post.category && (
              <Badge className="bg-accent text-white text-[10px] uppercase tracking-widest font-bold">{post.category}</Badge>
            )}
            {post.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-widest">{tag}</Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center justify-between gap-4 mb-10 pb-8 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-black text-sm">
                {(post.authorName || 'F8')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {post.authorName || 'Fusion8'}
                </p>
                {publishedDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3" /> {publishedDate}
                  </p>
                )}
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 text-xs">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button size="sm" onClick={handleShare} className="gap-2 text-xs bg-accent hover:bg-accent/90 text-white">
                <Share2 className="h-3 w-3" /> Share
              </Button>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 italic border-l-4 border-accent pl-5">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Bottom share bar */}
          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">Found this useful? Share it.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 text-xs">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button size="sm" onClick={handleShare} className="gap-2 text-xs bg-accent hover:bg-accent/90 text-white">
                <Share2 className="h-3 w-3" /> Share
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to all articles</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
