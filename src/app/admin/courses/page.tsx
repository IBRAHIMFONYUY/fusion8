
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, CheckCircle, XCircle, BookOpen, Loader2, Users, ExternalLink, Archive, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { lmsService, LMSCourse } from '@/services/lms-service';
import { EmptyState } from '@/components/ui/empty-state';
import { getDocs, query, collection, where, doc, getDoc } from 'firebase/firestore';
import { notificationService } from '@/services/notification-service';
import { firestore, useAuth, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

export default function AdminCoursesPage() {
    const { role } = useAuth();
    const [courses, setCourses] = useState<LMSCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
    const [selectedRoster, setSelectedRoster] = useState<{ id: string, title: string } | null>(null);
    const [rosterData, setRosterData] = useState<any[]>([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<LMSCourse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    useEffect(() => { 
        if (role === 'admin') loadCourses(); 
    }, [role]);

    async function loadCourses() {
        try {
            setLoading(true);
            const data = await lmsService.getAllCoursesAdmin();
            setCourses(data);
            
            const names: Record<string, string> = {};
            for (const course of data) {
                if (!names[course.teacherId]) {
                    const uRef = doc(firestore, 'users', course.teacherId);
                    const uSnap = await getDoc(uRef).catch(async (err: any) => {
                        if (err.code === 'permission-denied') {
                            errorEmitter.emit('permission-error', new FirestorePermissionError({
                                path: uRef.path,
                                operation: 'get',
                            }));
                        }
                        throw err;
                    });
                    
                    if (uSnap.exists()) {
                        names[course.teacherId] = uSnap.data().displayName || 'Instructor';
                    } else {
                        names[course.teacherId] = 'Unknown';
                    }
                }
            }
            setTeacherNames(names);
        } catch (error: any) {
            // Already reported by service or hook
        } finally {
            setLoading(false);
        }
    }

    const fetchRoster = async (courseId: string, title: string) => {
        setSelectedRoster({ id: courseId, title });
        setRosterLoading(true);
        try {
            const q = query(collection(firestore, 'enrollments'), where('courseId', '==', courseId));
            const snap = await getDocs(q).catch(async (err: any) => {
                if (err.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: 'enrollments',
                        operation: 'list',
                    }));
                }
                throw err;
            });
            const enrollments = snap.docs.map(d => d.data());
            
            const hydrated = await Promise.all(enrollments.map(async (e: any) => {
                const uRef = doc(firestore, 'users', e.studentId);
                const uSnap = await getDoc(uRef).catch(async (err: any) => {
                    if (err.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: uRef.path,
                            operation: 'get',
                        }));
                    }
                    throw err;
                });
                const uData = uSnap.data();
                return { ...e, displayName: uData?.displayName || 'Unknown' };
            }));
            setRosterData(hydrated);
        } catch (error: any) {
            // Permission errors handled by emitters
        } finally {
            setRosterLoading(false);
        }
    };

    const handleSetStatus = async (courseId: string, status: LMSCourse['status']) => {
        try {
            await lmsService.updateCourseStatus(courseId, status);
            toast({ title: `Course status set to ${status}` });
            
            if (status === 'published') {
                const course = courses.find(c => c.id === courseId);
                if (course) {
                    await notificationService.notifyAllStudents({
                        message: `New curriculum unlocked: ${course.title}`,
                        type: 'NEW_COURSE',
                        courseId: course.id,
                    });
                }
            }
            
            loadCourses();
        } catch (error) {
            toast({ variant: 'destructive', title: "Update Failed" });
        }
    };

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
        setIsDeleting(true);
        try {
            await lmsService.deleteCourse(courseToDelete.id);
            toast({ title: "Course Purged", description: "All modules and lessons have been removed from the platform." });
            setCourseToDelete(null);
            loadCourses();
        } catch (error) {
            toast({ variant: 'destructive', title: "Deletion Failed" });
        } finally {
            setIsDeleting(false);
        }
    };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center p-24">
              <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
              <p className="text-muted-foreground font-medium">Loading curriculum database...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
        <Card className="border-none shadow-xl">
        <CardHeader>
            <CardTitle className="font-headline tracking-tighter uppercase">Global Course Governance</CardTitle>
            <CardDescription>Review submissions from lecturers and manage catalog publication.</CardDescription>
        </CardHeader>
        <CardContent>
            {courses.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow className="bg-secondary/30">
                    <TableHead className="font-bold">Course Title</TableHead>
                    <TableHead className="font-bold">Instructor</TableHead>
                    <TableHead className="font-bold">Distribution</TableHead>
                    <TableHead className="font-bold">Current State</TableHead>
                    <TableHead className="font-bold text-right">Authority</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {courses.map(course => (
                    <TableRow key={course.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell className="font-bold py-6">
                            <Link href={`/courses/${course.id}`} target="_blank" className="flex items-center gap-2 hover:text-accent transition-colors">
                                {course.title} <ExternalLink className="h-3 w-3" />
                            </Link>
                        </TableCell>
                        <TableCell className="font-medium text-xs text-muted-foreground">
                            {teacherNames[course.teacherId] || course.teacherId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" className="font-bold text-accent h-auto p-0" onClick={() => fetchRoster(course.id, course.title)}>
                                {course.enrolledCount || 0} students
                            </Button>
                        </TableCell>
                        <TableCell>
                            <Badge variant={
                                course.status === 'published' ? 'default' : 
                                course.status === 'pending' ? 'secondary' : 
                                'outline'
                            } className={course.status === 'published' ? 'bg-green-600' : course.status === 'pending' ? 'animate-pulse' : ''}>
                                {course.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {course.status === 'pending' && (
                                        <DropdownMenuItem onClick={() => handleSetStatus(course.id, 'published')} className="text-green-600 font-bold">
                                            <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
                                        </DropdownMenuItem>
                                    )}
                                    {course.status === 'published' ? (
                                        <DropdownMenuItem onClick={() => handleSetStatus(course.id, 'draft')}>
                                            <Archive className="mr-2 h-4 w-4" /> Unpublish (Draft)
                                        </DropdownMenuItem>
                                    ) : (
                                        course.status !== 'pending' && (
                                            <DropdownMenuItem onClick={() => handleSetStatus(course.id, 'published')} className="text-green-600 font-bold">
                                                <CheckCircle className="mr-2 h-4 w-4" /> Publish Now
                                            </DropdownMenuItem>
                                        )
                                    )}
                                    <DropdownMenuItem onClick={() => handleSetStatus(course.id, 'draft')} className="text-destructive">
                                        <XCircle className="mr-2 h-4 w-4" /> Reject to Draft
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setCourseToDelete(course)} className="text-red-600 font-bold">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Track
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            ) : <EmptyState icon={BookOpen} title="Database Empty" description="No courses found in the system." />}
        </CardContent>
        </Card>

        {selectedRoster && (
            <Dialog open={!!selectedRoster} onOpenChange={() => setSelectedRoster(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Enrollment Roster: {selectedRoster.title}</DialogTitle>
                        <DialogDescription>Detailed list of registered platform participants.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {rosterLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                        ) : rosterData.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rosterData.map((e, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{e.displayName}</TableCell>
                                            <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                                            <TableCell>{e.scholarship ? 'Scholarship' : 'Paid'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="p-8 text-center text-muted-foreground italic">No students enrolled yet.</p>}
                    </div>
                </DialogContent>
            </Dialog>
        )}

        <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
            <AlertDialogContent className="bg-destructive text-destructive-foreground">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white font-black text-2xl">CRITICAL ACTION REQUIRED</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/80 font-medium">
                        You are about to permanently delete <strong>{courseToDelete?.title}</strong>. This will instantly purge all modules, lessons, and video references from the curriculum database.
                        <br /><br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">Abort</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDeleteCourse} 
                        className="bg-white text-destructive hover:bg-neutral-200 font-black"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : "CONFIRM PURGE"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
