
'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { AssignmentSubmissionForm } from '@/components/assignment-submission-form';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Loader2, CheckCircle2, Clock, Paperclip, FileIcon, Youtube, Github, Link2, ExternalLink } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function StudentAssignmentsPage() {
  const { user, firestore } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    async function loadEnrollments() {
      if (!user || !firestore) return;
      const snap = await getDocs(
        query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid)),
      );
      setEnrolledCourseIds(snap.docs.map((d) => d.data().courseId));
    }
    loadEnrollments();
  }, [user, firestore]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'assignments'));
  }, [firestore, user]);

  const { data: allAssignments, isLoading } = useCollection<any>(assignmentsQuery);

  const assignments = (allAssignments || []).filter((a) =>
    enrolledCourseIds === null
      ? true
      : !a.courseId || enrolledCourseIds.includes(a.courseId),
  );

  // 2. Fetch user submissions to check status
  useEffect(() => {
    async function syncSubmissions() {
      if (!user || !firestore) return;
      try {
        const q = query(collection(firestore, 'submissions'), where('studentId', '==', user.uid));
        const snap = await getDocs(q);
        const subMap: Record<string, any> = {};
        snap.forEach(d => {
          subMap[d.data().assignmentId] = d.data();
        });
        setSubmissions(subMap);
      } catch (e) {
        console.error("Submission sync failed");
      } finally {
        setIsSyncing(false);
      }
    }
    syncSubmissions();
  }, [user, firestore, allAssignments]);

  const handleSubmitClick = (assignment: any) => {
    setViewingAssignment(null);
    setSelectedAssignment(assignment);
  };

  const matIcon = (type: string) => {
    if (type === 'pdf') return FileIcon;
    if (type === 'video') return Youtube;
    if (type === 'github') return Github;
    return Link2;
  };

  if (isLoading || isSyncing || enrolledCourseIds === null) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-24 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground animate-pulse">Syncing academic records...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black font-headline tracking-tighter uppercase">Academic Workspace</h1>
                <p className="text-muted-foreground">Submit and track your technical deliverables.</p>
            </div>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-dashed">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                ACTIVE DELIVERABLES
            </CardTitle>
            <CardDescription>
                Deliverables assigned by mentors across your enrolled courses.
            </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
            {assignments && assignments.length > 0 ? (
                <>
                {/* Mobile card layout — shown below sm */}
                <div className="sm:hidden divide-y divide-border">
                    {assignments.map(assignment => {
                    const submission = submissions[assignment.id];
                    return (
                        <div key={assignment.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{assignment.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {assignment.id.slice(0,8)}</p>
                            </div>
                            {submission ? (
                            <Badge className="bg-green-600 text-white border-none shrink-0 flex items-center gap-1 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" /> Submitted
                            </Badge>
                            ) : (
                            <Badge variant="secondary" className="opacity-60 shrink-0 text-[10px]">Pending</Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{assignment.dueDate || 'Flexible'}</span>
                            </div>
                            {!submission ? (
                            <Button onClick={() => handleSubmitClick(assignment)} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-8 text-xs px-4">
                                Submit
                            </Button>
                            ) : (
                            <Button variant="ghost" size="sm" className="text-xs font-bold h-8" disabled>
                                Under Review
                            </Button>
                            )}
                        </div>
                        </div>
                    );
                    })}
                </div>

                {/* Table layout — shown on sm+ with horizontal scroll fallback */}
                <div className="hidden sm:block overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow className="bg-secondary/30">
                    <TableHead className="font-bold">Assignment Unit</TableHead>
                    <TableHead className="font-bold">Deadline</TableHead>
                    <TableHead className="font-bold">Work Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map(assignment => {
                    const submission = submissions[assignment.id];
                    return (
                        <TableRow key={assignment.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell className="py-6">
                            <button onClick={() => setViewingAssignment(assignment)} className="text-left hover:text-accent transition-colors">
                              <p className="font-bold text-sm hover:underline">{assignment.title}</p>
                              {(assignment.materials || []).length > 0 && (
                                <p className="text-[10px] text-accent font-bold flex items-center gap-1 mt-0.5">
                                  <Paperclip className="h-2.5 w-2.5" /> {assignment.materials.length} material{assignment.materials.length > 1 ? 's' : ''} attached
                                </p>
                              )}
                            </button>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {assignment.dueDate || 'Flexible'}
                            </div>
                        </TableCell>
                        <TableCell>
                            {submission ? (
                                <Badge className="bg-green-600 text-white border-none flex w-fit gap-1 items-center">
                                    <CheckCircle2 className="h-3 w-3" /> Submitted
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="opacity-60">Not Started</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            {!submission ? (
                                <Button onClick={() => handleSubmitClick(assignment)} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                                    Submit Work
                                </Button>
                            ) : (
                                <Button variant="ghost" size="sm" className="text-xs font-bold" disabled>
                                    Under Review
                                </Button>
                            )}
                        </TableCell>
                        </TableRow>
                    )
                    })}
                </TableBody>
                </Table>
                </div>
                </>
            ) : (
                <div className="p-12">
                    <EmptyState 
                    icon={FileText}
                    title="No assignments assigned"
                    description="Your mentor has not synchronized any specific deliverables yet. Follow the units in your course library."
                    action={{ text: 'Continue Learning', href: '/student/courses' }}
                    />
                </div>
            )}
            </CardContent>
        </Card>
      </div>

      {selectedAssignment && (
        <AssignmentSubmissionForm
            assignment={selectedAssignment}
            isOpen={!!selectedAssignment}
            onClose={() => setSelectedAssignment(null)}
            onSuccess={() => {
                setSelectedAssignment(null);
                setIsSyncing(true);
            }}
        />
      )}

      {/* Assignment detail / materials viewer */}
      {viewingAssignment && (
        <Dialog open={!!viewingAssignment} onOpenChange={() => setViewingAssignment(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl pr-6">{viewingAssignment.title}</DialogTitle>
              <DialogDescription>
                {viewingAssignment.courseTitle} · Due: {viewingAssignment.dueDate || 'Flexible'}
                {viewingAssignment.maxScore ? ` · ${viewingAssignment.maxScore} pts` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {viewingAssignment.description && (
                <div className="bg-secondary/30 rounded-xl p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">Instructions</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewingAssignment.description}</p>
                </div>
              )}
              {(viewingAssignment.materials || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5" /> Reference Materials ({viewingAssignment.materials.length})
                  </p>
                  {viewingAssignment.materials.map((m: any, i: number) => {
                    const Icon = matIcon(m.type);
                    return (
                      <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-secondary/30 hover:bg-accent/10 border border-black/[0.06] hover:border-accent/20 rounded-xl transition-all group">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold group-hover:text-accent transition-colors">{m.label}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{m.url}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                      </a>
                    );
                  })}
                </div>
              )}
              {!submissions[viewingAssignment.id] ? (
                <Button
                  onClick={() => handleSubmitClick(viewingAssignment)}
                  className="w-full bg-accent hover:bg-orange-600 text-white font-bold h-11 rounded-xl"
                >
                  Submit My Work
                </Button>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Work submitted — under review by mentor
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
