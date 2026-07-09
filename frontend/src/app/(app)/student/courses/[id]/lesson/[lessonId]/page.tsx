"use client"
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, CheckCircle, Lightbulb, Loader2, ArrowLeft, ArrowRight, FileText, ExternalLink, GraduationCap, BookOpen, ShieldAlert, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getAiSummaryAction } from '@/lib/actions';
import { useActionState, useMemo, startTransition, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/video-player';
import { enrollmentService } from '@/services/enrollment-service';
import { useToast } from '@/hooks/use-toast';

export default function LessonPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const { firestore, user } = useAuth();
  const { toast } = useToast();
  
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const courseRef = useMemoFirebase(() => 
    firestore && params?.id ? doc(firestore, 'courses', params.id) : null, 
    [firestore, params?.id]
  );
  
  const lessonRef = useMemoFirebase(() => 
    firestore && params?.id && params?.lessonId ? doc(firestore, `courses/${params.id}/lessons`, params.lessonId) : null, 
    [firestore, params?.id, params?.lessonId]
  );

  const enrollmentRef = useMemoFirebase(() => 
    firestore && user && params?.id ? doc(firestore, 'enrollments', `${user.uid}_${params.id}`) : null,
    [firestore, user, params?.id]
  );

  const modulesQuery = useMemoFirebase(() => 
    firestore && params?.id ? query(collection(firestore, `courses/${params.id}/modules`), orderBy('order', 'asc')) : null, 
    [firestore, params?.id]
  );

  const lessonsQuery = useMemoFirebase(() => 
    firestore && params?.id ? query(collection(firestore, `courses/${params.id}/lessons`), orderBy('order', 'asc')) : null, 
    [firestore, params?.id]
  );

  const { data: course, isLoading: courseLoading } = useDoc<any>(courseRef);
  const { data: lesson, isLoading: lessonLoading } = useDoc<any>(lessonRef);
  const { data: enrollment, isLoading: enrollLoading } = useDoc<any>(enrollmentRef);
  const { data: modulesList, isLoading: modulesLoading } = useCollection<any>(modulesQuery);
  const { data: allLessons, isLoading: lessonsLoading } = useCollection<any>(lessonsQuery);

  const [state, formAction, isPending] = useActionState(getAiSummaryAction, { summary: undefined, error: undefined });

  const navigation = useMemo(() => {
    if (!allLessons || !params?.lessonId) return { prev: null, next: null };
    const currentIndex = allLessons.findIndex(l => l.id === params.lessonId);
    return {
      prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
    };
  }, [allLessons, params?.lessonId]);

  // Enrollment gate — redirect unenrolled users to the course detail page
  useEffect(() => {
    if (enrollLoading || !user || !params?.id) return;
    if (enrollment === null || enrollment?.status !== 'active') {
      router.replace(`/courses/${params.id}?enroll=1`);
    }
  }, [enrollment, enrollLoading, user, params?.id, router]);

  const isCompleted = useMemo(() => {
    return enrollment?.completedLessons?.includes(params?.lessonId);
  }, [enrollment, params?.lessonId]);

  const handleMarkComplete = async () => {
    if (!user || !params?.id || !params?.lessonId || !allLessons) return;
    
    setIsMarkingComplete(true);
    try {
      await enrollmentService.markLessonComplete(
        firestore, 
        user.uid, 
        params.id, 
        params.lessonId, 
        allLessons.length
      );
      toast({ title: "Lesson Completed", description: "Your progress has been updated." });
      
      // If there is a next lesson, navigate to it automatically
      if (navigation.next) {
        router.push(`/student/courses/${params.id}/lesson/${navigation.next.id}`);
      }
    } catch (error) {
      // Handled by emitter
    } finally {
      setIsMarkingComplete(false);
    }
  };

  if (courseLoading || lessonLoading || modulesLoading || lessonsLoading || enrollLoading || !courseRef || !lessonRef) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-24 text-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-xs">Authenticating technical stream...</p>
      </div>
    );
  }

  if (!course || !lesson) return notFound();

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Link href={`/student/courses/${params.id}`} className="hover:text-accent transition-colors">Digital Campus</Link>
            <span>/</span>
            <span className="text-accent">{course.title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter font-headline text-primary">{lesson.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <Badge variant="secondary" className="h-8 px-3 sm:px-4 font-bold bg-secondary/50 border-none">
             Module {lesson.order + 1}
           </Badge>
           <Badge variant="outline" className="h-8 px-3 sm:px-4 font-bold border-accent/20 text-accent uppercase tracking-wider text-[10px]">
             {lesson.duration || "10"} MINS
           </Badge>
           {isCompleted && (
             <Badge className="h-8 px-3 sm:px-4 font-bold bg-green-100 text-green-700 border-none flex items-center gap-1">
               <CheckCircle className="h-3 w-3" /> Completed
             </Badge>
           )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* THE TECHNICAL VAULT PLAYER */}
          <VideoPlayer url={lesson.youtubeVideoUrl || lesson.videoUrl} title={lesson.title} />

          {/* Mobile syllabus sheet — hidden on lg where the sidebar is visible */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full h-11 font-bold border-2 rounded-xl flex items-center justify-between px-5">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    Course Outline
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {(allLessons?.findIndex(l => l.id === params?.lessonId) ?? 0) + 1}/{allLessons?.length ?? '?'} lessons
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[82vh] p-0 rounded-t-3xl overflow-hidden border-none">
                <div className="bg-primary h-full flex flex-col">
                  <div className="bg-white/5 py-4 px-6 border-b border-white/10 flex items-center gap-3 shrink-0">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/60">Syllabus Navigator</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <Accordion type="multiple" defaultValue={modulesList?.map(m => `item-${m.id}`)} className="w-full">
                      {modulesList?.map((module) => (
                        <AccordionItem value={`item-${module.id}`} key={module.id} className="border-b border-white/5">
                          <AccordionTrigger className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-primary-foreground/80 hover:no-underline">
                            {module.title}
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 bg-black/20">
                            <ul className="space-y-0.5">
                              {allLessons?.filter(l => l.moduleId === module.id).map(l => {
                                const lessonIsDone = enrollment?.completedLessons?.includes(l.id);
                                return (
                                  <li key={l.id}>
                                    <Link href={`/student/courses/${params.id}/lesson/${l.id}`}>
                                      <div className={cn(
                                        "flex items-center gap-3 px-6 py-4 text-[11px] transition-all border-l-4",
                                        l.id === params?.lessonId
                                          ? "bg-accent/20 border-accent text-white font-black"
                                          : "border-transparent text-primary-foreground/40"
                                      )}>
                                        {lessonIsDone ? (
                                          <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                                        ) : (
                                          <PlayCircle className={cn("h-4 w-4 shrink-0", l.id === params?.lessonId ? "text-accent" : "opacity-30")} />
                                        )}
                                        <span className={cn("flex-1 truncate", lessonIsDone && "text-white/60")}>{l.title}</span>
                                        {l.id === params?.lessonId && <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
                                      </div>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-wrap items-center justify-between p-4 sm:p-6 bg-card rounded-2xl border shadow-sm gap-4">
            <div className="flex gap-2">
              {navigation.prev ? (
                <Button asChild variant="outline" className="font-bold border-2 rounded-xl">
                  <Link href={`/student/courses/${params.id}/lesson/${navigation.prev.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Link>
                </Button>
              ) : <div />}
            </div>
            
            <div className="flex gap-2">
              {!isCompleted ? (
                <Button 
                  onClick={handleMarkComplete} 
                  disabled={isMarkingComplete}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 h-12 rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
                >
                  {isMarkingComplete ? <Loader2 className="animate-spin h-4 w-4" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Mark as Complete & Next</>}
                </Button>
              ) : (
                navigation.next ? (
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 h-12 rounded-xl shadow-lg transition-all">
                    <Link href={`/student/courses/${params.id}/lesson/${navigation.next.id}`}>
                      Next Lesson <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="font-bold border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl" onClick={() => router.push(`/student/courses/${params.id}`)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> All Lessons Complete
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="border-none shadow-md bg-accent/5 overflow-hidden rounded-2xl ring-1 ring-accent/10">
                <CardHeader className="pb-4 bg-accent/5 border-b border-accent/10">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-accent uppercase tracking-tighter">
                    <Lightbulb className="h-5 w-5" />
                    AI Intelligence Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isPending ? (
                    <div className="space-y-3 py-2">
                      <Skeleton className="h-4 w-full bg-accent/10" />
                      <Skeleton className="h-4 w-[90%] bg-accent/10" />
                      <Skeleton className="h-4 w-[85%] bg-accent/10" />
                    </div>
                  ) : state?.summary ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed italic text-muted-foreground">
                      {state.summary}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-sm mb-6">Process this stream through our neural summarization engine.</p>
                      <Button 
                        onClick={() => {
                          startTransition(() => {
                            formAction(lesson.content);
                          });
                        }} 
                        variant="secondary" 
                        size="lg" 
                        className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 shadow-lg shadow-accent/20"
                      >
                        Generate Insights
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                  <FileText className="h-6 w-6 text-accent" />
                  Unit Documentation
                </h3>
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-secondary/30">
                  <CardContent className="pt-6 px-4 sm:px-8 pb-8">
                    <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-base font-medium text-foreground/80">
                      {lesson.content || "Instructor notes are exclusively synchronized for the onsite cohort. Digital campus users should refer to the video stream and linked reference materials."}
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-dashed">
                        <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg">
                            <Link href="/student/assignments">
                                <ArrowRight className="mr-2 h-4 w-4" /> Submit Project Deliverable
                            </Link>
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Internal Repository</h3>
                <Card className="border-none shadow-xl overflow-hidden rounded-3xl ring-1 ring-black/5">
                  <CardContent className="p-0">
                    <div className="p-5 border-b bg-secondary/30">
                      <p className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                        <GraduationCap className="h-4 w-4 text-accent" /> Reference Hub
                      </p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="p-4 bg-accent/5 rounded-2xl border border-dashed border-accent/20 space-y-2">
                        <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
                            <ShieldAlert className="h-3 w-3" />
                            Secure Access
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">Technical repositories and design files are served through the Fusion8 internal gateway.</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[11px] font-bold">Lab Manual.pdf</span>
                         </div>
                         <Download className="h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {lesson.githubUrl && (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group" onClick={() => window.open(lesson.githubUrl, '_blank')}>
                            <div className="flex items-center gap-3">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[11px] font-bold">Design Repository</span>
                            </div>
                            <ExternalLink className="h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 hidden lg:block">
          <Card className="sticky top-24 border-none shadow-2xl overflow-hidden rounded-[2rem] bg-primary ring-1 ring-white/10">
            <CardHeader className="bg-white/5 py-6 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/60 flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-accent" /> Syllabus Navigator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-primary">
              <ScrollArea className="h-[70vh]">
                <Accordion type="multiple" defaultValue={modulesList?.map(m => `item-${m.id}`)} className="w-full">
                  {modulesList?.map((module) => (
                    <AccordionItem value={`item-${module.id}`} key={module.id} className="border-b border-white/5">
                      <AccordionTrigger className="px-6 py-5 font-bold text-[11px] uppercase tracking-wider text-primary-foreground/80 hover:no-underline hover:bg-black/[0.03] transition-colors">
                        {module.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 bg-black/20">
                        <ul className="space-y-0.5">
                          {allLessons?.filter(l => l.moduleId === module.id).map(l => {
                            const lessonIsDone = enrollment?.completedLessons?.includes(l.id);
                            return (
                              <li key={l.id}>
                                <Link href={`/student/courses/${params.id}/lesson/${l.id}`}>
                                  <div className={cn(
                                    "flex items-center gap-3 px-6 py-5 text-[11px] transition-all border-l-4",
                                    l.id === params?.lessonId 
                                      ? "bg-accent/20 border-accent text-white font-black" 
                                      : "border-transparent hover:bg-black/[0.03] text-primary-foreground/40"
                                  )}>
                                    {lessonIsDone ? (
                                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                                    ) : (
                                      <PlayCircle className={cn("h-4 w-4 shrink-0", l.id === params?.lessonId ? "text-accent" : "opacity-30")} />
                                    )}
                                    <span className={cn("flex-1 truncate", lessonIsDone && "text-white/60")}>{l.title}</span>
                                    {l.id === params?.lessonId && <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_hsl(var(--accent)/0.8)]" />}
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
