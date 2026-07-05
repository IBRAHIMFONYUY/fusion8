'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Users, BookOpen, TrendingUp, DollarSign, Loader2,
  AlertTriangle, Flame, CheckCircle2, BookX, ActivitySquare,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { firestore, errorEmitter, FirestorePermissionError } from '@/firebase';

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseRow {
  id: string;
  title: string;
  enrolledCount: number;
  price?: number;
  avgProgress: number;
  completionRate: number;
}

interface PlatformStats {
  totalUsers: number;
  activeEnrollments: number;
  avgProgress: number;
  estRevenue: number;
}

interface CohortHealth {
  neverStarted: number;
  stalled: number;
  active: number;
  completed: number;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [cohortHealth, setCohortHealth] = useState<CohortHealth | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const wrap = async (p: Promise<any>, path: string) => {
          try { return await p; }
          catch (err: any) {
            if (err.code === 'permission-denied') {
              errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation: 'list' }));
            }
            throw err;
          }
        };

        const [enrollSnap, courseSnap, userSnap] = await Promise.all([
          wrap(getDocs(collection(firestore, 'enrollments')), 'enrollments'),
          wrap(getDocs(query(collection(firestore, 'courses'), orderBy('enrolledCount', 'desc'), limit(10))), 'courses'),
          wrap(getDocs(query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(12))), 'users'),
        ]);

        const allEnrollments = enrollSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        const allCourses = courseSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        const allUsers = userSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

        // ── Platform KPIs ──────────────────────────────────────────────────────
        const activeEnrollments = allEnrollments.filter((e: any) => e.status === 'active');
        const avgProgress =
          activeEnrollments.length > 0
            ? Math.round(
                activeEnrollments.reduce((s: number, e: any) => s + (e.progress || 0), 0) /
                  activeEnrollments.length
              )
            : 0;
        const estRevenue = allCourses.reduce(
          (s: number, c: any) => s + (c.price || 0) * (c.enrolledCount || 0),
          0
        );

        setStats({
          totalUsers: userSnap.size,
          activeEnrollments: activeEnrollments.length,
          avgProgress,
          estRevenue,
        });

        // ── Engagement Funnel ─────────────────────────────────────────────────
        const total = activeEnrollments.length || 1; // avoid div/0
        const started = activeEnrollments.filter((e: any) => (e.progress || 0) > 0);
        const halfway = activeEnrollments.filter((e: any) => (e.progress || 0) >= 50);
        const complete = activeEnrollments.filter((e: any) => (e.progress || 0) >= 100);
        setFunnelData([
          { stage: 'Enrolled', count: activeEnrollments.length, pct: 100 },
          { stage: 'Started', count: started.length, pct: Math.round((started.length / total) * 100) },
          { stage: '50%+', count: halfway.length, pct: Math.round((halfway.length / total) * 100) },
          { stage: 'Complete', count: complete.length, pct: Math.round((complete.length / total) * 100) },
        ]);

        // ── Cohort Health Signals ─────────────────────────────────────────────
        // Uses lastActiveDate on enrollment doc if present, otherwise rely on progress
        const neverStarted = activeEnrollments.filter((e: any) => (e.progress || 0) === 0).length;
        const stalledCount = activeEnrollments.filter(
          (e: any) => (e.progress || 0) > 0 && (e.progress || 0) < 100 && daysSince(e.lastActiveDate) > 14
        ).length;
        const activeCount = activeEnrollments.filter(
          (e: any) => (e.progress || 0) > 0 && (e.progress || 0) < 100 && daysSince(e.lastActiveDate) <= 7
        ).length;
        setCohortHealth({
          neverStarted,
          stalled: stalledCount,
          active: activeCount,
          completed: complete.length,
        });

        // ── Course Performance ─────────────────────────────────────────────────
        const rows: CourseRow[] = allCourses.map((c: any) => {
          const courseEnrollments = activeEnrollments.filter((e: any) => e.courseId === c.id);
          const avgProg =
            courseEnrollments.length > 0
              ? Math.round(courseEnrollments.reduce((s: number, e: any) => s + (e.progress || 0), 0) / courseEnrollments.length)
              : 0;
          const completionRate =
            courseEnrollments.length > 0
              ? Math.round((courseEnrollments.filter((e: any) => (e.progress || 0) >= 100).length / courseEnrollments.length) * 100)
              : 0;
          return {
            id: c.id,
            title: c.title || 'Untitled',
            enrolledCount: c.enrolledCount || courseEnrollments.length,
            price: c.price,
            avgProgress: avgProg,
            completionRate,
          };
        });
        setCourseRows(rows);
        setRecentUsers(allUsers);
      } catch {
        // errors emitted via errorEmitter
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          Loading platform data…
        </p>
      </div>
    );
  }

  const funnelColors = ['#E8461E', '#c73d18', '#a83314', '#8b2a10'];

  return (
    <div className="space-y-8 pb-12">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold font-headline tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time intelligence — all figures computed from live Firestore data.
        </p>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: Users,
            iconColor: 'text-accent',
            bg: 'bg-accent/10',
            sub: 'Registered accounts',
          },
          {
            label: 'Active Enrollments',
            value: stats?.activeEnrollments ?? 0,
            icon: BookOpen,
            iconColor: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-500/15',
            sub: 'Status = active',
          },
          {
            label: 'Avg. Progress',
            value: `${stats?.avgProgress ?? 0}%`,
            icon: TrendingUp,
            iconColor: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-500/15',
            sub: 'Across all enrollments',
          },
          {
            label: 'Est. Revenue',
            value: `${(stats?.estRevenue ?? 0).toLocaleString()} XAF`,
            icon: DollarSign,
            iconColor: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-500/15',
            sub: 'Price × enrollment count',
          },
        ].map((s) => (
          <Card key={s.label} className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
              </div>
              <div className="text-2xl font-extrabold font-headline tabular-nums">{s.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Engagement Funnel + Course Leaderboard ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Funnel */}
        <Card className="border border-border bg-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
              <ActivitySquare className="h-4 w-4 text-accent" />
              Enrollment Funnel
            </CardTitle>
            <CardDescription className="text-xs">
              Progression from enrolled → completed (live data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 && funnelData[0].count > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnelData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [
                        `${value} (${props.payload.pct}%)`,
                        'Students',
                      ]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={funnelColors[i] ?? '#E8461E'} fillOpacity={1 - i * 0.15} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Funnel percentages row */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {funnelData.map((d) => (
                    <div key={d.stage} className="text-center">
                      <div className="text-lg font-extrabold font-headline tabular-nums">{d.count}</div>
                      <div className="text-[10px] font-medium text-muted-foreground">{d.stage}</div>
                      <div className="text-[10px] font-bold text-accent">{d.pct}%</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                No enrollment data yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cohort Health */}
        <Card className="border border-border bg-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Cohort Health Signals
            </CardTitle>
            <CardDescription className="text-xs">
              Engagement depth and churn indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cohortHealth ? (
              <>
                {[
                  {
                    label: 'Completed',
                    value: cohortHealth.completed,
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bg: 'bg-green-100 dark:bg-green-500/15',
                    desc: 'Finished all course material',
                    signal: 'positive',
                  },
                  {
                    label: 'Actively Learning',
                    value: cohortHealth.active,
                    icon: Flame,
                    color: 'text-accent',
                    bg: 'bg-accent/10',
                    desc: 'Progress > 0%, active in last 7 days',
                    signal: 'positive',
                  },
                  {
                    label: 'Stalled',
                    value: cohortHealth.stalled,
                    icon: AlertTriangle,
                    color: 'text-amber-600',
                    bg: 'bg-amber-100 dark:bg-amber-500/15',
                    desc: 'In-progress but no activity 14+ days',
                    signal: 'warning',
                  },
                  {
                    label: 'Never Started',
                    value: cohortHealth.neverStarted,
                    icon: BookX,
                    color: 'text-red-500',
                    bg: 'bg-red-100 dark:bg-red-500/15',
                    desc: 'Enrolled, progress = 0%',
                    signal: 'risk',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                    <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <span className={`text-lg font-extrabold font-headline tabular-nums ${item.color}`}>
                          {item.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                No data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Course Performance Table ──────────────────────────────────── */}
      <Card className="border border-border bg-card rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Course Performance
          </CardTitle>
          <CardDescription className="text-xs">
            Top 10 courses by enrollment — avg. progress and completion rate computed from live enrollment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courseRows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="font-bold text-xs">Course</TableHead>
                  <TableHead className="font-bold text-xs text-right">Enrolled</TableHead>
                  <TableHead className="font-bold text-xs text-right">Est. Revenue</TableHead>
                  <TableHead className="font-bold text-xs w-36">Avg. Progress</TableHead>
                  <TableHead className="font-bold text-xs text-right">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseRows.map((c) => (
                  <TableRow key={c.id} className="hover:bg-accent/5 transition-colors">
                    <TableCell className="font-semibold text-sm max-w-[200px] truncate">
                      {c.title}
                    </TableCell>
                    <TableCell className="text-right font-bold text-accent tabular-nums">
                      {c.enrolledCount}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {((c.price ?? 0) * c.enrolledCount).toLocaleString()}
                      <span className="text-muted-foreground ml-0.5">XAF</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={c.avgProgress} className="h-1.5 flex-1 rounded-full" />
                        <span className="text-xs font-bold tabular-nums w-8 text-right">{c.avgProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          c.completionRate >= 50
                            ? 'text-green-600'
                            : c.completionRate >= 20
                            ? 'text-amber-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {c.completionRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No courses found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Members ────────────────────────────────────────────── */}
      <Card className="border border-border bg-card rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Recent Members
          </CardTitle>
          <CardDescription className="text-xs">Latest 12 registrations ordered by join date</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="font-bold text-xs">User</TableHead>
                <TableHead className="font-bold text-xs">Role</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((u: any) => (
                <TableRow key={u.id} className="hover:bg-accent/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3 py-1.5">
                      <Avatar className="h-8 w-8 ring-1 ring-border">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback className="text-xs font-bold bg-accent/10 text-accent">
                          {u.displayName?.charAt(0) ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{u.displayName || '—'}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold capitalize"
                    >
                      {u.role || 'student'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.approved ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none text-[10px] font-bold">
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold animate-pulse"
                      >
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
