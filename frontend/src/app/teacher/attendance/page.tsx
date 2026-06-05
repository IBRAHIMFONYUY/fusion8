'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ClipboardList, Loader2, Users, CheckCircle2, XCircle,
  Calendar, ChevronRight, TrendingUp,
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

interface SessionAttendance {
  sessionId: string;
  sessionTitle: string;
  date: Date;
  presentCount: number;
  absentCount: number;
  totalStudents: number;
  attendees: string[];
}

export default function TeacherAttendancePage() {
  const { user, firestore, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionAttendance | null>(null);
  const [attendeeDetails, setAttendeeDetails] = useState<any[]>([]);

  // Fetch broadcasts (live sessions) for this teacher
  const broadcastsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'broadcasts'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);
  const { data: broadcasts, isLoading: broadLoading } = useCollection(broadcastsQuery);

  useEffect(() => {
    async function buildAttendanceSummary() {
      if (!broadcasts || !firestore) return;
      setLoading(true);
      try {
        const result: SessionAttendance[] = await Promise.all(
          broadcasts.map(async (b: any) => {
            // Attendance records stored in broadcasts/{id}/attendance subcollection
            let attendees: string[] = [];
            try {
              const attSnap = await getDocs(
                collection(firestore, 'broadcasts', b.id, 'attendance')
              );
              attendees = attSnap.docs.map((d: any) => d.id);
            } catch {
              attendees = b.attendees || [];
            }

            // Enrolled student count from the linked course
            let totalStudents = 0;
            if (b.courseId) {
              try {
                const courseSnap = await getDoc(doc(firestore, 'courses', b.courseId));
                totalStudents = courseSnap.data()?.enrolledCount || 0;
              } catch { /* ignore */ }
            }

            const date = b.createdAt?.toDate?.() ?? b.date?.toDate?.() ?? new Date();
            return {
              sessionId: b.id,
              sessionTitle: b.title || `Lab Session · ${format(date, 'MMM d')}`,
              date,
              presentCount: attendees.length,
              absentCount: Math.max(0, totalStudents - attendees.length),
              totalStudents,
              attendees,
            };
          })
        );
        setSessions(result);
      } finally {
        setLoading(false);
      }
    }
    if (!broadLoading) buildAttendanceSummary();
  }, [broadcasts, broadLoading, firestore]);

  // Load attendee display names when a session is selected
  useEffect(() => {
    async function loadAttendees() {
      if (!selectedSession || !firestore) return;
      const details = await Promise.all(
        selectedSession.attendees.map(async (uid) => {
          try {
            const snap = await getDoc(doc(firestore, 'users', uid));
            return { uid, ...snap.data() };
          } catch {
            return { uid, displayName: uid };
          }
        })
      );
      setAttendeeDetails(details);
    }
    loadAttendees();
  }, [selectedSession, firestore]);

  if (authLoading || loading || broadLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalSessions = sessions.length;
  const avgAttendance =
    totalSessions > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.totalStudents > 0 ? (s.presentCount / s.totalStudents) * 100 : 0), 0) /
            totalSessions
        )
      : 0;
  const totalAttendeeMarks = sessions.reduce((sum, s) => sum + s.presentCount, 0);

  return (
    <div className="space-y-7 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold font-headline tracking-tight">Attendance Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Attendance records for your live lab sessions.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Sessions Held', value: totalSessions, icon: Calendar, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Avg. Attendance', value: `${avgAttendance}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/15' },
          { label: 'Total Check-ins', value: totalAttendeeMarks, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/15' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <div className="text-2xl font-extrabold font-headline">{s.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-7">
        {/* Session list */}
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-accent" />
                Session History
              </CardTitle>
              <CardDescription className="text-xs">Click a session to see who attended.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead className="font-bold text-xs">Session</TableHead>
                      <TableHead className="font-bold text-xs">Date</TableHead>
                      <TableHead className="font-bold text-xs w-36">Rate</TableHead>
                      <TableHead className="font-bold text-xs text-right">Present</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => {
                      const rate = s.totalStudents > 0 ? Math.round((s.presentCount / s.totalStudents) * 100) : 0;
                      const isSelected = selectedSession?.sessionId === s.sessionId;
                      return (
                        <TableRow
                          key={s.sessionId}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-accent/8' : 'hover:bg-accent/5'}`}
                          onClick={() => setSelectedSession(isSelected ? null : s)}
                        >
                          <TableCell className="font-semibold text-sm">{s.sessionTitle}</TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {format(s.date, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={rate} className="h-1.5 flex-1 rounded-full" />
                              <span className="text-xs font-bold tabular-nums w-8 text-right">{rate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-sm tabular-nums text-green-600">{s.presentCount}</span>
                            {s.totalStudents > 0 && (
                              <span className="text-xs text-muted-foreground">/{s.totalStudents}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground/25" />
                  <p className="text-sm font-medium">No sessions recorded yet.</p>
                  <p className="text-xs mt-1">Schedule and run live sessions to see attendance data.</p>
                  <Button asChild size="sm" variant="outline" className="mt-4 rounded-xl">
                    <a href="/teacher/schedule">Go to Schedule</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendee panel */}
        <div>
          <Card className="border border-border bg-card rounded-2xl sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {selectedSession ? 'Attendees' : 'Select a Session'}
              </CardTitle>
              {selectedSession && (
                <CardDescription className="text-xs">{selectedSession.sessionTitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedSession ? (
                attendeeDetails.length > 0 ? (
                  <div className="space-y-2">
                    {attendeeDetails.map((a) => (
                      <div
                        key={a.uid}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border"
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                          {(a.displayName || a.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{a.displayName || '—'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{a.email}</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      </div>
                    ))}
                    {selectedSession.absentCount > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                          {selectedSession.absentCount} student{selectedSession.absentCount !== 1 ? 's' : ''} absent
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
                    No attendance data recorded for this session.
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <ClipboardList className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
                  Select a session from the left to view attendees.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
