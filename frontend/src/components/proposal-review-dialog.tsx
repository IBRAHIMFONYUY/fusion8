'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { ProjectProposal } from '@/types';

interface ProposalReviewDialogProps {
  proposal: ProjectProposal & { firestoreId: string };
  isOpen: boolean;
  onClose: () => void;
  db: Firestore;
}

export function ProposalReviewDialog({ proposal, isOpen, onClose, db }: ProposalReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState(proposal.reviewNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const isPending = proposal.status === 'pending';

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      // 1. Create project in projects collection
      await addDoc(collection(db, 'projects'), {
        title: proposal.title,
        description: proposal.problemStatement,
        studentLeadId: proposal.studentLeadId,
        status: 'recruiting',
        category: 'Community',
        skillsNeeded: proposal.skillsNeeded,
        teamSize: { total: 4 },
        openRoles: ['Developer', 'Designer', 'Researcher'],
        members: { [proposal.studentLeadId]: 'lead' },
        createdAt: serverTimestamp(),
        fromProposalId: proposal.firestoreId,
      });

      // 2. Update proposal status
      await updateDoc(doc(db, 'project_proposals', proposal.firestoreId), {
        status: 'approved',
        reviewNotes: reviewNotes || null,
        reviewedAt: serverTimestamp(),
      });

      toast({ title: 'Proposal Approved', description: 'A new project has been created in the recruiting phase.' });
      onClose();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to approve', description: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      toast({ variant: 'destructive', title: 'Feedback Required', description: 'Provide feedback before rejecting.' });
      return;
    }
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'project_proposals', proposal.firestoreId), {
        status: 'rejected',
        reviewNotes,
        reviewedAt: serverTimestamp(),
      });
      toast({ title: 'Proposal Rejected', description: 'The student has been notified.' });
      onClose();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to reject', description: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const statusColor =
    proposal.status === 'approved'
      ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
      : proposal.status === 'rejected'
      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-xl font-bold font-headline leading-snug pr-4">
              {proposal.title}
            </DialogTitle>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${statusColor}`}>
              {proposal.status}
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Submitted on {new Date(proposal.submittedAt as any).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">The Problem</Label>
              <p className="text-sm p-3 bg-secondary/50 rounded-xl min-h-[100px] leading-relaxed">{proposal.problemStatement}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposed Solution</Label>
              <p className="text-sm p-3 bg-secondary/50 rounded-xl min-h-[100px] leading-relaxed">{proposal.proposedSolution}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills Needed</Label>
              <div className="flex flex-wrap gap-1.5">
                {proposal.skillsNeeded.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="text-xs rounded-lg">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isPending ? 'Reviewer Feedback' : 'Review Notes'}
              </Label>
              <Textarea
                rows={6}
                placeholder={isPending ? 'Provide feedback for the student…' : 'No feedback provided.'}
                value={isPending ? reviewNotes : (proposal.reviewNotes || '')}
                onChange={(e) => setReviewNotes(e.target.value)}
                disabled={!isPending}
                className="rounded-xl resize-none text-sm"
              />
              {isPending && (
                <p className="text-xs text-muted-foreground">Feedback is required when rejecting a proposal.</p>
              )}
            </div>
          </div>
        </div>

        {isPending && (
          <DialogFooter className="gap-2 pt-2">
            <Button
              onClick={handleReject}
              variant="destructive"
              disabled={isSaving}
              className="rounded-xl"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
              Approve & Create Project
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
