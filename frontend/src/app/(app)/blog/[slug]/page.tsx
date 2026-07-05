'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlogContentRenderer } from '@/components/blog-content-renderer';
import {
  Loader2, ArrowLeft, Share2, Copy, Check, Calendar, Clock, User,
  AlertCircle, Heart, Bookmark, MessageCircle, Send,
  Facebook, Linkedin,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  collection, query, where, limit, getDocs, orderBy,
} from 'firebase/firestore';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect, useState, useCallback } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { MotionCard } from '@/components/ui/motion-card';
import {
  incrementViews, toggleLike, toggleBookmark, incrementShares,
  checkUserLiked, checkUserBookmarked, addComment,
  calculateReadingTime, getShareUrl,
} from '@/services/blog-service';
import { useToast } from '@/hooks/use-toast';

function SocialButton({ platform, url, title, icon, label, color }: {
  platform: string; url: string; title: string; icon: React.ReactNode; label: string; color: string;
}) {
  const handleClick = () => {
    window.open(getShareUrl(platform, url, title), '_blank', 'noopener,noreferrer,width=600,height=400');
  };
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 ${color}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { firestore, user } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

  // Load post
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
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setPost(data);
          setLikeCount((data as any).likes || 0);
          incrementViews(firestore, snap.docs[0].id);
        }
      } catch (err: any) {
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

  // Check user engagement state
  useEffect(() => {
    if (!firestore || !user || !post?.id) return;
    checkUserLiked(firestore, post.id, user.uid).then(setLiked);
    checkUserBookmarked(firestore, post.id, user.uid).then(setBookmarked);
  }, [firestore, user, post?.id]);

  // Load related posts
  useEffect(() => {
    if (!firestore || !post?.category || !post?.id) return;
    let isMounted = true;

    const loadRelated = async () => {
      try {
        const q = query(
          collection(firestore, 'blog_posts'),
          where('status', '==', 'published'),
          where('category', '==', post.category),
          orderBy('publishedAt', 'desc'),
          limit(4)
        );
        const snap = await getDocs(q);
        if (isMounted) {
          setRelatedPosts(
            snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter((p: any) => p.id !== post.id)
              .slice(0, 3)
          );
        }
      } catch {
        // Related posts are non-critical
      }
    };

    loadRelated();
    return () => { isMounted = false; };
  }, [firestore, post?.category, post?.id]);

  // Comments query
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !post?.id) return null;
    return query(
      collection(firestore, 'blog_comments'),
      where('postId', '==', post.id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, post?.id]);

  const { data: comments } = useCollection(commentsQuery);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleLike = async () => {
    if (!firestore || !user || !post?.id) {
      toast({ variant: 'destructive', title: 'Sign in required', description: 'Please sign in to like articles.' });
      return;
    }
    const nowLiked = await toggleLike(firestore, post.id, user.uid);
    setLiked(nowLiked);
    setLikeCount(c => nowLiked ? c + 1 : c - 1);
  };

  const handleBookmark = async () => {
    if (!firestore || !user || !post?.id) {
      toast({ variant: 'destructive', title: 'Sign in required', description: 'Please sign in to bookmark articles.' });
      return;
    }
    const nowBookmarked = await toggleBookmark(firestore, post.id, user.uid);
    setBookmarked(nowBookmarked);
    toast({ title: nowBookmarked ? 'Bookmarked' : 'Removed', description: nowBookmarked ? 'Added to your reading list.' : 'Removed from bookmarks.' });
  };

  const handleShare = async () => {
    if (!firestore || !post?.id) return;
    incrementShares(firestore, post.id);
    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.excerpt, url: window.location.href });
    } else {
      handleCopy();
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !post?.id || !commentText.trim()) return;
    setCommentSending(true);
    try {
      await addComment(
        firestore, post.id, user.uid,
        user.displayName || 'User',
        user.photoURL || '',
        commentText
      );
      setCommentText('');
      toast({ title: 'Comment posted!' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to post comment' });
    } finally {
      setCommentSending(false);
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
          <MotionCard hoverEffect={false} className="max-w-md w-full p-8 text-center border-border shadow-2xl bg-card">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-black mb-3 text-foreground">Post Unavailable</h1>
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
  const readingTime = calculateReadingTime(post.content || '');
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-24">

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="relative pt-24 lg:pt-32 pb-12 overflow-hidden border-b border-border">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] rounded-full pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse, hsla(354,98%,50%,0.04) 0%, transparent 65%)' }} />

          <PageTransition className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              {post.category && (
                <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-0 text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1">
                  {post.category}
                </Badge>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />{readingTime} min read
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-8 text-foreground max-w-3xl mx-auto">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-sm border border-accent/20">
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

        {/* ═══════ COVER IMAGE ═══════ */}
        {post.coverImageUrl && (
          <PageTransition className="container mx-auto px-4 max-w-5xl -mt-6 relative z-20 mb-16">
            <div className="w-full aspect-[21/9] md:aspect-[2.5/1] overflow-hidden rounded-3xl shadow-2xl border border-border bg-card">
              <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </PageTransition>
        )}

        {/* ═══════ ARTICLE BODY + ENGAGEMENT ═══════ */}
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid lg:grid-cols-[60px_1fr] gap-8">

            {/* Engagement sidebar (desktop) */}
            <aside className="hidden lg:flex flex-col items-center gap-4 sticky top-28 h-fit">
              <button
                onClick={handleLike}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${liked ? 'bg-accent/10 text-accent' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-accent' : ''}`} />
                <span className="text-[10px] font-bold">{likeCount}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${bookmarked ? 'bg-accent/10 text-accent' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-accent' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-[10px] font-bold">{(comments ?? []).length}</span>
              </button>
            </aside>

            {/* Article content */}
            <div>
              <BlogContentRenderer content={post.content || ''} />

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

              {/* Mobile engagement bar */}
              <div className="lg:hidden mt-8 flex items-center justify-center gap-3">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${liked ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                  <Heart className={`h-4 w-4 ${liked ? 'fill-accent' : ''}`} />{likeCount}
                </button>
                <button onClick={handleBookmark} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${bookmarked ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                  <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-accent' : ''}`} />Save
                </button>
                <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-secondary text-muted-foreground hover:text-foreground transition-all">
                  <Share2 className="h-4 w-4" />Share
                </button>
              </div>

              {/* ═══════ SOCIAL SHARING ═══════ */}
              <div className="mt-10 bg-card border border-border rounded-2xl p-6 shadow-sm">
                <p className="text-sm font-bold text-foreground mb-1">Share this article</p>
                <p className="text-xs text-muted-foreground mb-4">Help spread knowledge across the ecosystem.</p>
                <div className="flex flex-wrap gap-2">
                  <SocialButton platform="whatsapp" url={pageUrl} title={post.title} label="WhatsApp"
                    icon={<MessageCircle className="h-3.5 w-3.5" />}
                    color="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20" />
                  <SocialButton platform="facebook" url={pageUrl} title={post.title} label="Facebook"
                    icon={<Facebook className="h-3.5 w-3.5" />}
                    color="bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20" />
                  <SocialButton platform="linkedin" url={pageUrl} title={post.title} label="LinkedIn"
                    icon={<Linkedin className="h-3.5 w-3.5" />}
                    color="bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20" />
                  <SocialButton platform="twitter" url={pageUrl} title={post.title} label="X"
                    icon={<span className="font-black text-xs">𝕏</span>}
                    color="bg-foreground/5 text-foreground hover:bg-foreground/10" />
                  <SocialButton platform="telegram" url={pageUrl} title={post.title} label="Telegram"
                    icon={<Send className="h-3.5 w-3.5" />}
                    color="bg-[#26A5E4]/10 text-[#26A5E4] hover:bg-[#26A5E4]/20" />
                  <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary text-muted-foreground hover:text-foreground transition-all">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* ═══════ COMMENTS ═══════ */}
              <div id="comments" className="mt-12">
                <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  Discussion ({(comments ?? []).length})
                </h3>

                {user ? (
                  <form onSubmit={handleComment} className="mb-8">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-xs shrink-0 border border-accent/15">
                        {(user.displayName || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Share your thoughts..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="h-10 rounded-xl border-border flex-1 text-sm"
                        />
                        <Button
                          type="submit"
                          disabled={commentSending || !commentText.trim()}
                          size="sm"
                          className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-10 px-4"
                        >
                          {commentSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="mb-8 p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      <Link href="/login" className="text-accent font-bold hover:underline">Sign in</Link> to join the discussion.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {(comments ?? []).map((comment: any) => (
                    <div key={comment.id} className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-[10px] shrink-0 border border-accent/10">
                        {(comment.userName || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground">{comment.userName || 'User'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.createdAt ? formatDistanceToNow(
                              new Date(comment.createdAt.seconds ? comment.createdAt.seconds * 1000 : comment.createdAt),
                              { addSuffix: true }
                            ) : 'just now'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════ RELATED ARTICLES ═══════ */}
              {relatedPosts.length > 0 && (
                <div className="mt-16 pt-12 border-t border-border">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6">Related Articles</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {relatedPosts.map((rp: any) => (
                      <Link key={rp.id} href={`/blog/${rp.slug}`} className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/25 transition-all hover:shadow-md">
                        <div className="relative aspect-video overflow-hidden">
                          {rp.coverImageUrl ? (
                            <img src={rp.coverImageUrl} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <span className="text-2xl font-black text-accent/15">F8</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-accent text-[9px] font-black uppercase tracking-widest mb-1.5">{rp.category}</p>
                          <h4 className="font-bold text-xs leading-snug line-clamp-2 group-hover:text-accent transition-colors">{rp.title}</h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
