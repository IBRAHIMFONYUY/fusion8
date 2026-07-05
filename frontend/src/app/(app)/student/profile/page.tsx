'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, CheckCircle, Flame, ClipboardList, ArrowRight,
  Loader2, Calendar, Trophy, Clock, Rocket, Star, TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { deriveAchievements, ACHIEVEMENT_DEFINITIONS } from '@/types';

export default function StudentProfilePage() {
  const { user, firestore, isLoading: authLoading } = useAuth();
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);

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

  // Assignments
  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'assignments'), where('studentId', '==', user.uid));
  }, [firestore, user]);
  const { data: assignments } = useCollection(assignmentsQuery);

  // Projects (member of)
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'), where(`members.${user.uid}`, '!=', null));
  }, [firestore, user]);
  const { data: myProjects } = useCollection(projectsQuery);

  // User profile (streak, xp)
  useEffect(() => {
    if (!user || !firestore) return;
    getDoc(doc(firestore, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfileData(snap.data());
    });
  }, [user, firestore]);

  // Course details + lesson count
  useEffect(() => {
    async function loadCourses() {
      if (!enrollments || !firestore) return;
      const details = await Promise.all(
        enrollments.map(async (e: any) => {
          const snap = await getDoc(doc(firestore, 'courses', e.courseId));
          return {
            id: e.courseId,
            ...snap.data(),
            progress: e.progress || 0,
            completedLessons: e.completedLessons || [],
          };
        })
      );
      setActiveCourses(details);
      setLessonsCompleted(details.reduce((sum, c) => sum + (c.completedLessons?.length || 0), 0));
    }
    loadCourses();
  }, [enrollments, firestore]);

  if (authLoading || enrollLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Derived data
  const submittedAssignments = assignments?.filter(
    (a: any) => a.status === 'Submitted' || a.status === 'Graded'
  ) ?? [];
  const pendingAssignments = assignments?.filter(
    (a: any) => a.status !== 'Submitted' && a.status !== 'Graded'
  ) ?? [];
  const completedCourses = activeCourses.filter(c => c.progress >= 100);
  const leadProjects = myProjects?.filter((p: any) => p.studentLeadId === user?.uid) ?? [];
  const memberProjects = myProjects?.filter((p: any) => p.studentLeadId !== user?.uid) ?? [];

  const streak = profileData?.currentStreak || 0;
  const longestStreak = profileData?.longestStreak || 0;

  const achievements = deriveAchievements({
    enrollmentCount: enrollments?.length ?? 0,
    lessonsCompleted,
    assignmentsSubmitted: submittedAssignments.length,
    projectCount: myProjects?.length ?? 0,
    hasCompletedCourse: completedCourses.length > 0,
    streak,
  });
  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  // XP: computed from activity (persisted xp used if available)
  const computedXp =
    profileData?.xp ??
    lessonsCompleted * 50 +
    submittedAssignments.length * 100 +
    (myProjects?.length ?? 0) * 200 +
    earnedAchievements.length * 75;
  const xpLevel = Math.floor(computedXp / 500) + 1;
  const xpProgress = ((computedXp % 500) / 500) * 100;

  const firstName = user?.displayName?.split(' ')[0] || 'Engineer';
  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const projectStatusLabel = (status: string) =>
    status === 'in_progress' ? 'Active' : status === 'recruiting' ? 'Recruiting' : 'Done';
  const projectStatusClass = (status: string) =>
    status === 'completed'
      ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
      : status === 'in_progress'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400';

  return (
    <div className="space-y-7 pb-12">

      {/* ── Profile Hero ──────────────────────────────────────────────── */}
      <div className="relative bg-primary text-white rounded-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/8 rounded-full -ml-14 -mb-14 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-7 md:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-white/20">
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 bg-accent rounded-2xl flex items-center justify-center ring-4 ring-white/20">
                  <span className="text-3xl font-extrabold font-headline">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-accent text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg border-2 border-primary leading-none">
                Lv.{xpLevel}
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold font-headline leading-tight">
                  {user?.displayName || 'Fusion8 Engineer'}
                </h1>
                <span className="bg-accent/20 border border-accent/40 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider text-orange-300">
                  Student
                </span>
              </div>
              <p className="text-neutral-400 text-sm font-medium truncate">{user?.email}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                {joinDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {joinDate}
                  </span>
                )}
                {streak > 0 && (
                  <span className="flex items-center gap-1.5 text-orange-300 font-semibold">
                    <Flame className="h-3.5 w-3.5" />
                    {streak}-day streak
                    {longestStreak > streak && (
                      <span className="text-neutral-500 font-normal">(best: {longestStreak})</span>
                    )}
                  </span>
                )}
              </div>

              {/* XP progress bar */}
              <div className="max-w-sm space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    {computedXp.toLocaleString()} XP · Level {xpLevel}
                  </span>
                  <span className="text-neutral-500">
                    {500 - (computedXp % 500)} XP to next
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-orange-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(xpProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Edit */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white/10 border-black/[0.12] text-white hover:bg-white/20 shrink-0 h-9 px-4 rounded-xl"
            >
              <NextLink href="/student/settings">Edit Profile</NextLink>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Courses', value: enrollments?.length ?? 0, icon: BookOpen, iconColor: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Lessons Done', value: lessonsCompleted, icon: CheckCircle, iconColor: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/15' },
          { label: 'Assignments', value: submittedAssignments.length, icon: ClipboardList, iconColor: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/15' },
          { label: 'Projects', value: myProjects?.length ?? 0, icon: Rocket, iconColor: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/15' },
        ].map((s) => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
              </div>
              <div className="text-3xl font-extrabold font-headline">{s.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-7">

        {/* Left column: Achievements + Courses */}
        <div className="lg:col-span-2 space-y-7">

          {/* Achievements */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Achievements
                </CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {earnedAchievements.length} / {ACHIEVEMENT_DEFINITIONS.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {earnedAchievements.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {earnedAchievements.map((a) => (
                      <div
                        key={a.id}
                        title={a.description}
                        className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl px-3 py-2 hover:border-amber-300 transition-colors cursor-default"
                      >
                        <span className="text-base leading-none">{a.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-tight">{a.name}</p>
                          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60 leading-tight">{a.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {lockedAchievements.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Locked — {lockedAchievements.length} to go
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lockedAchievements.map((a) => (
                          <div
                            key={a.id}
                            title={a.description}
                            className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2 opacity-40 cursor-default select-none"
                          >
                            <span className="text-base leading-none grayscale">{a.icon}</span>
                            <div>
                              <p className="text-xs font-bold leading-tight">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{a.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-3 text-muted-foreground/25" />
                  <p className="text-sm font-medium">No badges yet.</p>
                  <p className="text-xs mt-1">Complete your first lesson to start earning.</p>

                  {/* Show all locked */}
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {lockedAchievements.map((a) => (
                      <div
                        key={a.id}
                        title={a.description}
                        className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2 opacity-40 cursor-default"
                      >
                        <span className="text-base grayscale">{a.icon}</span>
                        <p className="text-xs font-bold">{a.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-headline">Enrolled Courses</h2>
              <NextLink
                href="/student/courses"
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </NextLink>
            </div>

            {activeCourses.length > 0 ? (
              <div className="space-y-3">
                {activeCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="border border-border bg-card hover:border-accent/30 transition-colors rounded-2xl overflow-hidden group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                          {course.thumbnail ? (
                            <Image
                              src={course.thumbnail}
                              alt={course.title || ''}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-accent/40" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm leading-snug line-clamp-1">
                              {course.title}
                            </p>
                            {course.progress >= 100 ? (
                              <span className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0">
                                Complete
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-accent shrink-0">
                                {course.progress}%
                              </span>
                            )}
                          </div>
                          <Progress value={course.progress} className="h-1.5 rounded-full" />
                          <p className="text-[11px] text-muted-foreground">
                            {course.completedLessons?.length || 0} lesson{course.completedLessons?.length !== 1 ? 's' : ''} completed
                          </p>
                        </div>

                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-8 w-8 p-0 rounded-lg hover:bg-accent/10"
                        >
                          <NextLink href={`/student/courses/${course.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </NextLink>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm">No courses enrolled yet.</p>
                <Button asChild size="sm" className="mt-4 bg-accent text-white rounded-xl">
                  <NextLink href="/courses">Browse Catalog</NextLink>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Projects + Activity */}
        <div className="space-y-6">

          {/* Projects */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-purple-500" />
                  Projects
                </CardTitle>
                <NextLink href="/student/projects" className="text-xs font-semibold text-accent hover:underline">
                  View all
                </NextLink>
              </div>
            </CardHeader>
            <CardContent>
              {myProjects && myProjects.length > 0 ? (
                <div className="space-y-4">
                  {leadProjects.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Project Lead
                      </p>
                      {leadProjects.slice(0, 2).map((p: any) => (
                        <NextLink key={p.id} href={`/projects/${p.id}`} className="block">
                          <div className="p-3 bg-secondary/50 rounded-xl border border-border hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-sm leading-snug line-clamp-1">{p.title}</p>
                              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${projectStatusClass(p.status)}`}>
                                {projectStatusLabel(p.status)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{p.category}</p>
                          </div>
                        </NextLink>
                      ))}
                    </div>
                  )}

                  {memberProjects.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Collaborating
                      </p>
                      {memberProjects.slice(0, 3).map((p: any) => (
                        <NextLink key={p.id} href={`/projects/${p.id}`} className="block">
                          <div className="p-3 bg-secondary/50 rounded-xl border border-border hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-sm leading-snug line-clamp-1">{p.title}</p>
                              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${projectStatusClass(p.status)}`}>
                                {projectStatusLabel(p.status)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{p.category}</p>
                          </div>
                        </NextLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <Rocket className="h-8 w-8 mx-auto mb-2 text-muted-foreground/25" />
                  <p className="text-sm font-medium">No projects yet.</p>
                  <Button asChild size="sm" variant="outline" className="mt-3 rounded-xl text-xs h-8">
                    <NextLink href="/student/projects">Explore Projects</NextLink>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity summary */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  label: 'Courses enrolled',
                  value: enrollments?.length ?? 0,
                  icon: BookOpen,
                  iconColor: 'text-accent',
                  href: '/student/courses',
                },
                {
                  label: 'Courses completed',
                  value: completedCourses.length,
                  icon: CheckCircle,
                  iconColor: 'text-green-600',
                  href: '/student/courses',
                },
                {
                  label: 'Assignments submitted',
                  value: submittedAssignments.length,
                  icon: ClipboardList,
                  iconColor: 'text-blue-600',
                  href: '/student/assignments',
                },
                {
                  label: 'Pending assignments',
                  value: pendingAssignments.length,
                  icon: Clock,
                  iconColor: pendingAssignments.length > 0 ? 'text-amber-600' : 'text-muted-foreground',
                  href: '/student/assignments',
                },
                {
                  label: 'Best streak',
                  value: `${longestStreak}d`,
                  icon: Flame,
                  iconColor: 'text-orange-500',
                  href: '/student/dashboard',
                },
              ].map((item) => (
                <NextLink
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`h-4 w-4 ${item.iconColor} shrink-0`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold tabular-nums">{item.value}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </NextLink>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
