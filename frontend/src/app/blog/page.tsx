'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Newspaper, ArrowRight, TrendingUp, Clock, Eye, Heart, Send, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { motion, type Variants } from 'framer-motion';
import {
  BLOG_CATEGORIES,
  calculateReadingTime,
  getEngagementScore,
  subscribeNewsletter,
} from '@/services/blog-service';
import { useToast } from '@/hooks/use-toast';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function PostDate({ timestamp }: { timestamp: any }) {
  if (!timestamp) return null;
  const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
  return <span>{formatDistanceToNow(date, { addSuffix: true })}</span>;
}

function AuthorAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const s = size === 'md' ? 'w-10 h-10 text-sm' : 'w-6 h-6 text-[9px]';
  return (
    <div className={`${s} rounded-full bg-accent/10 flex items-center justify-center text-accent font-black border border-accent/15 shrink-0`}>
      {(name || 'F8')[0].toUpperCase()}
    </div>
  );
}

export default function BlogPage() {
  const { firestore } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [nlName, setNlName] = useState('');
  const [nlEmail, setNlEmail] = useState('');
  const [nlSending, setNlSending] = useState(false);
  const [showCount, setShowCount] = useState(9);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'blog_posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
  }, [firestore]);

  const { data: posts, isLoading, error } = useCollection(postsQuery);

  const allPosts: any[] = (posts ?? []).map((p: any) => ({
    ...p,
    readingTime: calculateReadingTime(p.content || ''),
    engagementScore: getEngagementScore(p),
  }));

  const categories = ['All', ...BLOG_CATEGORIES];

  const filtered = allPosts.filter((p: any) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.authorName?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.tags || []).some((t: string) => t.toLowerCase().includes(q));
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const trending = [...allPosts].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5);
  const [featured, ...rest] = filtered;
  const visiblePosts = rest.slice(0, showCount);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !nlEmail.trim()) return;
    setNlSending(true);
    try {
      await subscribeNewsletter(firestore, nlName, nlEmail);
      toast({ title: 'Subscribed!', description: 'You\'ll receive the latest from Fusion 8.' });
      setNlName('');
      setNlEmail('');
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Please try again.' });
    } finally {
      setNlSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">

        {/* ═══════ HERO ═══════ */}
        <section className="relative pt-28 pb-16 overflow-hidden border-b border-border">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, hsla(354,98%,50%,0.06) 0%, transparent 65%)' }} />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, hsla(354,100%,2%,0.04) 0%, transparent 60%)' }} />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="section-label">Fusion 8 Blog</p>
              <h1 className="text-display text-foreground mb-4">Knowledge Hub</h1>
              <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed mb-8">
                Innovation stories, engineering insights, and startup intelligence from Africa&apos;s hardtech frontier.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles, authors, tags..."
                  className="pl-11 h-12 rounded-xl border-border bg-card shadow-sm text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════ CATEGORIES ═══════ */}
        <section className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setShowCount(9); }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeCategory === cat
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-6xl">

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <EmptyState 
                icon={Newspaper} 
                title="Database Error" 
                description={`Failed to load posts: ${(error as any).message || 'Unknown error'}`} 
              />
              {/* If it's a missing index error, Firebase includes a direct URL to create it in the console logs */}
              <p className="mt-4 text-xs text-muted-foreground">Check your browser console for details or index creation links.</p>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="py-24">
              <EmptyState icon={Newspaper} title="No Articles Yet" description="Check back soon — new posts are on the way." />
            </div>
          ) : (
            <>
              {/* ═══════ FEATURED ARTICLE ═══════ */}
              {featured && !search && activeCategory === 'All' && (
                <section className="pt-12 pb-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <Link href={`/blog/${featured.slug}`} className="group block">
                      <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-card border border-border hover:border-accent/30 transition-all shadow-xl hover:shadow-2xl">
                        <div className="relative aspect-video md:aspect-auto min-h-[260px] overflow-hidden">
                          {featured.coverImageUrl ? (
                            <img src={featured.coverImageUrl} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <span className="text-7xl font-black text-accent/20">F8</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <Badge className="bg-accent text-white text-[10px] uppercase tracking-widest font-bold border-0 shadow-lg">Featured</Badge>
                          </div>
                        </div>
                        <div className="p-8 md:p-10 flex flex-col justify-center">
                          {featured.category && (
                            <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-3">{featured.category}</p>
                          )}
                          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-3 group-hover:text-accent transition-colors">
                            {featured.title}
                          </h2>
                          {featured.excerpt && (
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <AuthorAvatar name={featured.authorName} size="md" />
                            <div>
                              <span className="font-semibold text-foreground block">{featured.authorName || 'Fusion8 Team'}</span>
                              <span className="flex items-center gap-2 mt-0.5">
                                <PostDate timestamp={featured.publishedAt} />
                                <span>·</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featured.readingTime} min read</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </section>
              )}

              {/* ═══════ TRENDING ═══════ */}
              {trending.length > 0 && !search && activeCategory === 'All' && (
                <section className="py-10 border-b border-border">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Trending</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                    {trending.map((post: any, i: number) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex-shrink-0 w-[280px] bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/25 transition-all hover:shadow-lg"
                      >
                        <div className="relative h-36 overflow-hidden">
                          {post.coverImageUrl ? (
                            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <span className="text-3xl font-black text-accent/15">F8</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="bg-accent/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              #{i + 1}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views || 0}</span>
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes || 0}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime}m</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ═══════ NEWSLETTER ═══════ */}
              {!search && activeCategory === 'All' && (
                <section className="py-10">
                  <div className="relative rounded-3xl overflow-hidden bg-primary/[0.03] border border-border p-8 md:p-12">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, hsla(354,98%,50%,0.05) 0%, transparent 65%)' }} />
                    </div>
                    <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <p className="section-label">Stay Updated</p>
                        <h3 className="text-section text-foreground mb-2">Never Miss a Post</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Get the latest engineering insights, startup stories, and innovation updates delivered straight to your inbox.
                        </p>
                      </div>
                      <form onSubmit={handleNewsletter} className="flex flex-col gap-3">
                        <Input
                          placeholder="Your name"
                          value={nlName}
                          onChange={e => setNlName(e.target.value)}
                          className="h-11 rounded-xl border-border bg-card"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            value={nlEmail}
                            onChange={e => setNlEmail(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border bg-card flex-1"
                          />
                          <Button
                            type="submit"
                            disabled={nlSending}
                            className="bg-accent hover:bg-accent/90 text-white font-bold h-11 px-5 rounded-xl shadow-lg shadow-accent/20"
                          >
                            {nlSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" />Subscribe</>}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </section>
              )}

              {/* ═══════ LATEST ARTICLES ═══════ */}
              <section className="py-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                    {search ? `Results for "${search}"` : activeCategory !== 'All' ? activeCategory : 'Latest Articles'}
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {filtered.length === 0 ? (
                  <EmptyState icon={Search} title="No Results" description="Try adjusting your search or category filter." />
                ) : (
                  <>
                    <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {(search || activeCategory !== 'All' ? filtered : visiblePosts).map((post: any) => (
                        <motion.div key={post.id} variants={fadeUp}>
                          <Link href={`/blog/${post.slug}`} className="group flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/25 transition-all hover:shadow-lg">
                            <div className="relative aspect-video overflow-hidden">
                              {post.coverImageUrl ? (
                                <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                  <span className="text-3xl font-black text-accent/15">F8</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                              {post.category && (
                                <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">{post.category}</p>
                              )}
                              <h3 className="font-bold text-sm leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                              )}
                              <div className="flex items-center justify-between pt-3 border-t border-border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <AuthorAvatar name={post.authorName} />
                                  <span className="font-medium">{post.authorName || 'Fusion8'}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime}m</span>
                                  {(post.views || 0) > 0 && (
                                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views}</span>
                                  )}
                                </div>
                              </div>
                              {post.tags?.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-3">
                                  {post.tags.slice(0, 3).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-[9px] uppercase tracking-widest font-semibold">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Load More */}
                    {!search && activeCategory === 'All' && showCount < rest.length && (
                      <div className="flex justify-center mt-10">
                        <Button
                          variant="outline"
                          onClick={() => setShowCount(c => c + 9)}
                          className="rounded-xl h-11 px-8 font-semibold border-border hover:bg-secondary"
                        >
                          Load More <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
