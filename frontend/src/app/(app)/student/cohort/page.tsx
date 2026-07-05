'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Users,
  Calendar,
  Cpu,
  Bell,
  ArrowRight,
  Clock,
  Flame,
  Zap,
  BookOpen,
  Video,
  ClipboardList,
  MapPin,
  CheckCircle,
  Hourglass,
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import type { Cohort, CohortStatus, EngineeringTrack } from '@/types';

// ── Track metadata ─────────────────────────────────────────────────────────────

interface TrackInfo {
  description: string;
  skills: string[];
}

const TRACK_INFO: Record<EngineeringTrack, TrackInfo> = {
  Mechatronics: {
    description:
      'An integrated discipline that combines mechanical, electrical, and computer engineering to design intelligent machines and automated systems.',
    skills: ['Arduino', 'CAD', 'Sensors', 'Actuators', 'Control Systems', 'PCB Design'],
  },
  Robotics: {
    description:
      'Design, build, and program autonomous robots that perceive and interact with their environment.',
    skills: ['ROS', 'Computer Vision', 'Servo Control', 'Path Planning', 'Python', 'C++'],
  },
  'AI/ML': {
    description:
      'Train machine learning models and deploy intelligent systems that learn from real-world data.',
    skills: ['Python', 'TensorFlow', 'Data Pipelines', 'Neural Networks', 'Model Deployment', 'Edge AI'],
  },
  Electronics: {
    description:
      'Analogue and digital circuit design, signal processing, and embedded programming for hardware products.',
    skills: ['Circuit Design', 'Oscilloscopes', 'Soldering', 'Microcontrollers', 'Signal Processing', 'KiCad'],
  },
  'Software Engineering': {
    description:
      'Build scalable, production-ready software systems using modern frameworks and engineering best practices.',
    skills: ['TypeScript', 'React', 'Node.js', 'System Design', 'APIs', 'CI/CD'],
  },
  IoT: {
    description:
      'Connect physical devices to the cloud and build networked sensor systems for real-world applications.',
    skills: ['MQTT', 'ESP32', 'Firebase', 'Sensors', 'Cloud Functions', 'Data Dashboards'],
  },
  'CNC/CAD': {
    description:
      'Computer-aided design and precision manufacturing using CNC machining and 3D printing workflows.',
    skills: ['SolidWorks', 'Fusion 360', 'G-Code', '3D Printing', 'Tolerances', 'Technical Drawing'],
  },
  'Hardware Design': {
    description:
      'End-to-end hardware product development — from schematic capture and PCB layout to prototype testing.',
    skills: ['Altium', 'PCB Layout', 'Schematic Capture', 'DFM', 'Signal Integrity', 'Prototyping'],
  },
};

// ── Status badge styling ───────────────────────────────────────────────────────

function statusVariant(status: CohortStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', className: 'bg-green-500/15 text-green-600 border-green-500/30' };
    case 'upcoming':
      return { label: 'Upcoming', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' };
    case 'completed':
      return { label: 'Completed', className: 'bg-muted text-muted-foreground border-border' };
  }
}

// ── Cohort timeline progress ───────────────────────────────────────────────────

function cohortProgress(startDate: unknown, endDate: unknown): number {
  if (!startDate || !endDate) return 0;
  const start = toDate(startDate);
  const end = toDate(endDate);
  const now = new Date();
  if (!start || !end) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.round((elapsed / total) * 100);
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Firestore Timestamp
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  // seconds-based Timestamp object
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function formatCohortDate(value: unknown): string {
  const d = toDate(value);
  if (!d) return '—';
  return format(d, 'MMM d, yyyy');
}

function daysSinceStart(startDate: unknown): number {
  const d = toDate(startDate);
  if (!d) return 0;
  const diff = differenceInDays(new Date(), d);
  return diff < 0 ? 0 : diff;
}

// ── Avatar initials ────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ── Pending cohort assignment state ───────────────────────────────────────────

function PendingCohortState({ name }: { name: string | null }) {
  const firstName = name?.split(' ')[0] || 'Engineer';
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
          <Hourglass className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Pending Cohort Assignment, {firstName}.
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          You've been enrolled. Our team is placing you in the right cohort
          based on your track, schedule, and lab availability. This typically
          takes 24–48 hours after your enrollment is confirmed.
        </p>
      </div>

      {/* What's coming */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            title: 'Cohort Community',
            desc: 'Meet your accountability partners — students on the same track, building together in the same cohort window.',
          },
          {
            icon: Calendar,
            title: 'Shared Schedule',
            desc: "Access your cohort's shared lab sessions, live workshops, and milestone calendar in one place.",
          },
          {
            icon: CheckCircle,
            title: 'Accountability Partners',
            desc: "Track each other's progress, share deliverables, and stay on pace toward the capstone project.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="border border-border rounded-2xl p-6 text-center space-y-3 bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
              <item.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Status notice */}
      <div className="border border-border rounded-2xl p-6 bg-card flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 bg-amber-500/10 rounded-xl flex items-center justify-center">
          <Clock className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-sm mb-1">Your assignment is in progress</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Once you are placed in a cohort, this page will automatically update with
            your cohort dashboard — including your cohort mates, track timeline,
            and announcements from your instructor.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Button
          asChild
          size="lg"
          className="h-12 px-10 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-xl shadow-accent/20"
        >
          <NextLink href="/courses">
            Complete Enrollment <ArrowRight className="ml-2 h-4 w-4" />
          </NextLink>
        </Button>
      </div>
    </div>
  );
}

// ── Cohort mate card ──────────────────────────────────────────────────────────

interface CohortMateEntry {
  id: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
}

function CohortMateCard({ mate }: { mate: CohortMateEntry }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-background hover:border-accent/30 transition-colors text-center">
      <Avatar className="h-10 w-10">
        {mate.photoURL ? <AvatarImage src={mate.photoURL} alt={mate.displayName ?? 'Member'} /> : null}
        <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
          {initials(mate.displayName)}
        </AvatarFallback>
      </Avatar>
      <p className="text-xs font-semibold line-clamp-1 w-full">{mate.displayName ?? 'Student'}</p>
      {mate.role && mate.role !== 'student' && (
        <span className="text-[10px] text-muted-foreground capitalize">{mate.role}</span>
      )}
    </div>
  );
}

// ── Notification entry ────────────────────────────────────────────────────────

interface NotificationEntry {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  createdAt?: unknown;
  type?: string;
}

function AnnouncementItem({ notification }: { notification: NotificationEntry }) {
  const text = notification.message ?? notification.body ?? notification.title ?? 'Announcement';
  const dateObj = toDate(notification.createdAt);
  const relativeTime = dateObj
    ? formatDistanceToNow(dateObj, { addSuffix: true })
    : null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="w-8 h-8 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
        <Bell className="h-3.5 w-3.5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        {notification.title && notification.title !== text && (
          <p className="text-xs font-bold mb-0.5 line-clamp-1">{notification.title}</p>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{text}</p>
        {relativeTime && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{relativeTime}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentCohortPage() {
  const { user, firestore, isLoading: authLoading } = useAuth();

  // Local state for one-shot doc fetches
  const [cohortId, setCohortId] = useState<string | null | undefined>(undefined); // undefined = not yet loaded
  const [cohort, setCohort] = useState<(Cohort & { id: string }) | null>(null);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [userXp, setUserXp] = useState<number>(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cohortLoading, setCohortLoading] = useState(false);

  // Fetch user profile to get cohortId, streak, xp
  useEffect(() => {
    if (!user || !firestore) return;
    setProfileLoading(true);
    getDoc(doc(firestore, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCohortId(data.cohortId ?? null);
          setUserStreak(data.currentStreak ?? 0);
          setUserXp(data.xp ?? 0);
        } else {
          setCohortId(null);
        }
      })
      .catch(() => {
        setCohortId(null);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [user, firestore]);

  // Fetch cohort doc once cohortId is known
  useEffect(() => {
    if (!firestore || !cohortId) {
      if (cohortId === null) setCohortLoading(false);
      return;
    }
    setCohortLoading(true);
    getDoc(doc(firestore, 'cohorts', cohortId))
      .then((snap) => {
        if (snap.exists()) {
          setCohort({ id: snap.id, ...(snap.data() as Omit<Cohort, 'id'>) });
        } else {
          setCohort(null);
        }
      })
      .catch(() => {
        setCohort(null);
      })
      .finally(() => {
        setCohortLoading(false);
      });
  }, [firestore, cohortId]);

  // Real-time: cohort mates
  const cohortMatesQuery = useMemoFirebase(() => {
    if (!firestore || !cohortId) return null;
    return query(
      collection(firestore, 'users'),
      where('cohortId', '==', cohortId),
      limit(20)
    );
  }, [firestore, cohortId]);
  const { data: cohortMates, isLoading: matesLoading } = useCollection<CohortMateEntry>(cohortMatesQuery);

  // Real-time: global announcements (serve as cohort dispatches)
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'notifications'),
      where('global', '==', true),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore]);
  const { data: announcements, isLoading: announcementsLoading } = useCollection<NotificationEntry>(notificationsQuery);

  // ── Loading state ──────────────────────────────────────────────────────────
  const isLoading =
    authLoading ||
    profileLoading ||
    cohortLoading ||
    cohortId === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // ── No cohort assigned ─────────────────────────────────────────────────────
  if (!cohortId || !cohort) {
    return <PendingCohortState name={user?.displayName ?? null} />;
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const trackInfo: TrackInfo = TRACK_INFO[cohort.track] ?? {
    description: 'Specialized engineering track focused on real-world problem solving.',
    skills: [],
  };
  const progress = cohortProgress(cohort.startDate, cohort.endDate);
  const daysSince = daysSinceStart(cohort.startDate);
  const cohortSize = cohortMates?.length ?? 0;
  const status = statusVariant(cohort.status);

  const displayedMates = (cohortMates ?? []).filter((m) => m.id !== user?.uid);
  const maxDisplayed = 12;
  const visibleMates = displayedMates.slice(0, maxDisplayed);
  const hiddenCount = Math.max(0, displayedMates.length - maxDisplayed);

  const firstName = user?.displayName?.split(' ')[0] || 'Engineer';

  return (
    <div className="space-y-7 pb-12">

      {/* ── Cohort Hero ──────────────────────────────────────────────── */}
      <div className="bg-primary text-white rounded-2xl p-7 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            {/* Track + status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-accent/20 border-accent/40 text-white text-[11px] font-semibold px-2.5 py-0.5"
              >
                {cohort.track}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold px-2.5 py-0.5 ${status.className}`}
              >
                {status.label}
              </Badge>
              {cohort.location && (
                <Badge
                  variant="outline"
                  className="bg-white/10 border-black/[0.12] text-white/80 text-[11px] font-semibold px-2.5 py-0.5"
                >
                  <MapPin className="h-2.5 w-2.5 mr-1" />
                  {cohort.location.charAt(0).toUpperCase() + cohort.location.slice(1)}
                </Badge>
              )}
            </div>

            {/* Cohort name */}
            <h1 className="text-2xl md:text-3xl font-bold font-headline leading-tight">
              {cohort.name}
            </h1>

            {/* Dates */}
            <p className="text-neutral-400 text-sm">
              {formatCohortDate(cohort.startDate)}
              {cohort.endDate ? ` — ${formatCohortDate(cohort.endDate)}` : ''}
            </p>
          </div>

          {/* Student identity */}
          <div className="shrink-0 bg-white/10 border border-black/[0.10] rounded-2xl px-5 py-4 space-y-2 min-w-[170px]">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Cohort Member
            </p>
            <p className="font-bold text-base leading-tight">{firstName}</p>
            <div className="flex items-center gap-3 pt-1">
              {userStreak > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs font-semibold text-orange-300">{userStreak}d</span>
                </div>
              )}
              {userXp > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300">{userXp} XP</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/8 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Cohort Size',
            value: cohortSize,
            icon: Users,
            iconColor: 'text-accent',
            bgColor: 'bg-accent/10',
          },
          {
            label: 'Days Since Start',
            value: daysSince,
            icon: Calendar,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
          },
          {
            label: 'Track',
            value: cohort.track,
            icon: Cpu,
            iconColor: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
            small: true,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div className={`font-extrabold font-headline ${stat.small ? 'text-lg leading-tight' : 'text-3xl'}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-7">

        {/* ── Left column ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-7">

          {/* Cohort Mates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-headline flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Cohort Mates
              </h2>
              <span className="text-xs font-medium text-muted-foreground">
                {cohortSize} member{cohortSize !== 1 ? 's' : ''}
              </span>
            </div>

            {matesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : visibleMates.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {visibleMates.map((mate) => (
                  <CohortMateCard key={mate.id} mate={mate} />
                ))}
                {hiddenCount > 0 && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-background text-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">+{hiddenCount}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">more</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
                <Users className="h-7 w-7 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No cohort mates found yet.</p>
              </div>
            )}
          </div>

          {/* Cohort Announcements */}
          <div>
            <h2 className="text-lg font-bold font-headline flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-accent" />
              Cohort Announcements
            </h2>
            <Card className="border border-border bg-card rounded-2xl">
              <CardContent className="p-2">
                {announcementsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  </div>
                ) : announcements && announcements.length > 0 ? (
                  <div className="divide-y divide-border">
                    {announcements.map((notification) => (
                      <AnnouncementItem key={notification.id} notification={notification} />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No announcements yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Cohort Timeline */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Cohort Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>{formatCohortDate(cohort.startDate)}</span>
                <span>{formatCohortDate(cohort.endDate)}</span>
              </div>
              <Progress value={progress} className="h-2 rounded-full" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Progress through cohort</span>
                <span className="text-xs font-bold text-accent">{progress}%</span>
              </div>

              {cohort.status === 'active' && progress > 0 && (
                <div className="bg-accent/10 rounded-xl px-3 py-2.5 text-xs text-accent font-semibold">
                  {100 - progress}% remaining — keep building.
                </div>
              )}
              {cohort.status === 'upcoming' && (
                <div className="bg-amber-500/10 rounded-xl px-3 py-2.5 text-xs text-amber-600 font-semibold">
                  Cohort starts {formatCohortDate(cohort.startDate)}.
                </div>
              )}
              {cohort.status === 'completed' && (
                <div className="bg-green-500/10 rounded-xl px-3 py-2.5 text-xs text-green-600 font-semibold">
                  Cohort completed on {formatCohortDate(cohort.endDate)}.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Track Info */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  Track Overview
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-accent/10 text-accent border-accent/20"
                >
                  {cohort.track}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed mt-1">
                {trackInfo.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Skills Covered
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trackInfo.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-lg px-2.5 py-1 border border-border"
                  >
                    {skill}
                  </span>
                ))}
                {trackInfo.skills.length === 0 && (
                  <span className="text-xs text-muted-foreground">No skills listed.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links CTA */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {[
                {
                  label: 'Dashboard',
                  href: '/student/dashboard',
                  icon: BookOpen,
                  desc: 'Your learning overview',
                },
                {
                  label: 'Live Sessions',
                  href: '/student/live',
                  icon: Video,
                  desc: 'Upcoming labs & workshops',
                },
                {
                  label: 'Assignments',
                  href: '/student/assignments',
                  icon: ClipboardList,
                  desc: 'Pending deliverables',
                },
              ].map((link) => (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-colors group"
                >
                  <div className="w-8 h-8 shrink-0 bg-accent/10 rounded-lg flex items-center justify-center">
                    <link.icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight">{link.label}</p>
                    <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                </NextLink>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
