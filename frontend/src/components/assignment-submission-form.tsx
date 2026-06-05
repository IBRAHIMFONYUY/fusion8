
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UploadCloud, Info } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, useAuth } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AssignmentSubmissionFormProps {
  assignment: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignmentSubmissionForm({
  assignment,
  isOpen,
  onClose,
  onSuccess,
}: AssignmentSubmissionFormProps) {
  const { user } = useAuth();
  const [submissionLink, setSubmissionLink] = useState('');
  const [problems, setProblems] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !submissionLink) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a link to your deliverable.',
      });
      return;
    }

    setIsSubmitting(true);

    const submissionId = `${user.uid}_${assignment.id}`;
    const submissionRef = doc(firestore, 'submissions', submissionId);
    
    const payload = {
      id: submissionId,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentId: user.uid,
      studentName: user.displayName || 'Unknown Student',
      courseId: assignment.courseId,
      teacherId: assignment.teacherId, // Required for security rules
      submissionLink,
      problems,
      status: 'Submitted',
      submittedAt: serverTimestamp(),
    };

    setDoc(submissionRef, payload, { merge: true })
      .then(() => {
        toast({
          title: 'Submission Received',
          description: `Your work for "${assignment.title}" has been transmitted to the lecturer.`,
        });
        setIsSubmitting(false);
        onSuccess();
      })
      .catch(async (error) => {
        setIsSubmitting(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: submissionRef.path,
          operation: 'create',
          requestResourceData: payload,
        }));
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
            <DialogDescription>
              Provide the link to your technical work for <strong>{assignment.title}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="submission-link">Resource Link (GitHub / Drive / Figma)</Label>
              <div className="relative">
                <Input
                  id="submission-link"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="https://github.com/..."
                  required
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                   <UploadCloud className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="submission-problems">Notes / Blockers (Optional)</Label>
              <Textarea
                id="submission-problems"
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                placeholder="Describe any challenges you faced during this unit."
              />
            </div>
            <Alert className="bg-secondary/50 border-dashed">
              <Info className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-widest">Submission Policy</AlertTitle>
              <AlertDescription className="text-[10px]">
                Once submitted, your work will be locked for grading. Ensure your link is publicly accessible to the instructor.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !submissionLink}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Transmitting...' : 'Confirm Submission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
