'use client';

import { useState } from 'react';
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
import { GradeSubmissionDialog } from '@/components/grade-submission-dialog';
import { Eye, GraduationCap, Loader2, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, updateDoc, doc } from 'firebase/firestore';

export default function TeacherGradebookPage() {
    const { user, firestore } = useAuth();
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    
    // Fetch submissions where the current user is the teacher
    const submissionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'submissions'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: submissions, isLoading } = useCollection(submissionsQuery);

    const handleViewClick = (submission: any) => {
        setSelectedSubmission(submission);
    };

    const handleGradeSave = async (submissionId: string, grade: string, feedback: string) => {
        try {
            const subRef = doc(firestore, 'submissions', submissionId);
            await updateDoc(subRef, {
                grade,
                feedback,
                status: 'Graded',
                gradedAt: new Date().toISOString()
            });
            setSelectedSubmission(null);
        } catch (e) {}
    };

    if (isLoading) {
        return <div className="flex justify-center p-24"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>;
    }

  return (
    <>
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline tracking-tighter uppercase">Academic Gradebook</CardTitle>
          <CardDescription>
            Review technical deliverables and provide industry-grade feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="font-bold">Student Candidate</TableHead>
                  <TableHead className="font-bold">Unit / Deliverable</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Resource</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(sub => (
                    <TableRow key={sub.id} className="hover:bg-accent/5 transition-colors">
                      <TableCell className="font-bold">{sub.studentName}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{sub.assignmentTitle}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">ID: {sub.id.slice(0,8)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'Graded' ? 'default' : 'secondary'} className={sub.status === 'Graded' ? 'bg-green-600' : ''}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <a href={sub.submissionLink} target="_blank" className="text-accent hover:underline text-xs flex items-center gap-1 font-bold">
                            Source Link <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewClick(sub)} className="font-bold">
                            <Eye className="mr-2 h-4 w-4" />
                            Grade Work
                        </Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              icon={GraduationCap}
              title="No submissions pending"
              description="Student deliverables will appear here once they are transmitted via the technical vault."
            />
          )}
        </CardContent>
      </Card>
      {selectedSubmission && (
        <GradeSubmissionDialog
          assignment={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onGradeSave={(id, g, f) => handleGradeSave(selectedSubmission.id, g, f)}
        />
      )}
    </>
  )
}