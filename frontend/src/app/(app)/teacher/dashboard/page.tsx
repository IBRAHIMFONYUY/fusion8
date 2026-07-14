'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, Activity, FileText, ArrowRight, Loader2, ShieldCheck, Clock, CheckCircle2, Edit3, Plus, UserCheck, Layout, BarChart, AlertCircle, Calendar, HeartHandshake, Sparkles, Video, TrendingUp } from 'lucide-react'
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { firestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function sessionStart(dateStr: any, time: string): Date {
  const day = new Date(dateStr);
  const [hours, minutes] = (time || '00:00').split(':').map(Number);
  day.setHours(hours || 0, minutes || 0, 0, 0);
  return day;
}

export default function TeacherDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    studentCount: 0,
    courseCount: 0,
    publishedCount: 0,
    pendingCount: 0,
    draftCount: 0,
    engagementRate: '94%'
  });
  const [matricule, setMatricule] = useState<string | null>(null);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [mentorSchedule, setMentorSchedule] = useState<any[]>([]);
  const [avgCompletion, setAvgCompletion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !firestore) return;
      try {
        setLoading(true);
        
        // 1. Fetch user profile for matricule
        const userDoc = await getDoc(doc(firestore, 'users', user.uid)).catch(err => {
            if (err.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${user.uid}`,
                    operation: 'get',
                }));
            }
            throw err;
        });

        if (userDoc.exists()) {
            setMatricule(userDoc.data().matricule);
        }

        // 2. Fetch all courses owned by teacher with resilient querying
        let courses: any[] = [];
        try {
            const courseQuery = query(
                collection(firestore, 'courses'), 
                where('teacherId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const courseSnap = await getDocs(courseQuery);
            courses = courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexError: any) {
            // Index building or missing index fallback
            const courseQueryFallback = query(
                collection(firestore, 'courses'), 
                where('teacherId', '==', user.uid)
            );
            const courseSnap = await getDocs(courseQueryFallback).catch(err => {
                if (err.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: 'courses',
                        operation: 'list',
                    }));
                }
                throw err;
            });
            courses = (courseSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[])
                .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
        
        setRecentCourses(courses);

        // Mentees: students whose mentorId equals this teacher's uid
        try {
            const menteeSnap = await getDocs(
                query(collection(firestore, 'users'), where('mentorId', '==', user.uid)),
            );
            setMentees(menteeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch {
            // permission or index may not be ready; ignore
        }

        // Today's/upcoming practical sessions
        try {
            const broadcastSnap = await getDocs(
                query(collection(firestore, 'broadcasts'), where('teacherId', '==', user.uid))
            );
            const allBroadcasts = broadcastSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
            const upcoming = allBroadcasts
                .filter((b) => sessionStart(b.date, b.time).getTime() > Date.now() - 3 * 60 * 60 * 1000)
                .sort((a, b) => sessionStart(a.date, a.time).getTime() - sessionStart(b.date, b.time).getTime())
                .slice(0, 3);
            setUpcomingSessions(upcoming);
        } catch {
            // ignore
        }

        // Ungraded submissions awaiting review
        try {
            const subSnap = await getDocs(
                query(collection(firestore, 'submissions'), where('teacherId', '==', user.uid), where('status', '==', 'pending'))
            );
            setPendingReviewCount(subSnap.size);
        } catch {
            // ignore
        }

        // Upcoming mentoring sessions
        try {
            const sessionSnap = await getDocs(
                query(collection(firestore, 'mentor_sessions'), where('mentorId', '==', user.uid), where('status', '==', 'scheduled'), orderBy('scheduledAt', 'asc'))
            );
            setMentorSchedule(sessionSnap.docs.slice(0, 2).map((d) => ({ id: d.id, ...d.data() })));
        } catch {
            // ignore
        }

        // Average completion across active enrollments in this teacher's courses
        if (courses.length > 0) {
            try {
                const ids = courses.map((c: any) => c.id).slice(0, 30);
                const enrollSnap = await getDocs(
                    query(collection(firestore, 'enrollments'), where('courseId', 'in', ids), where('status', '==', 'active'))
                );
                const progresses = enrollSnap.docs.map((d) => d.data().progress || 0);
                if (progresses.length > 0) {
                    setAvgCompletion(Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length));
                }
            } catch {
                // ignore
            }
        }

        // 3. Calculate pipeline metrics
        const published = courses.filter((c: any) => c.status === 'published').length;
        const pending = courses.filter((c: any) => c.status === 'pending').length;
        const drafts = courses.filter((c: any) => !c.status || c.status === 'draft').length;
        const studentCount = courses.reduce((acc: number, c: any) => acc + (c.enrolledCount || 0), 0);

        setStats({
          courseCount: courses.length,
          publishedCount: published,
          pendingCount: pending,
          draftCount: drafts,
          studentCount: studentCount,
          engagementRate: '94%'
        });
      } catch (error: any) {
        // Handled via emitter
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) loadDashboardData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">Accessing Technical Vault...</p>
      </div>
    );
  }

  // ── "What should I do next?" priority banner ──────────────────────────────
  const nextSessionSoon = upcomingSessions[0]
    && sessionStart(upcomingSessions[0].date, upcomingSessions[0].time).getTime() - Date.now() < 60 * 60 * 1000;

  const priority: { icon: any; text: string; href?: string } = pendingReviewCount > 0
    ? { icon: AlertCircle, text: `${pendingReviewCount} submission${pendingReviewCount !== 1 ? 's' : ''} awaiting review.`, href: '/teacher/gradebook' }
    : nextSessionSoon
    ? { icon: Video, text: `"${upcomingSessions[0].title}" starts within the hour.`, href: '/teacher/schedule' }
    : { icon: Sparkles, text: 'All clear — no reviews pending.' };

  return (
    <div className="space-y-8 pb-12">
      {/* ── Priority Banner ───────────────────────────────────────────── */}
      {priority.href ? (
        <Link href={priority.href} className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-5 py-3.5 hover:bg-accent/10 transition-colors">
          <priority.icon className="h-4.5 w-4.5 text-accent shrink-0" />
          <p className="text-sm font-semibold flex-1">{priority.text}</p>
          <ArrowRight className="h-4 w-4 text-accent shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-5 py-3.5">
          <priority.icon className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
          <p className="text-sm font-semibold flex-1">{priority.text}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-slide-up-fade opacity-0 animation-delay-100">
        <div>
            <h1 className="text-4xl font-black tracking-tighter font-headline text-primary uppercase">Instructor Console</h1>
            <p className="text-muted-foreground mt-1 font-medium">Manage your curricula and track your student engineering trajectories.</p>
        </div>
        <div className="flex items-center gap-3">
            {matricule && (
                <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3 shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-accent tracking-widest leading-none">Matricule ID</span>
                        <span className="font-mono text-sm font-black mt-1 leading-none">{matricule}</span>
                    </div>
                </div>
            )}
            <Button asChild className="bg-primary hover:bg-accent text-white font-black h-12 px-6 rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs">
                <Link href="/teacher/courses/builder">
                    <Plus className="mr-2 h-5 w-5" /> New Track
                </Link>
            </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 animate-slide-up-fade opacity-0 animation-delay-200">
        <Card className="border-none shadow-xl bg-accent text-accent-foreground rounded-[2rem] overflow-hidden relative group transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Work In Progress</CardTitle>
            <Edit3 className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black font-headline tracking-tighter">{stats.draftCount}</div>
            <p className="text-xs opacity-70 mt-1 font-bold italic uppercase">Saved Drafts</p>
          </CardContent>
          <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="h-20 w-20" />
          </div>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Review</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-headline tracking-tighter">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1 font-bold uppercase">Pending</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Catalog</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-headline tracking-tighter">{stats.publishedCount}</div>
            <p className="text-xs text-muted-foreground mt-1 font-bold uppercase">Visible</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Audience</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-headline tracking-tighter">{stats.studentCount}</div>
            <p className="text-xs text-muted-foreground mt-1 font-bold uppercase">Active Students</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm ring-1 ring-black/5 rounded-[2rem] transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course Progress</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-headline tracking-tighter">{avgCompletion !== null ? `${avgCompletion}%` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1 font-bold uppercase">Avg. Completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 animate-slide-up-fade opacity-0 animation-delay-300">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">Curriculum Tracks</h2>
                <Button variant="ghost" asChild className="text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/10">
                    <Link href="/teacher/courses">View All <ArrowRight className="ml-2 h-3 w-3"/></Link>
                </Button>
            </div>
            
            <div className="grid gap-6">
                {recentCourses.length > 0 ? recentCourses.map(course => {
                    const isDraft = !course.status || course.status === 'draft';
                    return (
                        <Card key={course.id} className={`overflow-hidden border-none shadow-lg transition-all hover:shadow-2xl rounded-[2rem] group ${isDraft ? 'bg-accent/5 ring-2 ring-accent/20' : 'bg-card'}`}>
                            <div className="flex flex-col sm:flex-row">
                                <div className="sm:w-64 bg-secondary/30 relative aspect-video sm:aspect-auto overflow-hidden">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Layout className="h-12 w-12 text-muted-foreground/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <Badge variant={
                                            course.status === 'published' ? 'default' : 
                                            course.status === 'pending' ? 'secondary' : 
                                            'destructive'
                                        } className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none shadow-lg ${isDraft ? 'bg-accent text-white' : ''}`}>
                                            {isDraft ? 'WORK IN PROGRESS' : course.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-black leading-none tracking-tighter uppercase group-hover:text-accent transition-colors">{course.title || 'Untitled Track'}</h3>
                                            <span className="text-[10px] font-mono text-muted-foreground font-bold">#{course.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 italic mb-6 font-medium">"{course.description || 'No summary provided.'}"</p>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 bg-secondary/30 rounded-2xl flex items-center gap-3">
                                                <div className="p-2 bg-accent/10 rounded-lg"><Users className="h-4 w-4 text-accent" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Learners</span>
                                                    <span className="text-sm font-black mt-1 leading-none">{course.enrolledCount || 0}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-secondary/30 rounded-2xl flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg"><Clock className="h-4 w-4 text-primary" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Updated</span>
                                                    <span className="text-sm font-black mt-1 leading-none">{new Date(course.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button asChild className="flex-1 bg-primary hover:bg-accent text-white font-black h-12 rounded-xl shadow-md transition-all uppercase tracking-widest text-xs">
                                            <Link href={`/teacher/courses/builder?id=${course.id}`}>
                                                <Edit3 className="mr-2 h-4 w-4" /> Edit Curriculum
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" className="flex-1 font-black h-12 rounded-xl border-2 uppercase tracking-widest text-xs hover:bg-secondary">
                                            <Link href={`/teacher/courses/${course.id}/roster`}>
                                                <UserCheck className="mr-2 h-4 w-4" /> Student Roster
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                }) : (
                    <div className="p-20 text-center border-4 border-dashed rounded-[3rem] bg-secondary/10">
                        <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-muted-foreground uppercase tracking-tighter">Workspace Ready</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-2 font-medium">Start by creating your first technical track to begin recruiting the next generation of engineers.</p>
                        <Button asChild className="mt-8 bg-accent hover:bg-accent/90 px-10 h-14 rounded-2xl font-black uppercase tracking-widest">
                            <Link href="/teacher/courses/builder">Initialize New Track</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-8 animate-slide-up-fade opacity-0 animation-delay-400">
            <Card className="border-none shadow-2xl bg-primary text-primary-foreground rounded-[2.5rem] overflow-hidden relative border border-white/5">
                <CardHeader className="relative z-10 pb-2">
                    <CardTitle className="text-xl font-black font-headline tracking-tighter uppercase">Professional Profile</CardTitle>
                    <CardDescription className="text-neutral-400 font-medium italic">Verified identity & credentials.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                    <div className="p-5 bg-white/5 rounded-3xl border border-black/[0.08] flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20 overflow-hidden shadow-xl">
                            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="font-black text-lg leading-tight uppercase tracking-tighter">{user?.displayName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-accent text-accent-foreground text-[8px] h-4 border-none font-black uppercase">Senior Lecturer</Badge>
                            </div>
                        </div>
                    </div>
                    <Button asChild variant="secondary" className="w-full font-black h-14 rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:bg-white transition-colors">
                        <Link href="/teacher/profile">Update Official ID</Link>
                    </Button>
                </CardContent>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 -mr-20 -mt-20 rounded-full blur-3xl" />
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-accent" />
                        My Mentees
                    </CardTitle>
                    <CardDescription>Students assigned to you by an administrator.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    {mentees.length > 0 ? (
                        <div className="space-y-2">
                            {mentees.map((m) => (
                                <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`}
                                            alt={m.displayName}
                                            className="h-9 w-9 rounded-full object-cover shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">{m.displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                                        </div>
                                    </div>
                                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                                        <a href={`mailto:${m.email}`}>Email</a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">
                            No mentees assigned yet. An admin can assign students to you from the User Management page.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <HeartHandshake className="h-5 w-5 text-accent" />
                        Mentoring Schedule
                    </CardTitle>
                    <CardDescription>Your next mentoring sessions.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    {mentorSchedule.length > 0 ? (
                        <div className="space-y-2">
                            {mentorSchedule.map((s) => (
                                <div key={s.id} className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                                    <p className="font-semibold text-sm">{s.studentName || 'Student'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {s.scheduledAt ? format(new Date(s.scheduledAt), 'EEE, MMM d · h:mm a') : 'Scheduled'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">No mentoring sessions scheduled.</p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-black font-headline tracking-tighter uppercase flex items-center gap-3">
                    <BarChart className="h-5 w-5 text-accent" />
                    Operational Control
                </h3>
                <Card className="border-none shadow-xl bg-secondary/50 rounded-[2.5rem] p-2">
                    <CardContent className="space-y-3 p-4">
                        <Link href="/teacher/schedule" className="p-5 bg-background rounded-[1.5rem] border border-border/50 flex justify-between items-center group hover:border-accent transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent/10 rounded-2xl group-hover:scale-110 transition-transform"><Calendar className="h-5 w-5 text-accent" /></div>
                                <div>
                                    <p className="font-black text-xs uppercase tracking-widest">
                                        {upcomingSessions.length > 0 ? `${upcomingSessions.length} Upcoming Session${upcomingSessions.length !== 1 ? 's' : ''}` : 'No Sessions Scheduled'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase italic opacity-60">
                                        {upcomingSessions[0] ? `Next: ${upcomingSessions[0].title}` : 'Schedule a broadcast'}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                        </Link>
                        <Link href="/teacher/gradebook" className="p-5 bg-background rounded-[1.5rem] border border-border/50 flex justify-between items-center group hover:border-primary transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform"><FileText className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-black text-xs uppercase tracking-widest">
                                        {pendingReviewCount > 0 ? `${pendingReviewCount} Awaiting Review` : 'Gradebook Clear'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase italic opacity-60">Review deliverables</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}