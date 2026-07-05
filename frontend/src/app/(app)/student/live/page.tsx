'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, Users as UsersIcon, Loader2, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/empty-state';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function StudentLivePage() {
  const { firestore } = useAuth();

  const broadcastsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'broadcasts'), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: broadcasts, isLoading } = useCollection(broadcastsQuery);

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
        <p className="text-muted-foreground">Join upcoming onsite lab broadcasts and interactive Q&A sessions.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Video className="h-5 w-5 text-accent" />
                Lab Dispatch Feed
            </h2>
            {broadcasts && broadcasts.length > 0 ? (
                <div className="grid gap-4">
                    {broadcasts.map(b => (
                        <Card key={b.id} className="border-none shadow-lg overflow-hidden group hover:ring-2 ring-accent/50 transition-all">
                            <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                                        <Calendar className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black leading-tight">{b.title}</h3>
                                        <p className="text-xs text-muted-foreground font-mono uppercase mt-1">
                                            {format(new Date(b.date), 'EEEE, MMMM do')} • {b.time}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">Bamenda Lab 01</Badge>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase italic">Presented by {b.teacherName}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 h-12 rounded-xl shadow-lg">
                                    <PlayCircle className="mr-2 h-5 w-5" />
                                    Enter Broadcast
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    icon={Video}
                    title="Broadcast Schedule Empty"
                    description="No live broadcasts are currently scheduled. Recorded sessions are available in your course library."
                />
            )}
        </div>

        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                Mentorship
            </h2>
            <Card className="border-none shadow-xl bg-secondary/30 rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Office Hours</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState 
                        icon={UsersIcon}
                        title="No Mentors Online"
                        description="Live mentorship slots are updated weekly on Mondays."
                    />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}