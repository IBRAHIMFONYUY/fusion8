'use client';

import { useEffect, useState } from 'react';
import { collection, query, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, getDocs, writeBatch, orderBy } from 'firebase/firestore';
import { firestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { approveTeacher, rejectTeacher } from '@/lib/auth-actions';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X, Users as UsersIcon, Loader2, Trash2, GraduationCap, FileText, Newspaper, FileSpreadsheet, BellRing, Download } from 'lucide-react';
import { MentorAssignCell } from '@/components/mentor-assign-cell';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import type { UserProfile } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { sendEmail } from '@/services/email-service';

export default function AdminUsersPage() {
    const { role, user: currentUser } = useAuth();
    const { toast } = useToast();
    
    // DB Queries
    const usersQuery = useMemoFirebase(() => (!firestore || role !== 'admin') ? null : query(collection(firestore, 'users')), [firestore, role]);
    const appsQuery = useMemoFirebase(() => (!firestore || role !== 'admin') ? null : query(collection(firestore, 'teacher_applications')), [firestore, role]);
    const cohortQuery = useMemoFirebase(() => (!firestore || role !== 'admin') ? null : query(collection(firestore, 'cohort_applications')), [firestore, role]);
    const newsQuery = useMemoFirebase(() => (!firestore || role !== 'admin') ? null : query(collection(firestore, 'news_updates'), orderBy('createdAt', 'desc')), [firestore, role]);

    const { data: userList, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
    const { data: appList, isLoading: appsLoading } = useCollection<any>(appsQuery);
    const { data: cohortList, isLoading: cohortLoading } = useCollection<any>(cohortQuery);
    const { data: newsList, isLoading: newsLoading } = useCollection<any>(newsQuery);
    
    const enrollmentsQuery = useMemoFirebase(() => (!firestore || role !== 'admin') ? null : query(collection(firestore, 'enrollments')), [firestore, role]);
    const { data: enrollmentList } = useCollection<any>(enrollmentsQuery);
    
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [cohortApps, setCohortApps] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newsForm, setNewsForm] = useState({ title: '', content: '' });
    const [isPostingNews, setIsPostingNews] = useState(false);
    
    const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    useEffect(() => {
        if (!usersLoading && !appsLoading && !cohortLoading && !newsLoading) {
            setUsers(userList || []);
            setApplications(appList || []);
            setCohortApps(cohortList || []);
            setNews(newsList || []);
            setLoading(false);
        }
    }, [userList, appList, cohortList, newsList, usersLoading, appsLoading, cohortLoading, newsLoading]);

    

    const handleDownloadCSV = () => {
        if (cohortApps.length === 0) {
            toast({ title: "No Data", description: "There are no applications to download." });
            return;
        }

        const headers = [
            'Full Name', 'Email', 'WhatsApp', 'Age', 'Gender', 'City', 'Education Level',
            'Occupation', 'Current Skills', 'Hardware Experience', 'How Heard',
            'Project Idea', 'Expectations', 'Biggest Challenge',
            'Has Device', 'Can Commit', 'Emergency Contact', 'Emergency Phone',
            'Payment Ref', 'Applied At',
        ];

        const csvData = cohortApps.map(app => {
            const date = app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleDateString() : '';
            return [
                app.fullName || '',
                app.email || '',
                app.phone || '',
                app.age || '',
                app.gender || '',
                app.location || app.ageLocation || '',
                app.educationLevel || '',
                app.occupation || '',
                app.currentSkills || '',
                app.previousHardware || '',
                app.howHeard || '',
                app.projectIdea || '',
                app.expectations || '',
                app.biggestChallenge || '',
                app.hasDevice ? 'Yes' : 'No',
                app.canCommit ? 'Yes' : 'No',
                app.emergencyName || '',
                app.emergencyPhone || '',
                app.paymentRef || '',
                date,
            ];
        });

        const csvString = [
            headers.join(','),
            ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cohort_applications_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePlatformWipe = async () => {
        if (!firestore || !currentUser) return;
        try {
            const cols = ['users', 'enrollments', 'courses', 'cohort_applications', 'roles_admin', 'approved_teachers', 'notifications', 'assignments', 'submissions', 'teacher_applications', 'approved_teacher_emails', 'news_updates'];
            for (const colName of cols) {
                const snap = await getDocs(collection(firestore, colName));
                const batch = writeBatch(firestore);
                snap.docs.forEach((docSnap) => {
                    const isCEO = docSnap.id === currentUser.uid || docSnap.id === currentUser.email;
                    const isCEOMarker = colName === 'roles_admin' && docSnap.id === currentUser.uid;
                    if (!isCEO && !isCEOMarker) batch.delete(docSnap.ref);
                });
                await batch.commit();
            }
            toast({ title: "Platform Reset Complete" });
        } catch (error: any) {
             toast({ variant: 'destructive', title: "Wipe Failed", description: error.message });
        }
    };

    const handleAssignMentor = async (studentId: string, mentorId: string, mentorName: string) => {
        try {
            await updateDoc(doc(firestore, 'users', studentId), {
                mentorId: mentorId || null,
                mentorName: mentorName || null,
            });
            toast({ title: mentorId ? 'Mentor assigned' : 'Mentor cleared' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error?.message });
        }
    };

    const handleApproveTeacher = async (appId: string, email: string, teacherUid?: string) => {
        // Must call the server action — it atomically writes:
        // users/{uid}.approved, approved_teachers/{uid}, teacher_applications/{id}.status,
        // and approved_teacher_emails/{email}. Client-only writes missed the first two,
        // leaving approved teachers permanently stuck on the vetting screen.
        const uid = teacherUid ?? appId;
        const result = await approveTeacher({ teacherUid: uid, applicationId: appId, email });
        if (result.success) {
            toast({ title: "Approved", description: `${email} now has full lecturer access.` });
            sendEmail({
                to: email,
                template: 'teacher_approved',   
                data: {
                    sender: 'Fusion8',
                    message: 'Congratulations! Your teacher application has been approved. You now have full lecturer access.'
                }
            });
            
        } else {
            toast({ variant: 'destructive', title: "Approval Failed", description: result.error });
        }
    };

    const handleRejectTeacher = async (appId: string, teacherUid?: string) => {
        const uid = teacherUid ?? appId;
        const result = await rejectTeacher(uid);
        if (result.success) {
            toast({ title: "Rejected" });
        } else {
            toast({ variant: 'destructive', title: "Rejection Failed", description: result.error });
        }
    };

    // CMS Handlers
    const handlePostNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPostingNews(true);
        try {
            await addDoc(collection(firestore, 'news_updates'), {
                title: newsForm.title,
                content: newsForm.content,
                createdAt: serverTimestamp(),
                authorId: currentUser?.uid
            });
            toast({ title: "News Published", description: "This is now live on the landing page." });
            setNewsForm({ title: '', content: '' });
        } catch(err) { toast({ variant: 'destructive', title: "Failed to publish" }); }
        finally { setIsPostingNews(false); }
    };

    const handleDeleteNews = async (id: string) => {
        try {
            await deleteDoc(doc(firestore, 'news_updates', id));
            toast({ title: "News Deleted" });
        } catch(err) { toast({ variant: 'destructive', title: "Failed to delete" }); }
    };

    // Notification Handler
    const handleBroadcastTeachers = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBroadcasting(true);
        try {
            // Find all active teachers
            const activeTeachers = users.filter(u => u.role === 'teacher');
            const batch = writeBatch(firestore);
            activeTeachers.forEach(teacher => {
                const notifRef = doc(collection(firestore, 'notifications'));
                batch.set(notifRef, {
                    userId: teacher.id,
                    title: notifyForm.title,
                    message: notifyForm.message,
                    type: 'system',
                    read: false,
                    createdAt: serverTimestamp()
                });
            });
            await batch.commit();
            toast({ title: "Broadcast Sent", description: `Dispatched to ${activeTeachers.length} staff members.` });
            setNotifyForm({ title: '', message: '' });
        } catch(err) { toast({ variant: 'destructive', title: "Broadcast Failed" }); }
        finally { setIsBroadcasting(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-muted-foreground font-medium">Accessing centralized databases...</p>
            </div>
        );
    }

    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin');

    const getStudentApplication = (userId: string, email: string) => {
        return cohortApps.find(a => a.studentId === userId || a.email === email);
    };

    const getStudentEnrollments = (userId: string) => {
        return (enrollmentList || []).filter(e => e.studentId === userId);
    };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border">
        <div>
            <h1 className="text-2xl font-bold font-headline mb-1">Central Console</h1>
            <p className="text-muted-foreground text-sm">Organize students, review applications, publish news, and manage platform staff.</p>
        </div>
        {/* Destructive full-platform wipe — hidden by default for launch.
            Set NEXT_PUBLIC_ENABLE_PLATFORM_WIPE=true locally if you need it
            for a staging reset; there is no confirmation-typing/re-auth step
            behind this, so keep it off in any environment with real user data. */}
        {process.env.NEXT_PUBLIC_ENABLE_PLATFORM_WIPE === 'true' && (
          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="font-bold">
                      <Trash2 className="mr-2 h-4 w-4" /> Reset Platform Data
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Total Purge Confirmation</AlertDialogTitle>
                      <AlertDialogDescription>This will delete absolutely ALL generated data (users, courses, applications, logs).</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Abort</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePlatformWipe} className="bg-destructive hover:bg-destructive/90">Confirm Purge</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 mb-8 rounded-xl h-14">
            <TabsTrigger value="students" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <UsersIcon className="w-4 h-4 mr-2 hidden md:inline" /> Students
            </TabsTrigger>
            <TabsTrigger value="teachers" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white relative">
                <GraduationCap className="w-4 h-4 mr-2 hidden md:inline" /> Active Staff
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white relative">
                <FileText className="w-4 h-4 mr-2 hidden md:inline" /> Vetting Queue
                {applications.filter(a => a.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                        {applications.filter(a => a.status === 'pending').length}
                    </span>
                )}
            </TabsTrigger>
            <TabsTrigger value="news" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white relative">
                <Newspaper className="w-4 h-4 mr-2 hidden md:inline" /> News Center
            </TabsTrigger>
        </TabsList>

        {/* STUDENTS TAB - FOCUSED ON COHORT AUDITING */}
        <TabsContent value="students" className="space-y-4">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline">Student Matrix</CardTitle>
                        <CardDescription>Review cohort applications and export data for your sponsors.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadCSV} variant="outline" className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">
                        <Download className="h-4 w-4 mr-2" /> Download Bio Data
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                {students.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6 py-4">Participant Name</TableHead>
                                <TableHead>Email Contact</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead className="text-right px-6">Dataset Audit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(user => {
                                const appData = getStudentApplication(user.id, user.email);
                                return (
                                <TableRow key={user.id}>
                                    <TableCell className="px-6 font-semibold">{user.displayName}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <MentorAssignCell
                                            student={user}
                                            teachers={teachers}
                                            onSave={handleAssignMentor}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex gap-2 justify-end">
                                            {appData ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="bg-accent/10 border-accent/20 text-accent hover:bg-accent/20">
                                                            <FileSpreadsheet className="h-4 w-4 mr-2" /> Cohort Data
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="font-headline text-2xl uppercase tracking-tighter text-accent">Sponsor Audit Profile</DialogTitle>
                                                            <DialogDescription>Extracted cohort application for {user.displayName}.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-3 py-4 mt-2 border-t overflow-y-auto max-h-[60vh]">
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Applied On</p><p className="font-bold">{appData.appliedAt?.toDate ? appData.appliedAt.toDate().toLocaleDateString() : 'Unknown'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">WhatsApp</p><p className="font-bold">{appData.phone || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Age</p><p className="font-bold">{appData.age || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Gender</p><p className="font-bold">{appData.gender || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Location</p><p className="font-bold">{appData.location || appData.ageLocation || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Education</p><p className="font-bold">{appData.educationLevel || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Occupation</p><p className="font-bold">{appData.occupation || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">How Heard</p><p className="font-bold">{appData.howHeard || 'N/A'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Has Device</p><p className="font-bold">{appData.hasDevice ? '✅ Yes' : '❌ No'}</p></div>
                                                                <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Can Commit</p><p className="font-bold">{appData.canCommit ? '✅ Yes' : '❌ No'}</p></div>
                                                                <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Emergency Contact</p><p className="font-bold">{appData.emergencyName || 'N/A'} · {appData.emergencyPhone || ''}</p></div>
                                                                {appData.paymentRef && <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">Payment Ref</p><p className="font-bold font-mono text-xs">{appData.paymentRef}</p></div>}
                                                            </div>
                                                            <div className="bg-secondary p-4 rounded-xl">
                                                                <p className="text-xs font-bold uppercase text-accent tracking-widest mb-2 flex items-center gap-2"><Check className="h-4 w-4"/> Current Skillset</p>
                                                                <p className="text-sm font-medium">{appData.currentSkills || 'N/A'}</p>
                                                            </div>
                                                            {appData.previousHardware && (
                                                            <div className="bg-secondary p-4 rounded-xl">
                                                                <p className="text-xs font-bold uppercase text-accent tracking-widest mb-2 flex items-center gap-2"><Check className="h-4 w-4"/> Hardware Experience</p>
                                                                <p className="text-sm font-medium">{appData.previousHardware}</p>
                                                            </div>
                                                            )}
                                                            <div className="bg-secondary p-4 rounded-xl">
                                                                <p className="text-xs font-bold uppercase text-accent tracking-widest mb-2 flex items-center gap-2"><Check className="h-4 w-4"/> Project Idea</p>
                                                                <p className="text-sm font-medium">{appData.projectIdea || 'N/A'}</p>
                                                            </div>
                                                            <div className="bg-secondary p-4 rounded-xl">
                                                                <p className="text-xs font-bold uppercase text-accent tracking-widest mb-2 flex items-center gap-2"><Check className="h-4 w-4"/> Expectations</p>
                                                                <p className="text-sm font-medium">{appData.expectations || 'N/A'}</p>
                                                            </div>
                                                            {appData.biggestChallenge && (
                                                            <div className="bg-secondary p-4 rounded-xl">
                                                                <p className="text-xs font-bold uppercase text-accent tracking-widest mb-2 flex items-center gap-2"><Check className="h-4 w-4"/> Biggest Challenge</p>
                                                                <p className="text-sm font-medium">{appData.biggestChallenge}</p>
                                                            </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled className="text-xs opacity-50">No Cohort App</Button>
                                            )}
                                            
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                                                        <UsersIcon className="h-4 w-4 mr-2" /> View Profile
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="font-headline text-xl uppercase tracking-tighter">{user.displayName} - Profile</DialogTitle>
                                                        <DialogDescription>ID: <span className="font-mono text-xs text-accent">{user.id}</span></DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4 border-t">
                                                        <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-xl border">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Account Status</p>
                                                                <p className="font-bold mt-1 text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Active</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Identity</p>
                                                                <p className="font-bold mt-1">{user.email}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                                                                <GraduationCap className="h-4 w-4" /> Enrolled Courses
                                                            </h4>
                                                            <div className="border rounded-xl divide-y overflow-hidden shadow-sm">
                                                                {getStudentEnrollments(user.id).length > 0 ? (
                                                                    getStudentEnrollments(user.id).map(e => (
                                                                        <div key={e.id} className="p-3 bg-card flex justify-between items-center">
                                                                            <span className="font-mono text-xs">{e.courseId}</span>
                                                                            <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-500' : ''}>
                                                                                {e.status}
                                                                            </Badge>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center text-xs text-muted-foreground bg-secondary/20 italic">No paid enrollments on record.</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="py-12"><EmptyState icon={UsersIcon} title="No students found" description="Awaiting registrations." /></div>
                )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* STAFF AND BROADCSTING TAB */}
        <TabsContent value="teachers" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden h-full">
                        <CardHeader className="bg-secondary/30">
                            <CardTitle className="font-headline">Verified Staff Directory</CardTitle>
                            <CardDescription>Accounts granted authoring rights on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                        {teachers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6 py-4">Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>System ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="px-6">
                                            <div className="font-semibold">{user.displayName}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-[10px] text-muted-foreground">{user.id}</span>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12"><EmptyState icon={GraduationCap} title="No active staff" description="Approve an application to staff the platform." /></div>
                        )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
                    <Card className="border-none shadow-xl rounded-2xl bg-primary text-primary-foreground h-full">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <BellRing className="h-5 w-5" /> Staff Broadcast
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/70">Send a direct dashboard notification to all verified lecturers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleBroadcastTeachers} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="b_title" className="text-white">Alert Subject</Label>
                                    <Input id="b_title" required value={notifyForm.title} onChange={e => setNotifyForm({...notifyForm, title: e.target.value})} className="bg-primary-foreground/10 border-none text-white placeholder:text-white/50" placeholder="e.g. Mandatory Curriculum Update" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b_msg" className="text-white">Directive Message</Label>
                                    <Textarea id="b_msg" required value={notifyForm.message} onChange={e => setNotifyForm({...notifyForm, message: e.target.value})} className="bg-primary-foreground/10 border-none text-white placeholder:text-white/50 resize-none h-24" placeholder="Type your full directive here..." />
                                </div>
                                <Button type="submit" variant="secondary" className="w-full font-bold" disabled={isBroadcasting}>
                                    {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Transmit Broadcast'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* TEACHER APPLICATIONS TAB */}
        <TabsContent value="applications" className="space-y-4">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden border-orange-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent">
                    <CardTitle className="font-headline text-orange-900">Lecturer Vetting Queue</CardTitle>
                    <CardDescription>Review credentials and whitelist elite innovators.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                {applications.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-2">
                                <TableHead className="px-6 py-4">Applicant</TableHead>
                                <TableHead>Background Portfolio</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right px-6">Decision Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map(app => (
                            <TableRow key={app.id}>
                                <TableCell className="px-6 align-top pt-4">
                                    <div className="font-bold text-base">{app.fullName}</div>
                                    <div className="text-sm text-foreground/80">{app.email}</div>
                                    <div className="text-xs text-muted-foreground">{app.phone}</div>
                                </TableCell>
                                <TableCell className="align-top pt-4 min-w-[300px]">
                                    <p className="font-medium text-sm mb-1 line-clamp-2">Topics: {app.subjects || app.proposedTopics}</p>
                                    {app.city && <p className="text-xs text-muted-foreground">{app.city} · {app.yearsExperience}</p>}
                                    <p className="text-xs text-muted-foreground line-clamp-2 italic mt-1">"{app.motivation || app.experience}"</p>
                                    {app.linkedIn && <a href={app.linkedIn} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-1 block">LinkedIn ↗</a>}
                                </TableCell>
                                <TableCell className="align-top pt-4">
                                    <Badge variant={app.status === 'pending' ? 'outline' : app.status === 'approved' ? 'default' : 'destructive'} 
                                           className={app.status === 'approved' ? 'bg-green-600' : ''}>
                                        {app.status.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right px-6 align-top pt-4">
                                    {app.status === 'pending' && (
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApproveTeacher(app.id, app.email, app.uid ?? app.userId)}>
                                                <Check className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectTeacher(app.id, app.uid ?? app.userId)}>
                                                <X className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                    {app.status === 'approved' && <span className="text-xs font-bold text-green-600 block pt-2">Whitelisted</span>}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="py-12"><EmptyState icon={FileText} title="Inbox Empty" description="There are no pending applications." /></div>
                )}
                </CardContent>
            </Card>
        </TabsContent>
        
        {/* NEWS CMS TAB */}
        <TabsContent value="news" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
                
                {/* News Creating Form */}
                <div className="md:col-span-1 border-r pr-6">
                     <h3 className="font-bold text-xl mb-2 font-headline uppercase tracking-tighter">Draft New Bulletin</h3>
                     <p className="text-muted-foreground text-sm mb-6">This will be instantly published and visible to the public on the homepage.</p>
                     
                     <form onSubmit={handlePostNews} className="space-y-4">
                         <div className="space-y-2">
                             <Label>Headline / Title</Label>
                             <Input required value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} placeholder="e.g. Cohort 01 Registration Final Week!" className="font-bold border-accent/30 focus-visible:ring-accent" />
                         </div>
                         <div className="space-y-2">
                             <Label>Bulletin Content</Label>
                             <Textarea required value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} placeholder="Write the main details here..." className="h-32 resize-none border-accent/30 focus-visible:ring-accent" />
                         </div>
                         <Button type="submit" className="w-full bg-accent hover:bg-accent/90 focus:ring-accent" disabled={isPostingNews}>
                            {isPostingNews ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Publish to Homepage'}
                         </Button>
                     </form>
                </div>

                {/* News Managing Table */}
                <div className="md:col-span-2">
                     <h3 className="font-bold text-xl mb-6 font-headline uppercase tracking-tighter">Active Bulletins</h3>
                     <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                        {news.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary/20">
                                        <TableHead className="w-2/3">Headline</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {news.map(n => (
                                        <TableRow key={n.id}>
                                            <TableCell>
                                                <p className="font-bold text-base line-clamp-1">{n.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{n.content}</p>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteNews(n.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                        ) : (
                            <div className="py-12"><EmptyState icon={Newspaper} title="No active news" description="Draft a bulletin to inform the public." /></div>
                        )}
                     </div>
                </div>

            </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
