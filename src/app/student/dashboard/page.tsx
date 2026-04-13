
'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, FolderKanban, Star, ArrowRight, Loader2, PartyPopper, Play, Calendar, FileText, Bell } from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboardPage() {
  const { user, firestore, isLoading: authLoading } = useAuth();
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  
  // 1. Fetch Enrollments
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'enrollments'),
      where('studentId', '==', user.uid),
      where('status', '==', 'active')
    );
  }, [firestore, user]);

  const { data: enrollments, isLoading: enrollLoading } = useCollection(enrollmentsQuery);

  // 2. Fetch Live Broadcasts
  const broadcastsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'broadcasts'), limit(3));
  }, [firestore]);

  const { data: broadcasts, isLoading: broadcastsLoading } = useCollection(broadcastsQuery);

  // 3. Fetch Assignments
  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assignments'), limit(3));
  }, [firestore]);

  const { data: assignments, isLoading: assignmentsLoading } = useCollection(assignmentsQuery);

  useEffect(() => {
    async function loadCourseDetails() {
      if (!enrollments || !firestore) return;
      
      const details = await Promise.all(enrollments.map(async (e) => {
        const cSnap = await getDoc(doc(firestore, 'courses', e.courseId));
        return { 
          id: e.courseId, 
          ...cSnap.data(), 
          progress: e.progress || 0 
        };
      }));
      setActiveCourses(details);
    }
    loadCourseDetails();
  }, [enrollments, firestore]);

  if (authLoading || enrollLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Check if they have zero active/paid enrollments
  if (enrollments && enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 p-4">
        <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center border-4 border-destructive/20 mb-4 animate-pulse">
           <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter text-center">Dashboard Locked</h1>
        <p className="max-w-lg text-center text-muted-foreground font-medium text-lg leading-relaxed">
           You have not completed any course enrollments. You must enroll in a course and finalize your MTN MoMo payment to unlock your student profile, lab schedules, and coursework.
        </p>
        <Button asChild size="lg" className="mt-8 h-14 px-8 font-black text-lg uppercase tracking-widest bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20">
             <NextLink href="/courses">Go to Catalog & Enroll</NextLink>
        </Button>
      </div>
    );
  }

  const completedCount = activeCourses.filter(c => c.progress >= 100).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Welcome Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-primary text-primary-foreground p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/5 animate-slide-up-fade opacity-0 animation-delay-100">
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <PartyPopper className="text-accent h-6 w-6" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter font-headline">Welcome back, {user?.displayName}!</h1>
            </div>
            <p className="text-neutral-400 max-w-xl text-lg font-medium leading-relaxed">
              You are part of the Fusion8 Elite cohort. Continue building your engineering venture.
            </p>
        </div>
         <div className="flex gap-3 z-10">
            <Button asChild variant="outline" className="bg-white/5 border-white/10 text-white rounded-2xl h-14 px-6 font-bold hover:bg-white/10">
                <NextLink href="/student/notifications">
                    <Bell className="h-5 w-5" />
                </NextLink>
            </Button>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 px-8 rounded-2xl shadow-xl shadow-accent/20 group">
                <NextLink href="/courses">
                Catalog Explorer <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </NextLink>
            </Button>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 -mr-20 -mt-20 rounded-full blur-[100px]" />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-slide-up-fade opacity-0 animation-delay-200">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Curriculum</CardTitle>
            <BookOpen className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{enrollments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Milestones</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Teams</CardTitle>
                <FolderKanban className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black font-headline">Incubator</div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skill Rank</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black text-green-600">Verified</div>
            </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed: Resume Engineering */}
        <div className="lg:col-span-2 space-y-6 animate-slide-up-fade opacity-0 animation-delay-300">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">Resume Engineering</h2>
                <NextLink href="/student/courses" className="text-xs font-bold text-accent hover:underline uppercase tracking-widest">See all</NextLink>
            </div>
            
            {activeCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
                {activeCourses.slice(0, 2).map((course) => {
                const courseImage = course.thumbnail || PlaceHolderImages[0].imageUrl;
                return (
                    <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-2xl transition-all border-none shadow-lg group rounded-3xl bg-card">
                    <div className="relative aspect-video">
                        <img
                        src={courseImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-5 right-4">
                        <div className="text-white font-black text-xl tracking-tight leading-tight line-clamp-1">{course.title}</div>
                        </div>
                    </div>
                    <CardContent className="space-y-4 pt-6 pb-6 px-6">
                        <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            <span>Trajectory</span>
                            <span className="text-accent">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5 bg-secondary rounded-full" />
                        </div>
                        <Button asChild variant="default" className="w-full font-black h-10 rounded-xl bg-primary hover:bg-accent transition-colors">
                        <NextLink href={`/student/courses/${course.id}`}>
                            Open Classroom <Play className="ml-2 h-3 w-3 fill-current" />
                        </NextLink>
                        </Button>
                    </CardContent>
                    </Card>
                )
                })}
            </div>
            ) : (
            <div className="p-4 bg-secondary/20 rounded-[2.5rem] border-2 border-dashed border-border">
                <EmptyState
                icon={BookOpen}
                title="Your Path is Ready"
                description="Enroll in a course to start building your portfolio."
                action={{ text: 'Explore Catalog', href: '/courses' }}
                />
            </div>
            )}
        </div>

        {/* Sidebar: Dispatch & Deliverables */}
        <div className="space-y-8 animate-slide-up-fade opacity-0 animation-delay-400">
            {/* Lab Dispatch (Live Sessions) */}
            <div className="space-y-4">
                <h3 className="text-lg font-black font-headline tracking-tighter uppercase flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Lab Dispatch
                </h3>
                <Card className="border-none shadow-xl bg-accent text-accent-foreground rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                        {broadcasts && broadcasts.length > 0 ? (
                            <div className="divide-y divide-white/10">
                                {broadcasts.map(b => (
                                    <div key={b.id} className="p-5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/student/live`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-black text-sm uppercase leading-tight">{b.title}</p>
                                            <Badge variant="outline" className="bg-white/10 border-none text-[10px] h-5">{b.time}</Badge>
                                        </div>
                                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Yaoundé Lab 01 • Live Demonstration</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center opacity-60 italic text-sm">No labs scheduled today.</div>
                        )}
                        <Button asChild variant="ghost" className="w-full h-12 rounded-none bg-white/5 hover:bg-white/10 font-bold text-xs">
                            <NextLink href="/student/live">View Full Schedule <ArrowRight className="ml-2 h-3 w-3"/></NextLink>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Deliverable Queue */}
            <div className="space-y-4">
                <h3 className="text-lg font-black font-headline tracking-tighter uppercase flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Deliverables
                </h3>
                <Card className="border-none shadow-xl bg-secondary/50 rounded-3xl">
                    <CardContent className="p-5 space-y-4">
                        {assignments && assignments.length > 0 ? (
                            assignments.map(a => (
                                <div key={a.id} className="p-4 bg-background rounded-2xl border border-border/50 flex justify-between items-center group hover:border-accent transition-colors cursor-pointer" onClick={() => window.location.href = `/student/assignments`}>
                                    <div>
                                        <p className="font-bold text-sm leading-tight group-hover:text-accent transition-colors">{a.title}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono mt-1">DUE: {a.dueDate || 'Flexible'}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-xs text-muted-foreground italic">Your queue is clear.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
