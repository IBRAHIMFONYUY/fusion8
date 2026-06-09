'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, AlertCircle, Search, SlidersHorizontal, Users } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { lmsService, LMSCourse } from '@/services/lms-service';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Automotive', 'Drones & UAV', 'Embedded Systems', 'MATLAB', 'Mechatronics', 'SolidWorks'] as const;
const LEVELS     = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

function CourseCardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-card border border-border animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-10 bg-muted rounded-xl mt-4" />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses]     = useState<LMSCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState<string>('All');
  const [level, setLevel]         = useState<string>('All');

  useEffect(() => {
    lmsService.getCatalog()
      .then(data => {
        setCourses(data);
        if (data.length === 0) {
          console.info('[Fusion8] No published courses found. Run scripts/seed-courses.ts to populate the catalog.');
        }
      })
      .catch(err => setError(err.message || 'Failed to load catalog'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const matchSearch   = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'All' || (c as any).category === category;
      const matchLevel    = level === 'All' || (c as any).level === level;
      return matchSearch && matchCategory && matchLevel;
    });
  }, [courses, search, category, level]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-background pt-28 pb-14 border-b border-black/[0.06]">
        <div className="container mx-auto px-4 text-center">
          <p className="section-label">Technical Curriculum</p>
          <h1 className="text-display text-foreground mb-4">
            The Digital Campus
          </h1>
          <p className="max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed">
            Industry-grade engineering skill paths designed to bridge the gap in Cameroon.
          </p>
        </div>
      </section>

      <main className="flex-1 bg-secondary/30">
        <div className="container mx-auto px-4 py-10">

          {/* Filter bar */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-10 h-11 rounded-xl"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Level */}
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      level === l
                        ? 'bg-accent text-white shadow-sm'
                        : 'border border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Category row */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    category === cat
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          {!isLoading && !error && (
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Showing {filtered.length} of {courses.length} course{courses.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* States */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto p-8 text-center bg-card rounded-3xl shadow-xl border border-border">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold">Connection Error</h2>
              <p className="text-muted-foreground mt-2 text-sm">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-6 bg-accent hover:bg-accent/90 text-white">
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 && courses.length > 0 ? (
            <div className="max-w-md mx-auto p-10 text-center bg-card rounded-3xl border border-dashed border-border">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-black mb-2">No courses found</h2>
              <p className="text-sm text-muted-foreground mb-4">
                No courses match "{search || category}" yet.
                More courses are being added each cohort.
              </p>
              <Button variant="outline" onClick={() => { setSearch(''); setCategory('All'); setLevel('All'); }}>
                Clear filters
              </Button>
            </div>
          ) : courses.length === 0 ? (
            <div className="max-w-xl mx-auto">
              <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center bg-card shadow-sm">
                <BookOpen className="h-16 w-16 text-accent/20 mx-auto mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Catalog Loading</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                  Our engineering tracks are being finalized for Cohort 01.
                </p>
                <p className="text-muted-foreground text-xs">
                  If you're an admin, publish courses in the Admin Portal or run the seed script.
                </p>
                <Button variant="outline" className="mt-6 font-bold border-2 rounded-xl" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            >
              {filtered.map(course => {
                const img = course.thumbnail || PlaceHolderImages[0]?.imageUrl;
                return (
                  <motion.div
                    key={course.id}
                    variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                  >
                    <Card className="flex flex-col overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group rounded-3xl bg-card h-full">
                      <CardHeader className="p-0 relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={img}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-5 right-5">
                          <div className="flex items-center gap-2 mb-1.5">
                            {(course as any).category && (
                              <Badge className="bg-accent text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                {(course as any).category}
                              </Badge>
                            )}
                            {(course as any).level && (
                              <Badge variant="outline" className="border-black/[0.15] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                                {(course as any).level}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-white font-black leading-tight drop-shadow line-clamp-2">
                            {course.title}
                          </CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 pt-5 px-6">
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-dashed border-border/60 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Fee</p>
                            <p className="font-black text-foreground text-lg">
                              {(course.price || 5000).toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">XAF</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="font-bold text-foreground">{course.enrolledCount || 0}</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pb-6 px-6">
                        <Button asChild className="w-full h-12 rounded-xl font-bold bg-accent hover:bg-orange-600 text-white shadow-lg shadow-accent/20 transition-all">
                          <Link href={`/courses/${course.id}`}>
                            View Course <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
