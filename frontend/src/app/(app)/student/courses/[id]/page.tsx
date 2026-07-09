'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { firestore, useAuth, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { paymentService } from '@/services/payment-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { PlayCircle, Video, Loader2, AlertCircle, BookOpen, Clock, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function StudentCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;
  const { user, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);

  // Real-time Course Data
  const courseRef = useMemoFirebase(() => 
    courseId ? doc(firestore, 'courses', courseId) : null, [courseId]
  );
  const { data: course, isLoading: courseLoading, error: courseError } = useDoc<any>(courseRef);

  // Real-time Enrollment/Progress Data
  const enrollmentRef = useMemoFirebase(() => 
    user && courseId ? doc(firestore, 'enrollments', `${user.uid}_${courseId}`) : null,
    [user, courseId]
  );
  const { data: enrollment, isLoading: enrollDocLoading } = useDoc<any>(enrollmentRef);

  // Real-time Curriculum Data
  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, `courses/${courseId}/modules`), orderBy('order', 'asc'));
  }, [firestore, courseId]);

  const lessonsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, `courses/${courseId}/lessons`), orderBy('order', 'asc'));
  }, [firestore, courseId]);

  const { data: modulesList, isLoading: modulesLoading } = useCollection<any>(modulesQuery);
  const { data: lessonsList, isLoading: lessonsLoading } = useCollection<any>(lessonsQuery);

  useEffect(() => {
    async function verifyEnrollment() {
      if (!courseId || !user || courseLoading) return;

      if (role === 'admin' || (role === 'teacher' && course?.teacherId === user.uid)) {
        setIsEnrolled(true);
        return;
      }

      const status = await paymentService.checkEnrollmentStatus(user.uid, courseId);
      if (status !== 'active') {
        router.push(`/courses/${courseId}`);
      } else {
        setIsEnrolled(true);
      }
    }
    if (!authLoading && user) verifyEnrollment();
  }, [courseId, user, authLoading, router, role, course, courseLoading]);

  if (courseError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Cannot Load Course</h2>
        <p className="text-muted-foreground mb-6">You may not have access to this course. Contact your instructor if you believe this is an error.</p>
        <Button onClick={() => router.push('/student/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  if (authLoading || courseLoading || modulesLoading || lessonsLoading || enrollDocLoading || isEnrolled === null) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-24 text-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-xs">Accessing Digital Campus...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Curriculum Not Found</h2>
        <p className="text-muted-foreground mb-6">This course may have been removed or moved by the lecturer.</p>
        <Button onClick={() => router.push('/courses')}>Back to Catalog</Button>
      </div>
    );
  }

  // Hydrate modules with their respective lessons
  const modules = (modulesList || []).map(m => ({
    ...m,
    lessons: (lessonsList || []).filter(l => l.moduleId === m.id)
  }));

  const progress = enrollment?.progress || 0;
  const completedLessons = enrollment?.completedLessons || [];

  // Identify the first incomplete lesson, or the first lesson if none completed
  const firstLesson = (lessonsList || []).find(l => !completedLessons.includes(l.id)) || (lessonsList && lessonsList.length > 0 ? lessonsList[0] : null);

  return (
    <div className="space-y-8">
        {/* Cinematic Header */}
        <div className="bg-primary text-primary-foreground p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
                <Badge className="bg-accent text-accent-foreground border-none mb-4 px-3 py-1 font-bold">MY LEARNING</Badge>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">{course.title}</h1>
                <p className="text-neutral-400 text-lg leading-relaxed mb-8">{course.description}</p>
                <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2 font-medium"><BookOpen className="h-4 w-4 text-accent" /> {modules.length} Modules</div>
                    <div className="flex items-center gap-2 font-medium"><PlayCircle className="h-4 w-4 text-accent" /> {lessonsList?.length || 0} Lessons</div>
                    <div className="flex items-center gap-2 font-medium"><Star className="h-4 w-4 text-accent" /> Verified Credentials</div>
                </div>
                {firstLesson ? (
                  <Button asChild size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-14 px-8 sm:px-10 rounded-full shadow-xl transform transition-transform hover:scale-105">
                    <Link href={`/student/courses/${course.id}/lesson/${firstLesson.id}`}>
                      {completedLessons.length > 0 ? 'Continue Learning' : 'Start Taking Lessons'} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <div className="mt-8 p-4 bg-white/5 border border-black/[0.08] rounded-xl text-sm italic text-neutral-400 max-w-sm">
                    The instructor is currently uploading the curriculum content. Please check back shortly.
                  </div>
                )}
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 -mr-24 -mt-24 rounded-full blur-3xl" />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                    <Video className="text-accent h-6 w-6" /> 
                    Curriculum Explorer
                </h2>
                {modules.length > 0 ? (
                  <Accordion type="multiple" defaultValue={modules.map(m => `item-${m.id}`)} className="w-full space-y-4">
                      {modules.map((module) => (
                          <AccordionItem value={`item-${module.id}`} key={module.id} className="border-none bg-card rounded-2xl shadow-sm overflow-hidden border border-border/50">
                              <AccordionTrigger className="font-bold text-lg px-6 py-5 hover:no-underline bg-secondary/20">
                                  {module.title}
                              </AccordionTrigger>
                              <AccordionContent className="p-0">
                                  <ul className="divide-y divide-border/50">
                                      {module.lessons.map((lesson: any, index: number) => {
                                          const isDone = completedLessons.includes(lesson.id);
                                          return (
                                            <li key={lesson.id}>
                                                <Link href={`/student/courses/${course.id}/lesson/${lesson.id}`}>
                                                    <div className="flex items-center justify-between px-6 py-5 hover:bg-accent/5 transition-all group">
                                                        <div className="flex items-center gap-5">
                                                            <div className="text-3xl font-black text-muted-foreground/20 group-hover:text-accent/40 transition-colors">
                                                              {isDone ? <CheckCircle className="h-8 w-8 text-green-500" /> : String(index + 1).padStart(2, '0')}
                                                            </div>
                                                            <div>
                                                                <h3 className={cn("font-bold group-hover:text-accent transition-colors", isDone && "text-muted-foreground")}>{lesson.title}</h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                                                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{lesson.duration || "10"} MINS</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 rounded-full bg-secondary group-hover:bg-accent transition-all">
                                                          <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground"/>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                          );
                                      })}
                                      {module.lessons.length === 0 && (
                                        <li className="px-6 py-4 text-xs text-muted-foreground italic">No lessons in this module yet.</li>
                                      )}
                                  </ul>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                  </Accordion>
                ) : (
                  <Card className="p-12 border-2 border-dashed rounded-3xl text-center bg-secondary/10">
                    <CardContent className="pt-6">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Curriculum is being updated by the lecturer.</p>
                    </CardContent>
                  </Card>
                )}
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-xl bg-secondary/30 rounded-3xl sticky top-24">
                    <CardHeader>
                        <CardTitle className="text-lg">Your Trajectory</CardTitle>
                        <CardDescription>Real-time progress tracking.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-8 border-accent/20 text-2xl font-black text-accent">
                                {progress}%
                            </div>
                            <p className="text-sm font-bold mt-4 text-muted-foreground uppercase tracking-widest">
                              {completedLessons.length} / {lessonsList?.length || 0} Lessons Completed
                            </p>
                            <Progress value={progress} className="mt-4 h-2" />
                        </div>
                        <div className="space-y-3">
                          <Button asChild variant="default" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90">
                            <Link href="/student/dashboard">Back to Hub</Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold border-2">
                            <Link href={`/courses/${courseId}`}>View Public Showroom</Link>
                          </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
