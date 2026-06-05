'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlayCircle, CheckCircle, Loader2, ArrowLeft, ArrowRight, FileText, UploadCloud, Info, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, orderBy, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/video-player';
import { enrollmentService } from '@/services/enrollment-service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function LearnPlayerContent() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firestore, user } = useAuth();
  const { toast } = useToast();

  const activeLessonId = searchParams.get('lessonId');

  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any | null>(null);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);

  // Firestore Refs
  const courseRef = useMemoFirebase(() => firestore && params?.courseId ? doc(firestore, 'courses', params.courseId) : null, [firestore, params?.courseId]);
  const enrollmentRef = useMemoFirebase(() => firestore && user && params?.courseId ? doc(firestore, 'enrollments', `${user.uid}_${params.courseId}`) : null, [firestore, user, params?.courseId]);
  
  const modulesQuery = useMemoFirebase(() => firestore && params?.courseId ? query(collection(firestore, `courses/${params.courseId}/modules`), orderBy('order', 'asc')) : null, [firestore, params?.courseId]);
  const lessonsQuery = useMemoFirebase(() => firestore && params?.courseId ? query(collection(firestore, `courses/${params.courseId}/lessons`), orderBy('order', 'asc')) : null, [firestore, params?.courseId]);

  const { data: course, isLoading: courseLoading } = useDoc<any>(courseRef);
  const { data: enrollment, isLoading: enrollLoading } = useDoc<any>(enrollmentRef);
  const { data: modulesList, isLoading: modulesLoading } = useCollection<any>(modulesQuery);
  const { data: allLessons, isLoading: lessonsLoading } = useCollection<any>(lessonsQuery);

  // Fallback to first lesson if not in URL
  useEffect(() => {
    if (!activeLessonId && allLessons && allLessons.length > 0) {
      router.replace(`/student/learn/${params?.courseId}?lessonId=${allLessons[0].id}`);
    }
  }, [activeLessonId, allLessons, params?.courseId, router]);

  const currentLesson = useMemo(() => {
    if (!allLessons || !activeLessonId) return null;
    return allLessons.find(l => l.id === activeLessonId) || null;
  }, [allLessons, activeLessonId]);

  const navigation = useMemo(() => {
    if (!allLessons || !activeLessonId) return { prev: null, next: null };
    const currentIndex = allLessons.findIndex(l => l.id === activeLessonId);
    return {
      prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
    };
  }, [allLessons, activeLessonId]);

  const isCompleted = useMemo(() => {
    if (!enrollment || !activeLessonId) return false;
    return enrollment.completedLessons?.includes(activeLessonId);
  }, [enrollment, activeLessonId]);

  // Fetch Progression Lock (Submission state)
  useEffect(() => {
    async function checkSubmission() {
      if (!firestore || !user || !currentLesson || !currentLesson.isAssignment) {
        setCurrentSubmission(null);
        return;
      }
      setIsCheckingSubmission(true);
      try {
        const q = query(
          collection(firestore, 'submissions'), 
          where('studentId', '==', user.uid),
          where('lessonId', '==', currentLesson.id)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setCurrentSubmission(snap.docs[0].data());
        } else {
          setCurrentSubmission(null);
        }
      } catch (err) {
        console.error("Lock sequence verified failed.");
      } finally {
        setIsCheckingSubmission(false);
      }
    }
    checkSubmission();
  }, [firestore, user, currentLesson]);

  const handleMarkComplete = async () => {
    if (!user || !params?.courseId || !activeLessonId || !allLessons || !currentLesson) return;
    
    // Hard Lock Rule
    if (currentLesson.isAssignment && currentSubmission?.status !== 'passed') {
        return toast({ variant: 'destructive', title: 'Progression Locked', description: 'Instructor must pass your project before you can advance.' });
    }

    setIsMarkingComplete(true);
    try {
      await enrollmentService.markLessonComplete(
        firestore, 
        user.uid, 
        params.courseId, 
        activeLessonId, 
        allLessons.length
      );
      toast({ title: "Lesson Completed", description: "Your progress has been updated." });
      
      if (navigation.next) {
        router.push(`/student/learn/${params.courseId}?lessonId=${navigation.next.id}`);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Update Failed", description: "Could not save progress." });
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !params?.courseId || !currentLesson) return;

    setIsSubmitting(true);
    const submissionId = `${user.uid}_${currentLesson.id}`;
    
    try {
        await setDoc(doc(firestore, 'submissions', submissionId), {
            id: submissionId,
            courseId: params.courseId,
            moduleId: currentLesson.moduleId,
            lessonId: currentLesson.id,
            lessonTitle: currentLesson.title,
            studentId: user.uid,
            studentName: user.displayName || 'Learner',
            teacherId: course?.teacherId || 'system',
            externalUrl: submissionLink,
            notes: submissionNotes,
            status: 'pending',
            submittedAt: serverTimestamp()
        });

        toast({ title: 'Project Transmitted', description: 'Your deliverable is now awaiting review by the instructor.' });
        setCurrentSubmission({ status: 'pending', externalUrl: submissionLink, notes: submissionNotes });
        setSubmissionLink('');
        setSubmissionNotes('');
    } catch (err) {
        toast({ variant: 'destructive', title: 'Transmission Failed', description: 'Could not write submission to database.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const isLoading = courseLoading || modulesLoading || lessonsLoading || enrollLoading || !activeLessonId;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Calibrating Hub Elements...</p>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
        <div className="p-12 text-center text-muted-foreground">Course data or lesson missing. Ensure the URL is correct.</div>
    )
  }

  const isSubmitLocked = isCheckingSubmission || isSubmitting;
  const requireGradingLock = currentLesson.isAssignment && currentSubmission?.status !== 'passed';

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Link href={`/student/courses/${params.courseId}`} className="hover:text-accent transition-colors">Course Library</Link>
            <span>/</span>
            <span className="text-accent">{course.title}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter font-headline text-primary">{currentLesson.title}</h1>
        </div>
        <div className="flex items-center gap-3">
           <Badge variant="outline" className="h-8 px-4 font-bold border-accent/20 text-accent uppercase tracking-wider text-[10px]">
             {currentLesson.duration || "10"} MINS
           </Badge>
           {isCompleted && (
             <Badge className="h-8 px-4 font-bold bg-green-100 text-green-700 border-none flex items-center gap-1">
               <CheckCircle className="h-3 w-3" /> Completed
             </Badge>
           )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="sticky top-20 border-none shadow-2xl overflow-hidden rounded-[2rem] bg-primary ring-1 ring-white/10">
            <CardHeader className="bg-white/5 py-6 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/60 flex items-center gap-3">
                Curriculum Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-primary">
              <ScrollArea className="h-[70vh]">
                <Accordion type="multiple" defaultValue={modulesList?.map(m => `item-${m.id}`)} className="w-full">
                  {modulesList?.map((module) => (
                    <AccordionItem value={`item-${module.id}`} key={module.id} className="border-b border-white/5">
                      <AccordionTrigger className="px-6 py-5 font-bold text-[11px] uppercase tracking-wider text-primary-foreground/80 hover:no-underline hover:bg-white/5 transition-colors">
                        {module.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 bg-black/20">
                        <ul className="space-y-0.5">
                          {allLessons?.filter(l => l.moduleId === module.id).map(l => {
                            const lessonIsDone = enrollment?.completedLessons?.includes(l.id);
                            return (
                              <li key={l.id}>
                                <Link href={`/student/learn/${params.courseId}?lessonId=${l.id}`}>
                                  <div className={cn(
                                    "flex items-center gap-3 px-6 py-5 text-[11px] transition-all border-l-4",
                                    l.id === activeLessonId 
                                      ? "bg-accent/20 border-accent text-white font-black" 
                                      : "border-transparent hover:bg-white/5 text-primary-foreground/40"
                                  )}>
                                    {lessonIsDone ? (
                                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                                    ) : (
                                      <PlayCircle className={cn("h-4 w-4 shrink-0", l.id === activeLessonId ? "text-accent" : "opacity-30")} />
                                    )}
                                    <span className={cn("flex-1 truncate", lessonIsDone && "text-white/60")}>
                                        {l.title} 
                                        {l.isAssignment && <span className="text-[9px] bg-accent/30 text-accent font-bold px-1 rounded ml-2 uppercase">Project</span>}
                                    </span>
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

        {/* Main Vault Player Content */}
        <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
          <VideoPlayer url={currentLesson.youtubeVideoUrl || currentLesson.videoUrl} title={currentLesson.title} />

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-secondary/30">
             <CardContent className="p-8">
                 <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                     {currentLesson.content || "Instructor notes are not currently available for this module."}
                 </div>
             </CardContent>
          </Card>

          {/* Inline Assignment Logic */}
          {currentLesson.isAssignment && (
              <Card className="border-2 border-accent/20 rounded-3xl overflow-hidden bg-accent/5">
                  <CardHeader className="bg-accent/10 border-b border-accent/20">
                      <CardTitle className="text-accent flex items-center gap-2 font-headline uppercase tracking-tighter">
                          <UploadCloud className="h-6 w-6" /> Required Project Deliverable
                      </CardTitle>
                      <CardDescription>This module acts as an assessment checkpoint. You must verify your proof-of-work.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                      {isCheckingSubmission ? (
                          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-accent"/></div>
                      ) : currentSubmission ? (
                           <div className="space-y-4">
                               {currentSubmission.status === 'passed' ? (
                                  <Alert className="bg-green-500/10 border-green-500 text-green-700">
                                      <CheckCircle className="h-4 w-4 !text-green-700" />
                                      <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Instructor Reviewed</AlertTitle>
                                      <AlertDescription className="font-medium mt-1">Excellent work! Your project met all graduation parameters.</AlertDescription>
                                  </Alert>
                               ) : currentSubmission.status === 'needs_revision' ? (
                                  <Alert className="bg-destructive/10 border-destructive text-destructive">
                                      <Info className="h-4 w-4 !text-destructive" />
                                      <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Revision Requested</AlertTitle>
                                      <AlertDescription className="font-medium mt-1">Please update your code repository and resubmit based on mentor feedback.</AlertDescription>
                                  </Alert>
                               ) : (
                                  <Alert className="bg-amber-500/10 border-amber-500 text-amber-700">
                                      <Loader2 className="h-4 w-4 !text-amber-700 animate-spin" />
                                      <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Pending Review</AlertTitle>
                                      <AlertDescription className="font-medium mt-1">Your deliverable has been securely routed. The lock will lift once graded.</AlertDescription>
                                  </Alert>
                               )}

                               {/* Resubmission block if needed */}
                               {currentSubmission.status !== 'passed' && (
                                <form onSubmit={handleProjectSubmit} className="space-y-4 mt-6 pt-6 border-t border-dashed border-accent/20">
                                    <div className="space-y-2">
                                        <Label className="text-accent">Update Deliverable URL</Label>
                                        <Input value={submissionLink} onChange={e => setSubmissionLink(e.target.value)} required placeholder={currentSubmission.externalUrl || "https://github.com/..."} className="bg-background"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-accent">Update Notes</Label>
                                        <Textarea value={submissionNotes} onChange={e => setSubmissionNotes(e.target.value)} placeholder="Describe your fixes..." className="bg-background" />
                                    </div>
                                    <Button type="submit" disabled={isSubmitLocked || !submissionLink} className="bg-accent hover:bg-accent/90">
                                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Resubmit Protocol
                                    </Button>
                                </form>
                               )}
                           </div>
                      ) : (
                          <form onSubmit={handleProjectSubmit} className="space-y-6">
                              <div className="grid gap-6">
                                  <div className="space-y-2">
                                      <Label htmlFor="url" className="text-accent font-bold">External Resource Link</Label>
                                      <Input id="url" value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} placeholder="https://github.com/username/repo" required className="bg-background border-accent/20 focus-visible:ring-accent w-full" />
                                      <p className="text-[10px] text-muted-foreground uppercase">Provide a publicly accessible URL</p>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="notes" className="font-bold">Execution Notes (Optional)</Label>
                                      <Textarea id="notes" value={submissionNotes} onChange={(e) => setSubmissionNotes(e.target.value)} placeholder="Explain your design decisions or blockers." className="bg-background border-accent/20 focus-visible:ring-accent" />
                                  </div>
                              </div>
                              <Button type="submit" disabled={isSubmitLocked || !submissionLink} size="lg" className="w-full sm:w-auto font-black rounded-xl bg-accent hover:bg-accent/90 shadow-lg">
                                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Transmit Project"}
                              </Button>
                          </form>
                      )}
                  </CardContent>
              </Card>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between p-6 bg-card rounded-3xl border shadow-sm gap-4">
            <div className="flex gap-2">
              {navigation.prev ? (
                <Button asChild variant="outline" className="font-bold border-2 rounded-xl">
                  <Link href={`/student/learn/${params.courseId}?lessonId=${navigation.prev.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                  </Link>
                </Button>
              ) : <div />}
            </div>
            
            <div className="flex gap-2">
              {!isCompleted ? (
                <Button 
                  onClick={handleMarkComplete} 
                  disabled={isMarkingComplete || requireGradingLock}
                  className={cn(
                      "font-black px-8 h-12 rounded-xl shadow-lg transition-all",
                      requireGradingLock ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-105 active:scale-95"
                  )}
                >
                  {isMarkingComplete ? <Loader2 className="animate-spin h-4 w-4" /> : 
                   requireGradingLock ? <><Lock className="mr-2 h-4 w-4" /> Locked: Pending Grade</> : 
                   <><CheckCircle className="mr-2 h-4 w-4" /> Complete & Next</>}
                </Button>
              ) : (
                navigation.next ? (
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 h-12 rounded-xl shadow-lg transition-all hover:scale-105">
                    <Link href={`/student/learn/${params.courseId}?lessonId=${navigation.next.id}`}>
                      Next Phase <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="font-bold border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl" onClick={() => router.push(`/student/courses/${params.courseId}`)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Track Complete
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LearnPlayer() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-accent h-10 w-10"/></div>}>
      <LearnPlayerContent />
    </Suspense>
  )
}
