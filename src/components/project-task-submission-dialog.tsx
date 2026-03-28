
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
import { Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useParams } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ProjectTaskSubmissionDialogProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, submission: { link: string; notes: string }) => void;
  currentUserRole: 'student' | 'teacher';
}

export function ProjectTaskSubmissionDialog({
  task,
  isOpen,
  onClose,
  onSubmit,
  currentUserRole,
}: ProjectTaskSubmissionDialogProps) {
  const params = useParams<{ id: string }>();
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionLink) {
      toast({
        variant: 'destructive',
        title: 'Missing Link',
        description: 'Please provide a link to your work (e.g., GitHub, Figma, Google Doc).',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const projectRef = doc(firestore, 'projects', params.id);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const tasks = projectSnap.data().tasks || [];
        const updatedTasks = tasks.map((t: any) => {
          if (t.id === task.id) {
            return {
              ...t,
              status: 'Submitted',
              submissionLink,
              submissionNotes,
              submittedAt: new Date().toISOString()
            };
          }
          return t;
        });

        await updateDoc(projectRef, { tasks: updatedTasks });
        
        toast({
          title: 'Venture Task Submitted',
          description: `Work for "${task.title}" has been updated in the project workspace.`,
        });
        
        onSubmit(task.id, { link: submissionLink, notes: submissionNotes });
      }
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `projects/${params.id}`,
        operation: 'update',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudent = currentUserRole === 'student';
  const isSubmitted = task.status === 'Submitted' || task.status === 'Done';

  const renderStudentView = () => (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-headline tracking-tighter">{task.title}</DialogTitle>
            <Badge variant={task.status === 'Done' ? 'default' : 'secondary'}>{task.status}</Badge>
        </div>
        <DialogDescription>
          {task.description}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-6">
        {isSubmitted && task.submissionLink ? (
            <div className='space-y-4'>
                <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                    <h4 className='font-bold text-xs uppercase text-accent mb-2'>Active Submission</h4>
                    <Link href={task.submissionLink} target="_blank" className="text-sm font-medium hover:underline flex items-center gap-2">
                        {task.submissionLink} <ExternalLink className="h-4 w-4"/>
                    </Link>
                </div>
                {task.submissionNotes && (
                    <div>
                        <h4 className='font-bold text-xs uppercase text-muted-foreground mb-2'>Team Notes</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">{task.submissionNotes}</p>
                    </div>
                )}
            </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="submission-link">Deliverable URL</Label>
              <div className="relative">
                <Input
                  id="submission-link"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="https://github.com/your-repo/pull/1"
                  required
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                   <LinkIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-notes">Contribution Notes</Label>
              <Textarea
                id="submission-notes"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="Explain what you built or any blockers the team should know about."
              />
            </div>
          </>
        )}
      </div>

      {!isSubmitted && (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !submissionLink}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transmit Work
          </Button>
        </DialogFooter>
      )}
    </form>
  );

  const renderTeacherView = () => (
     <div>
        <DialogHeader>
            <div className="flex justify-between items-center">
                <DialogTitle className="text-2xl font-headline tracking-tighter">{task.title}</DialogTitle>
                <Badge variant={task.status === 'Done' ? 'default' : 'secondary'}>{task.status}</Badge>
            </div>
            <DialogDescription>
            <strong>Venture Requirement:</strong> {task.description}
            </DialogDescription>
        </DialogHeader>

         <div className="grid gap-4 py-6">
            {isSubmitted && task.submissionLink ? (
                <div className='space-y-4'>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className='font-bold text-xs uppercase mb-2'>Candidate Submission</h4>
                        <Link href={task.submissionLink} target="_blank" className="text-sm text-accent font-medium hover:underline flex items-center gap-2">
                            {task.submissionLink} <ExternalLink className="h-4 w-4"/>
                        </Link>
                    </div>
                    {task.submissionNotes && (
                        <div>
                            <h4 className='font-bold text-xs uppercase text-muted-foreground mb-2'>Context</h4>
                            <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">{task.submissionNotes}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className='text-muted-foreground text-center py-8 italic'>Awaiting team submission...</p>
            )}
        </div>
        
        {isSubmitted && (
             <DialogFooter className="sm:justify-between">
                <Button variant="outline">Request Revisions</Button>
                <Button className="bg-accent text-accent-foreground font-bold">Approve Task</Button>
            </DialogFooter>
        )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {isStudent ? renderStudentView() : renderTeacherView()}
      </DialogContent>
    </Dialog>
  );
}
