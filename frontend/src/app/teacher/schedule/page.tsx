
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Trash2, Loader2, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { notificationService } from '@/services/notification-service';
import type { SecurityRuleContext } from '@/firebase/errors';

export default function TeacherSchedulePage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, firestore } = useAuth();
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [course, setCourse] = useState('');
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
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
            createdAt: serverTimestamp(),
            status: 'scheduled'
        };
        
            addDoc(collection(firestore, 'broadcasts'), broadcastPayload)
            .then(async () => {
                await notificationService.notifyCourseStudents(course, {
                    message: `New live lab scheduled: "${title}" on ${format(selectedDate, 'PPP')} at ${time}.`,
                    type: 'LIVE_SESSION',
                    senderId: user.uid
                });
                toast({ title: 'Session Synchronized', description: 'Students have been notified via the Hub Dispatch.' });
                setCourse('');
                setTitle('');
                setTime('');
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
                        <CardDescription>Coordinate hardware lab broadcasts and Q&A sessions.</CardDescription>
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
                                    <div key={c.id} className="p-4 bg-background border rounded-lg flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-bold text-sm">{c.title}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase">TIME: {c.time} • LAB 01</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => router.push(`/teacher/live-session/${c.courseId}`)}>Initialize Tunnel</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
                        <CardDescription className="text-neutral-400">Initialize a secure broadcast tunnel.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="course">Target Course</Label>
                             <Select value={course} onValueChange={setCourse}>
                                <SelectTrigger id="course" className="bg-white/5 border-white/10">
                                    <SelectValue placeholder="Choose curriculum" />
                                </SelectTrigger>
                                <SelectContent>
                                    {myCourses?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                    {myCourses?.length === 0 && <p className="p-2 text-xs text-muted-foreground">No active courses found.</p>}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="title">Broadcast Title</Label>
                            <Input id="title" placeholder="e.g., Robot Assembly Live" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Date</Label>
                                <div className="h-10 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-xs flex items-center">
                                    {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time (24h)</Label>
                                <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-white/5 border-white/10" />
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
