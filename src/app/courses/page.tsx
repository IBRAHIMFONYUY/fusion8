
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { lmsService, LMSCourse } from '@/services/lms-service';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CoursesPage() {
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await lmsService.getCatalog();
        setCourses(data);
      } catch (err: any) {
        if (err.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'courses',
                operation: 'list',
            }));
        } else {
            setError("The catalog vault is temporarily inaccessible. Please refresh.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-accent/10 text-accent border-none font-black tracking-widest px-4 py-1.5 uppercase text-[10px]">Technical Curriculum</Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter font-headline text-primary uppercase leading-tight">
              The Digital Campus
            </h1>
            <p className="max-w-2xl mx-auto mt-6 text-xl text-muted-foreground font-medium leading-relaxed">
              Explore our verified, industry-grade skill paths designed to bridge the engineering gap in Cameroon.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-16 w-16 animate-spin text-accent mb-6" />
              <p className="text-muted-foreground animate-pulse font-black tracking-[0.3em] uppercase text-xs">Synchronizing Global Catalog...</p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto p-8 text-center bg-card rounded-3xl shadow-xl">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold">Sync Error</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-6">Retry Connection</Button>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {courses.map((course) => {
                const courseImage = course.thumbnail || PlaceHolderImages[0].imageUrl;
                return (
                  <Card key={course.id} className="flex flex-col overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 group rounded-[2.5rem] bg-card">
                    <CardHeader className="p-0 relative aspect-[4/3] overflow-hidden">
                      <img
                        src={courseImage}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-6 right-6">
                         <Badge className="bg-accent text-accent-foreground border-none text-[8px] font-black uppercase tracking-widest mb-2 px-2 py-0">Certified Track</Badge>
                         <CardTitle className="text-xl text-white font-headline font-black leading-tight drop-shadow-md line-clamp-2">{course.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-8 px-8">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-6 italic leading-relaxed">"{course.description}"</p>
                      <div className="pt-6 border-t border-dashed border-border/50 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Registration</span>
                            <span className="font-black text-primary text-lg">{(course.price || 50000).toLocaleString()} <span className="text-xs">XAF</span></span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Learners</span>
                            <span className="text-sm font-bold text-accent">{course.enrolledCount || 0}+</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pb-8 px-8">
                      <Button asChild className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-accent text-white shadow-xl transition-all group-hover:shadow-accent/20 text-lg uppercase tracking-tighter">
                        <Link href={`/courses/${course.id}`}>
                          Enroll in Track <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
                <Card className="p-12 border-4 border-dashed rounded-[3rem] text-center bg-card shadow-2xl">
                    <BookOpen className="h-20 w-20 text-accent/20 mx-auto mb-6" />
                    <h2 className="text-2xl font-black font-headline uppercase tracking-tighter mb-4">Catalog Synchronizing</h2>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                        Our instructors and administrators are currently vetting new engineering tracks. Please check back shortly for the latest verified curricula.
                    </p>
                    <Button variant="outline" className="mt-8 font-bold border-2 rounded-xl" onClick={() => window.location.reload()}>
                        Refresh Vault
                    </Button>
                </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
