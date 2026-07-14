'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, Users as UsersIcon, Loader2, PlayCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/empty-state';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { checkInAction } from '@/lib/attendance-actions';

const CHECK_IN_OPENS_MS = 15 * 60 * 1000;
const CHECK_IN_CLOSES_MS = 3 * 60 * 60 * 1000;

function getSessionStart(dateStr: string, time: string): Date {
  const day = new Date(dateStr);
  const [hours, minutes] = (time || '00:00').split(':').map(Number);
  day.setHours(hours || 0, minutes || 0, 0, 0);
  return day;
}

function checkInStatus(dateStr: string, time: string): 'not-open' | 'open' | 'closed' {
  const start = getSessionStart(dateStr, time).getTime();
  const now = Date.now();
  if (now < start - CHECK_IN_OPENS_MS) return 'not-open';
  if (now > start + CHECK_IN_CLOSES_MS) return 'closed';
  return 'open';
}

export default function StudentLivePage() {
  const { user, firestore } = useAuth();
  const { toast } = useToast();
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const broadcastsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'broadcasts'), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: broadcasts, isLoading } = useCollection(broadcastsQuery);

  // Load existing check-in status once broadcasts are known
  useEffect(() => {
    async function loadCheckedIn() {
      if (!broadcasts || !firestore || !user) return;
      const results = await Promise.all(
        broadcasts.map(async (b: any) => {
          try {
            const snap = await getDoc(doc(firestore, 'broadcasts', b.id, 'attendance', user.uid));
            return snap.exists() ? b.id : null;
          } catch {
            return null;
          }
        })
      );
      setCheckedInIds(new Set(results.filter((id): id is string => !!id)));
    }
    loadCheckedIn();
  }, [broadcasts, firestore, user]);

  const handleCheckIn = async (broadcastId: string) => {
    setCheckingInId(broadcastId);
    try {
      const result = await checkInAction(broadcastId);
      if (result.success) {
        setCheckedInIds(prev => new Set(prev).add(broadcastId));
        toast({ title: 'Checked in!', description: 'Your attendance has been recorded.' });
      } else {
        toast({ variant: 'destructive', title: 'Check-in failed', description: result.error });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Check-in failed', description: 'Please try again.' });
    } finally {
      setCheckingInId(null);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-24">
            <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
            <p className="text-muted-foreground animate-pulse uppercase tracking-widest text-xs">Connecting to lab dispatch...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-headline tracking-tighter uppercase">Live Engineering Labs</h1>
        <p className="text-muted-foreground">Join upcoming live sessions and interactive Q&A broadcasts.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Video className="h-5 w-5 text-accent" />
                Lab Dispatch Feed
            </h2>
            {broadcasts && broadcasts.length > 0 ? (
                <div className="grid gap-4">
                    {broadcasts.map(b => {
                        const hasMeetLink = !!b.meetLink;
                        const isCheckedIn = checkedInIds.has(b.id);
                        const status = checkInStatus(b.date, b.time);
                        const isCheckingIn = checkingInId === b.id;
                        return (
                            <Card key={b.id} className="border-none shadow-lg overflow-hidden group hover:ring-2 ring-accent/50 transition-all">
                                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                                            <Calendar className="h-6 w-6 text-accent" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black leading-tight">{b.title}</h3>
                                            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">
                                                {format(new Date(b.date), 'EEEE, MMMM do')} • {b.time}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                {hasMeetLink ? (
                                                    <Badge className="bg-green-600 text-white border-none text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                                                        <Video className="h-3 w-3" /> Google Meet
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">In-Studio</Badge>
                                                )}
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase italic">by {b.teacherName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                                      {hasMeetLink && (
                                          <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                                              className="w-full sm:w-auto">
                                              <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 h-12 rounded-xl shadow-lg">
                                                  <Video className="mr-2 h-5 w-5" />
                                                  Join on Google Meet
                                                  <ExternalLink className="ml-2 h-4 w-4" />
                                              </Button>
                                          </a>
                                      )}
                                      {isCheckedIn ? (
                                        <Badge className="bg-green-600 text-white border-none text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 h-9 px-4">
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Checked In
                                        </Badge>
                                      ) : (
                                        <Button
                                          variant={hasMeetLink ? 'outline' : 'default'}
                                          className={hasMeetLink ? 'w-full sm:w-auto font-bold h-9 rounded-xl' : 'w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 h-12 rounded-xl shadow-lg'}
                                          disabled={status !== 'open' || isCheckingIn}
                                          onClick={() => handleCheckIn(b.id)}
                                        >
                                          {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                                          {status === 'not-open' ? 'Check-in opens soon' : status === 'closed' ? 'Check-in closed' : 'Check In'}
                                        </Button>
                                      )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={Video}
                    title="Broadcast Schedule Empty"
                    description="No live sessions are currently scheduled. Recorded sessions are available in your course library."
                />
            )}
        </div>

        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                Quick Guide
            </h2>
            <Card className="border-none shadow-xl bg-secondary/30 rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">How Live Sessions Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">1</div>
                        <p>Your teacher schedules a live session and you receive an <strong className="text-foreground">email alert</strong> with the link.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">2</div>
                        <p>Sessions hosted on <strong className="text-foreground">Google Meet</strong> — you join directly from this page.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">3</div>
                        <p>Can't attend live? Recordings are uploaded to your <strong className="text-foreground">course library</strong> afterwards.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
