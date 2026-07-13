
'use client';

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Trash2, Loader2, CalendarDays, Video, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { notificationService } from '@/services/notification-service';
import type { SecurityRuleContext } from '@/firebase/errors';

export default function TeacherSchedulePage() {
    const { toast } = useToast();
    const { user, firestore } = useAuth();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [course, setCourse] = useState('');
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [meetLink, setMeetLink] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);

    const teacherCoursesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'courses'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: myCourses, isLoading: coursesLoading } = useCollection(teacherCoursesQuery);

    const broadcastsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'broadcasts'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: scheduledClasses, isLoading: broadcastsLoading } = useCollection(broadcastsQuery);

    const handleScheduleClass = async () => {
        if (!course || !title || !selectedDate || !time || !user) {
            toast({ variant: 'destructive', title: 'Missing Information' });
            return;
        }

        setIsScheduling(true);
        const broadcastPayload = {
            courseId: course,
            teacherId: user.uid,
            teacherName: user.displayName,
            title,
            date: selectedDate.toISOString(),
            time,
            meetLink: meetLink.trim() || null,
            createdAt: serverTimestamp(),
            status: 'scheduled'
        };

        addDoc(collection(firestore, 'broadcasts'), broadcastPayload)
            .then(async () => {
                // In-app notification to enrolled students
                await notificationService.notifyCourseStudents(course, {
                    message: `New live session: "${title}" on ${format(selectedDate, 'PPP')} at ${time}.${meetLink ? ' Google Meet link included.' : ''}`,
                    type: 'LIVE_SESSION',
                    senderId: user.uid
                });

                // Email notification — fire and forget, don't block the UI
                fetch('/api/broadcasts/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseId: course,
                        title,
                        date: selectedDate.toISOString(),
                        time,
                        meetLink: meetLink.trim() || '',
                    }),
                }).catch(() => null);

                toast({
                    title: 'Session Scheduled',
                    description: 'Students notified via in-app alerts and email.',
                });
                setCourse('');
                setTitle('');
                setTime('');
                setMeetLink('');
            })
            .catch(async (err: any) => {
                if (err.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: 'broadcasts',
                        operation: 'create',
                        requestResourceData: broadcastPayload,
                    } satisfies SecurityRuleContext));
                }
            })
            .finally(() => {
                setIsScheduling(false);
            });
    };

    const handleDelete = async (id: string) => {
        const broadcastRef = doc(firestore, 'broadcasts', id);
        deleteDoc(broadcastRef)
            .then(() => {
                toast({ title: "Broadcast Removed" });
            })
            .catch(async (err: any) => {
                if (err.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: broadcastRef.path,
                        operation: 'delete',
                    } satisfies SecurityRuleContext));
                }
            });
    };

    const classesOnSelectedDay = scheduledClasses?.filter(
        (c) => selectedDate && format(new Date(c.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
    ).sort((a,b) => a.time.localeCompare(b.time)) || [];

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Broadcast Scheduler</h1>
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarDays className="text-accent" /> Dispatch Calendar</CardTitle>
                        <CardDescription>Coordinate live sessions and Q&A broadcasts. Students receive email + in-app alerts automatically.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border w-full bg-secondary/20"
                        />
                         <div className="mt-6 space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2">
                                Scheduled for {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'}
                            </h3>
                            {broadcastsLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                            ) : classesOnSelectedDay.length > 0 ? (
                                classesOnSelectedDay.map(c => (
                                    <div key={c.id} className="p-4 bg-background border rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm">{c.title}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">TIME: {c.time}</p>
                                                {c.meetLink && (
                                                    <a href={c.meetLink} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] text-accent font-bold mt-1 hover:underline">
                                                        <Video className="h-3 w-3" /> Google Meet link
                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                {c.meetLink ? (
                                                    <Button size="sm" asChild>
                                                        <a href={c.meetLink} target="_blank" rel="noopener noreferrer">
                                                            <Video className="h-3.5 w-3.5 mr-1.5" /> Start Meet
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground italic self-center pr-2">No Meet link added</p>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm italic py-8 text-center bg-secondary/10 rounded-lg">No sessions pending for this date.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card className="border-none shadow-xl bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle>Create Broadcast</CardTitle>
                        <CardDescription className="text-neutral-400">Schedule a live session. Enrolled students are emailed automatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="course">Target Course</Label>
                             <Select value={course} onValueChange={setCourse}>
                                <SelectTrigger id="course" className="bg-white/5 border-black/[0.08]">
                                    <SelectValue placeholder="Choose curriculum" />
                                </SelectTrigger>
                                <SelectContent>
                                    {myCourses?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                    {myCourses?.length === 0 && <p className="p-2 text-xs text-muted-foreground">No active courses found.</p>}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="title">Session Title</Label>
                            <Input id="title" placeholder="e.g., Robot Assembly Live" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-black/[0.08]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meetLink" className="flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5" /> Google Meet Link
                                <span className="text-neutral-500 font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="meetLink"
                                type="url"
                                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                                value={meetLink}
                                onChange={e => setMeetLink(e.target.value)}
                                className="bg-white/5 border-black/[0.08]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Date</Label>
                                <div className="h-10 px-3 py-2 rounded-md bg-white/5 border border-black/[0.08] text-xs flex items-center">
                                    {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time (24h)</Label>
                                <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-white/5 border-black/[0.08]" />
                            </div>
                        </div>
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12 mt-4 shadow-lg shadow-accent/20" onClick={handleScheduleClass} disabled={isScheduling || coursesLoading}>
                            {isScheduling ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Confirm Schedule
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}
