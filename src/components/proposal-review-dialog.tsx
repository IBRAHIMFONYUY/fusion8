
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ProjectProposal, Project } from '@/types';
import { useMockStore } from '@/hooks/useMockStore';
import { Badge } from './ui/badge';

interface ProposalReviewDialogProps {
  proposal: ProjectProposal;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (proposalId: number, status: 'approved' | 'rejected', feedback?: string) => void;
}

export function ProposalReviewDialog({
  proposal,
  isOpen,
  onClose,
  onStatusChange,
}: ProposalReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { addProject } = useMockStore() as any;

  const handleApprove = async () => {
    setIsSaving(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newProject: Project = {
        id: `p${Date.now()}`,
        title: proposal.title,
        description: proposal.problemStatement, 
        team: [proposal.studentLeadId], 
        status: 'recruiting',
        tasks: [],
        skillsNeeded: proposal.skillsNeeded,
        studentLeadId: proposal.studentLeadId,
        category: 'Community', 
        teamSize: { total: 4 }, 
        openRoles: ['Developer', 'Designer', 'Marketer']
    };

    addProject(newProject);
    onStatusChange(proposal.id, 'approved', reviewNotes);
    
    setIsSaving(false);
    toast({ title: 'Proposal Approved!', description: 'A new project has been created and is now in the recruiting phase.' });
  };
  
  const handleReject = async () => {
      if(!reviewNotes) {
          toast({ variant: 'destructive', title: 'Feedback Required', description: 'Please provide feedback for the student before rejecting.'});
          return;
      }
      setIsSaving(true);
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onStatusChange(proposal.id, 'rejected', reviewNotes);
      
      setIsSaving(false);
      toast({ title: 'Proposal Rejected', description: 'The student has been notified.' });
  };

  const isPending = proposal.status === 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
             <DialogTitle className="text-2xl">{proposal.title}</DialogTitle>
             <Badge variant={proposal.status === 'approved' ? 'default' : proposal.status === 'rejected' ? 'destructive' : 'secondary'} className={proposal.status === 'approved' ? 'bg-green-600' : ''}>{proposal.status}</Badge>
          </div>
          <DialogDescription>
            Submitted by Jane Doe on {new Date(proposal.submittedAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-muted-foreground">The Local Problem</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md min-h-[100px]">{proposal.problemStatement}</p>
                </div>
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">Proposed Solution</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md min-h-[100px]">{proposal.proposedSolution}</p>
                </div>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Skills Needed</Label>
                    <div className="flex flex-wrap gap-2">
                        {proposal.skillsNeeded.map((skill: string) => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label className="text-muted-foreground">Supporting Document</Label>
                    <Button variant="outline" className="w-full justify-start">
                        <Download className="mr-2 h-4 w-4"/>
                        Download Proposal.pdf
                    </Button>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="review-notes" className="text-muted-foreground">Feedback / Review Notes</Label>
                    <Textarea 
                        id="review-notes" 
                        rows={5} 
                        placeholder={isPending ? "Provide feedback for the student..." : "No feedback provided."}
                        value={isPending ? reviewNotes : (proposal.reviewNotes || '')}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        disabled={!isPending}
                    />
                 </div>
            </div>
        </div>

        {isPending && (
             <DialogFooter className="gap-2 sm:gap-0">
                <Button onClick={handleReject} variant="destructive" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown />}
                    Reject
                </Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp />}
                    Approve
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
