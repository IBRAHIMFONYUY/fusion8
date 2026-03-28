'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore, useAuth } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, Mail, ExternalLink, GraduationCap, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function CourseRosterPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [roster, setRoster] = useState<any[]>([]);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRosterData() {
            if (!params.id || !user) return;
            try {
                setLoading(true);
                // 1. Fetch Course Identity
                const cSnap = await getDoc(doc(firestore, 'courses', params.id));
                if (!cSnap.exists()) {
                    router.push('/teacher/dashboard');
                    return;
                }
                setCourse(cSnap.data());

                // 2. Fetch Enrollments
                const q = query(collection(firestore, 'enrollments'), where('courseId', '==', params.id));
                const snap = await getDocs(q);
                
                // 3. Hydrate with User Profiles
                const hydrated = await Promise.all(snap.docs.map(async (eDoc) => {
                    const eData = eDoc.data();
                    const uSnap = await getDoc(doc(firestore, 'users', eData.studentId));
                    return {
                        ...eData,
                        studentProfile: uSnap.data() || { displayName: 'Unknown Student' }
                    };
                }));
                
                setRoster(hydrated);
            } catch (error) {
                console.error("Roster synchronization error:", error);
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) fetchRosterData();
    }, [params.id, user, authLoading, router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Accessing Student Vault...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline uppercase">{course?.title}</h1>
                    <p className="text-muted-foreground">Managing {roster.length} registered learners.</p>
                </div>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader className="bg-secondary/30 border-b border-dashed">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-accent" />
                                ENROLLMENT ROSTER
                            </CardTitle>
                            <CardDescription>Track trajectory and follow up on student technical progress.</CardDescription>
                        </div>
                        <Badge variant="outline" className="font-mono bg-background">ID: {params.id.slice(0,8)}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {roster.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/10">
                                    <TableHead className="font-bold">Student Candidate</TableHead>
                                    <TableHead className="font-bold text-center">Trajectory</TableHead>
                                    <TableHead className="font-bold">Enrollment Type</TableHead>
                                    <TableHead className="font-bold">Last Activity</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roster.map((item, idx) => (
                                    <TableRow key={idx} className="hover:bg-accent/5 transition-colors">
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={item.studentProfile.photoURL} />
                                                    <AvatarFallback>{item.studentProfile.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-sm">{item.studentProfile.displayName}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{item.studentProfile.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="min-w-[200px]">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    <span>Course Progress</span>
                                                    <span className="text-accent">{item.progress || 0}%</span>
                                                </div>
                                                <Progress value={item.progress || 0} className="h-1.5" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.scholarship ? 'secondary' : 'default'} className="text-[10px] uppercase font-black">
                                                {item.scholarship ? 'Scholarship' : 'Paid Plan'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {item.lastAccessedAt ? format(item.lastAccessedAt.toDate(), 'MMM d, p') : 'No activity'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={`mailto:${item.studentProfile.email}`} title="Follow up via email">
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                            <p className="text-muted-foreground italic">No students have enrolled in this curriculum track yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
