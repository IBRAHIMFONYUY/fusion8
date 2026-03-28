'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, BookOpen, Loader2, Rocket, AlertCircle, ShieldCheck, Bell, Activity, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, query, where, doc, limit, orderBy, deleteDoc, DocumentSnapshot } from 'firebase/firestore';
import { firestore, useAuth, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: '...',
    userCount: 0,
    courseCount: 0,
    activeStudents: 0,
    cohortApps: 0,
    pendingCourses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronized Governance Dispatch Query: strictly aligned with Admin permissions
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || authLoading || role !== 'admin') return null;
    return query(
        collection(firestore, 'notifications'),
        where('global', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
    );
  }, [firestore, role, authLoading]);

  const { data: notifications, isLoading: notifsLoading } = useCollection(notificationsQuery);

  useEffect(() => {
    async function fetchRealStats() {
      if (authLoading || !firestore || !user || role !== 'admin') {
        if (!authLoading && role !== 'admin') setLoading(false);
        return;
      }

      try {
        setError(null);
        
        const wrapFetch = async (promise: Promise<any>, path: string) => {
            try {
                return await promise;
            } catch (err: any) {
                if (err.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path,
                        operation: 'list',
                    }));
                }
                throw err;
            }
        };

        const [userSnap, courseSnap, activeSnap, appSnap] = await Promise.all([
          wrapFetch(getDocs(collection(firestore, 'users')), 'users'),
          wrapFetch(getDocs(collection(firestore, 'courses')), 'courses'),
          wrapFetch(getDocs(query(collection(firestore, 'enrollments'), where('status', '==', 'active'))), 'enrollments'),
          wrapFetch(getDocs(query(collection(firestore, 'cohort_applications'), where('status', '==', 'pending'))), 'cohort_applications')
        ]);

        const totalRev = courseSnap.docs.reduce((acc: number, doc: any) => acc + (doc.data().price || 0) * (doc.data().enrolledCount || 0), 0);
        const pendingCount = courseSnap.docs.filter((d: DocumentSnapshot) => d.data().status === 'pending').length;

        setStats({
          totalRevenue: totalRev.toLocaleString() + ' XAF',
          userCount: userSnap.size,
          courseCount: courseSnap.size,
          activeStudents: activeSnap.size,
          cohortApps: appSnap.size,
          pendingCourses: pendingCount
        });
      } catch (err: any) {
        setError("Governance stream initializing...");
      } finally {
        setLoading(false);
      }
    }

    fetchRealStats();
  }, [role, firestore, authLoading, user]);

  const handleClearNotif = async (id: string) => {
    try {
        await deleteDoc(doc(firestore, 'notifications', id));
    } catch (e) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `notifications/${id}`,
            operation: 'delete'
        }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Authenticating Governance...</p>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Your session does not have valid administrative markers. Please return to the student portal.</AlertDescription>
        </Alert>
        <Button asChild className="mt-4" variant="outline">
            <Link href="/student/dashboard">Student Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Platform Governance</h1>
        <Badge className="bg-accent text-accent-foreground font-black px-4 py-1">CEO SESSION</Badge>
      </div>
      
      {error && (
        <Alert className="bg-secondary/50 border-dashed">
          <Activity className="h-4 w-4 text-accent" />
          <AlertTitle>System Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/cohorts" className="animate-slide-up-fade opacity-0 animation-delay-100">
          <Card className="hover:bg-muted transition-colors border-none shadow-lg bg-accent text-accent-foreground h-full rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Pending Admissions</CardTitle>
              <Rocket className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black font-headline">{stats.cohortApps}</div>
              <p className="text-xs opacity-70 mt-1 font-bold">Onsite Applicants</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Activity className="h-20 w-20" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/courses" className="animate-slide-up-fade opacity-0 animation-delay-200">
          <Card className="hover:bg-muted transition-colors border-none shadow-lg bg-primary text-primary-foreground h-full rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Course Reviews</CardTitle>
              <ShieldCheck className="h-5 w-5 text-accent opacity-80" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black font-headline">{stats.pendingCourses}</div>
              <p className="text-xs opacity-70 mt-1 font-bold">Pending Instructor Submissions</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <BookOpen className="h-20 w-20" />
            </div>
          </Card>
        </Link>

        <Card className="border-none shadow-lg h-full rounded-2xl bg-card/50 backdrop-blur-sm ring-1 ring-black/5 animate-slide-up-fade opacity-0 animation-delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Lifetime Value</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-headline">{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1 font-bold">Digital campus sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 animate-slide-up-fade opacity-0 animation-delay-400">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                System Dispatch
            </h2>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-secondary/30">
                <CardContent className="p-0">
                    {notifications && notifications.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {notifications.map(notif => (
                                <div key={notif.id} className="p-6 flex items-start gap-4 hover:bg-background/50 transition-colors">
                                    <div className="mt-1 p-2 bg-accent/10 rounded-lg">
                                        <Activity className="h-4 w-4 text-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold leading-tight">{notif.message}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase">
                                                {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </p>
                                            <Badge variant="outline" className="text-[8px] uppercase tracking-widest h-4 px-1.5 border-accent/20 text-accent">Review Required</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {notif.courseId && (
                                            <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] font-black uppercase">
                                                <Link href={`/courses/${notif.courseId}`} target="_blank">Preview <ArrowRight className="ml-1 h-3 w-3"/></Link>
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleClearNotif(notif.id)} className="h-8 w-8 hover:text-green-600">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-muted-foreground italic text-sm">
                            {notifsLoading ? "Scanning dispatch channels..." : "Curriculum stream is synchronized. No active modification reports."}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6 animate-slide-up-fade opacity-0 animation-delay-500">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Network Health
            </h2>
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm ring-1 ring-black/5 rounded-2xl">
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Participants</p>
                            <p className="text-2xl font-black">{stats.userCount}</p>
                        </div>
                        <Users className="h-8 w-8 text-primary/20" />
                    </div>
                    <div className="h-px bg-border border-dashed" />
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Scholarship Seats</p>
                            <p className="text-2xl font-black">{stats.activeStudents}</p>
                        </div>
                        <ShieldCheck className="h-8 w-8 text-accent/20" />
                    </div>
                    <Button asChild className="w-full bg-primary hover:bg-accent transition-all font-bold rounded-xl h-12 shadow-md">
                        <Link href="/admin/users">Manage Access Portal</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}