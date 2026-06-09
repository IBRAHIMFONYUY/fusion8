'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, CheckCircle, Flame, ClipboardList, ArrowRight,
  Loader2, Play, Calendar, FileText, Bell, Rocket, Trophy,
  Clock, AlertCircle,
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, where, doc, getDoc, updateDoc,
  limit, orderBy, serverTimestamp,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { deriveAchievements } from '@/types';

// ── Streak tracking ───────────────────────────────────────────────────────────
async function updateAndGetStreak(db: Firestore, uid: string): Promise<number> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const data = snap.data() || {};

    const today = new Date().toDateString();
    if (data.lastActiveDate === today) return data.currentStreak || 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newStreak =
      data.lastActiveDate === yesterday.toDateString()
        ? (data.currentStreak || 0) + 1
        : 1;

    await updateDoc(userRef, {
      lastActiveDate: today,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, data.longestStreak || 0),
    });
    return newStreak;
  } catch {
    return 0;
  }
}

// ── Urgency helper ────────────────────────────────────────────────────────────
function dueDateUrgency(dueDate: any): 'overdue' | 'soon' | 'normal' {
  if (!dueDate) return 'normal';
  const due = new Date(dueDate);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 2) return 'soon';
  return 'normal';
}

// ── Onboarding empty state ────────────────────────────────────────────────────
function OnboardingState({ name }: { name: string | null }) {
  const firstName = name?.split(' ')[0] || 'Engineer';
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
          <Rocket className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Welcome to Fusion8, {firstName}.
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          You're one enrollment away from unlocking your full dashboard — lab schedules,
          assignments, projects, and your engineering portfolio.
        </p>
      </div>

      {/* Steps */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            step: '01',
            icon: BookOpen,
            title: 'Choose a Course',
            desc: 'Browse the catalog and pick an engineering track that matches your goals.',
          },
          {
            step: '02',
            icon: CheckCircle,
            title: 'Complete Enrollment',
            desc: 'Finalize your registration with MTN MoMo to activate your student access.',
          },
          {
            step: '03',
            icon: Trophy,
            title: 'Start Building',
            desc: 'Access live labs, assignments, and the innovation hub from day one.',
          },
        ].map((item) => (
          <div
            key={item.step}
            className="border border-border rounded-2xl p-6 text-center space-y-3 bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
              <item.icon className="h-5 w-5 text-accent" />
            </div>
            <span className="text-[10px] font-bold text-accent tracking-widest uppercase">
              Step {item.step}
            </span>
            <h3 className="font-semibold text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          asChild
          size="lg"
          className="h-12 px-10 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-xl shadow-accent/20"
        >
          <NextLink href="/courses">
            Browse Engineering Catalog <ArrowRight className="ml-2 h-4 w-4" />
          </NextLink>
        </Button>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const { user, firestore, isLoading: authLoading } = useAuth();
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);

  // Enrollments
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'enrollments'),
      where('studentId', '==', user.uid),
      where('status', '==', 'active')
    );
  }, [firestore, user]);
  const { data: enrollments, isLoading: enrollLoading } = useCollection(enrollmentsQuery);

  // Broadcasts
  const broadcastsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'broadcasts'), limit(3));
  }, [firestore]);
  const { data: broadcasts } = useCollection(broadcastsQuery);

  // Assignments
  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assignments'), limit(5));
  }, [firestore]);
  const { data: assignments } = useCollection(assignmentsQuery);

  // Projects (for achievements)
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'projects'),
      where(`members.${user.uid}`, '!=', null)
    );
  }, [firestore, user]);
  const { data: myProjects } = useCollection(projectsQuery);

  // Streak tracking — update on mount
  useEffect(() => {
    if (user && firestore) {
      updateAndGetStreak(firestore, user.uid).then(setStreak);
    }
  }, [user, firestore]);

  // Load course details + compute lessons completed
  useEffect(() => {
    async function loadCourseDetails() {
      if (!enrollments || !firestore) return;
      const details = await Promise.all(
        enrollments.map(async (e: any) => {
          const snap = await getDoc(doc(firestore, 'courses', e.courseId));
          return { id: e.courseId, ...snap.data(), progress: e.progress || 0, completedLessons: e.completedLessons || [] };
        })
      );
      setActiveCourses(details);
      const total = details.reduce((sum, c) => sum + (c.completedLessons?.length || 0), 0);
      setLessonsCompleted(total);
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

  // First-run onboarding (replaces "Dashboard Locked")
  if (enrollments && enrollments.length === 0) {
    return <OnboardingState name={user?.displayName ?? null} />;
  }

  const pendingAssignments = assignments?.filter(
    (a: any) => a.status !== 'Submitted' && a.status !== 'Graded'
  ) ?? [];
  const completedCourses = activeCourses.filter(c => c.progress >= 100);

  const achievements = deriveAchievements({
    enrollmentCount: enrollments?.length ?? 0,
    lessonsCompleted,
    assignmentsSubmitted: (assignments?.length ?? 0) - pendingAssignments.length,
    projectCount: myProjects?.length ?? 0,
    hasCompletedCourse: completedCourses.length > 0,
    streak,
  }).filter(a => a.earned);

  const resumeCourse = activeCourses.find(c => c.progress < 100 && c.progress > 0)
    ?? activeCourses.find(c => c.progress < 100)
    ?? activeCourses[0];

  const firstName = user?.displayName?.split(' ')[0] || 'Engineer';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7 pb-12">

      {/* ── Welcome Header ────────────────────────────────────────────── */}
      <div className="bg-primary text-white rounded-2xl p-7 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <p className="text-neutral-400 text-sm mb-1">{greeting}</p>
            <h1 className="text-2xl md:text-3xl font-bold font-headline leading-tight">
              {firstName}, let's build today.
            </h1>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-300">
                  {streak}-day streak
                </span>
                {streak >= 7 && (
                  <span className="text-xs text-orange-400/70 font-medium">· Keep it going!</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2.5 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white/10 border-black/[0.12] text-white hover:bg-white/20 h-9 w-9 p-0 rounded-lg"
            >
              <NextLink href="/student/notifications">
                <Bell className="h-4 w-4" />
              </NextLink>
            </Button>
            {resumeCourse && (
              <Button
                asChild
                size="sm"
                className="bg-accent hover:bg-accent/90 text-white font-semibold h-9 px-5 rounded-lg text-sm"
              >
                <NextLink href={`/student/courses/${resumeCourse.id}`}>
                  <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                  Resume Learning
                </NextLink>
              </Button>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/8 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      </div>

      {/* ── KPI Cards (real data only) ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Courses',
            value: enrollments?.length ?? 0,
            icon: BookOpen,
            iconColor: 'text-accent',
            bgColor: 'bg-accent/10',
          },
          {
            label: 'Lessons Completed',
            value: lessonsCompleted,
            icon: CheckCircle,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            label: 'Day Streak',
            value: streak,
            icon: Flame,
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-100',
          },
          {
            label: 'Pending Tasks',
            value: pendingAssignments.length,
            icon: ClipboardList,
            iconColor: pendingAssignments.length > 0 ? 'text-amber-600' : 'text-muted-foreground',
            bgColor: pendingAssignments.length > 0 ? 'bg-amber-100' : 'bg-secondary',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-3xl font-extrabold font-headline">{stat.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-7">

        {/* Left: Courses + Achievements */}
        <div className="lg:col-span-2 space-y-7">

          {/* Continue Learning */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-headline">Continue Learning</h2>
              <NextLink
                href="/student/courses"
                className="text-xs font-semibold text-accent hover:underline"
              >
                See all
              </NextLink>
            </div>
            {activeCourses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeCourses.slice(0, 2).map((course) => (
                  <Card
                    key={course.id}
                    className="overflow-hidden border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300 group bg-card rounded-2xl"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={
                          course.thumbnail ||
                          'https://placehold.co/600x340/1b2444/E8461E?text=Fusion8'
                        }
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-white font-semibold text-sm line-clamp-1 leading-snug">
                          {course.title}
                        </p>
                      </div>
                      {course.progress >= 100 && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            Complete
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                          <span>Progress</span>
                          <span className="text-accent font-semibold">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5 rounded-full" />
                      </div>
                      <Button
                        asChild
                        className="w-full h-9 bg-primary hover:bg-accent text-white font-semibold text-sm rounded-xl transition-colors"
                      >
                        <NextLink href={`/student/courses/${course.id}`}>
                          {course.progress === 0 ? 'Start Course' : course.progress >= 100 ? 'Review Course' : 'Resume'}
                          <Play className="ml-2 h-3 w-3 fill-current" />
                        </NextLink>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm">Enroll in a course to start tracking progress.</p>
                <Button asChild size="sm" className="mt-4 bg-accent text-white rounded-lg">
                  <NextLink href="/courses">Explore Catalog</NextLink>
                </Button>
              </div>
            )}
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div>
              <h2 className="text-lg font-bold font-headline mb-4">Your Achievements</h2>
              <div className="flex flex-wrap gap-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    title={a.description}
                    className="flex items-center gap-2 border border-border bg-card rounded-xl px-3 py-2 text-sm font-medium hover:border-accent/40 transition-colors cursor-default"
                  >
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs font-semibold">{a.name}</span>
                  </div>
                ))}
                <NextLink
                  href="/student/profile"
                  className="flex items-center gap-1.5 border border-dashed border-border rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors"
                >
                  View Portfolio <ArrowRight className="h-3 w-3" />
                </NextLink>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">

          {/* Lab Dispatch */}
          <div>
            <h3 className="text-base font-bold font-headline flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-accent" />
              Lab Dispatch
            </h3>
            <Card className="border border-border bg-accent text-white rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {broadcasts && broadcasts.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {broadcasts.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-4 hover:bg-black/[0.05] transition-colors cursor-pointer"
                        onClick={() => (window.location.href = '/student/live')}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="font-semibold text-sm leading-tight line-clamp-1">{b.title}</p>
                          <Badge
                            variant="outline"
                            className="bg-white/15 border-none text-[10px] shrink-0"
                          >
                            {b.time}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
                          Bamenda Lab 01 · Live
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-white/60">
                    No labs scheduled today.
                  </div>
                )}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full h-10 rounded-none bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  <NextLink href="/student/live">
                    Full Schedule <ArrowRight className="ml-1.5 h-3 w-3" />
                  </NextLink>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deliverables */}
          <div>
            <h3 className="text-base font-bold font-headline flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              Deliverables
            </h3>
            <Card className="border border-border bg-secondary/30 rounded-2xl">
              <CardContent className="p-4 space-y-2">
                {assignments && assignments.length > 0 ? (
                  assignments.slice(0, 4).map((a: any) => {
                    const urgency = dueDateUrgency(a.dueDate);
                    const isSubmitted = a.status === 'Submitted' || a.status === 'Graded';
                    return (
                      <div
                        key={a.id}
                        className="p-3 bg-background rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer flex items-start justify-between gap-2"
                        onClick={() => (window.location.href = '/student/assignments')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-snug line-clamp-1">{a.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {urgency === 'overdue' && !isSubmitted && (
                              <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-semibold">
                                <AlertCircle className="h-3 w-3" /> Overdue
                              </span>
                            )}
                            {urgency === 'soon' && !isSubmitted && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                                <Clock className="h-3 w-3" /> Due soon
                              </span>
                            )}
                            {isSubmitted && (
                              <span className="text-[10px] text-green-600 font-semibold">Submitted</span>
                            )}
                            {!isSubmitted && urgency === 'normal' && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {a.dueDate || 'Open'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Queue is clear.
                  </div>
                )}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full h-9 text-xs font-semibold text-accent hover:text-accent"
                >
                  <NextLink href="/student/assignments">
                    View All Assignments <ArrowRight className="ml-1 h-3 w-3" />
                  </NextLink>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
