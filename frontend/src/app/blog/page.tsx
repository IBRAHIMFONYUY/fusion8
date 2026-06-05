'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';

export default function BlogPage() {
  const { firestore } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'blog_posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
  }, [firestore]);

  const { data: posts, isLoading } = useCollection(postsQuery);

  const categories = ['All', ...Array.from(new Set((posts ?? []).map((p: any) => p.category).filter(Boolean)))];

  const filtered = (posts ?? []).filter((p: any) => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const [featured, ...rest] = filtered;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-secondary">

        {/* Hero */}
        <section className="bg-primary text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Fusion8 Blog</p>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter uppercase mb-4">
              Engineering Stories
            </h1>
            <p className="text-neutral-400 max-w-xl mx-auto text-lg">
              Insights, tutorials, and news from Cameroon's hardware engineering frontier.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-6xl">

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    activeCategory === cat
                      ? 'bg-accent text-white'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Newspaper} title="No Articles Yet" description="Check back soon — new posts are on the way." />
          ) : (
            <div className="space-y-12">

              {/* Featured post */}
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="group block">
                  <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-card hover:ring-2 ring-accent/40 transition-all">
                    <div className="relative aspect-video md:aspect-auto min-h-[220px] bg-primary/10 overflow-hidden">
                      {featured.coverImageUrl ? (
                        <img src={featured.coverImageUrl} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary">
                          <span className="text-6xl font-black font-headline text-accent opacity-40">F8</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-accent text-white text-[10px] uppercase tracking-widest font-bold">Featured</Badge>
                      </div>
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      {featured.category && (
                        <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-3">{featured.category}</p>
                      )}
                      <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight leading-tight mb-3 group-hover:text-accent transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white font-bold text-[10px]">
                          {(featured.authorName || 'F8')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold">{featured.authorName || 'Fusion8'}</span>
                        <span>·</span>
                        <span>{featured.publishedAt ? formatDistanceToNow(new Date(featured.publishedAt.seconds ? featured.publishedAt.seconds * 1000 : featured.publishedAt), { addSuffix: true }) : ''}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Rest of posts */}
              {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post: any) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:ring-2 ring-accent/30 transition-all">
                      <div className="relative aspect-video bg-primary/10 overflow-hidden">
                        {post.coverImageUrl ? (
                          <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary">
                            <span className="text-3xl font-black font-headline text-accent opacity-30">F8</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {post.category && (
                          <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-2">{post.category}</p>
                        )}
                        <h3 className="font-black text-base leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white font-bold text-[9px]">
                            {(post.authorName || 'F8')[0].toUpperCase()}
                          </div>
                          <span>{post.authorName || 'Fusion8'}</span>
                          <span>·</span>
                          <span>{post.publishedAt ? formatDistanceToNow(new Date(post.publishedAt.seconds ? post.publishedAt.seconds * 1000 : post.publishedAt), { addSuffix: true }) : ''}</span>
                        </div>
                        {post.tags?.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-3">
                            {post.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-[9px] uppercase tracking-widest">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
