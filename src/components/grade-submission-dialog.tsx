
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
import { Loader2, FileText, Download } from 'lucide-react';
import type { Assignment } from '@/types';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface GradeSubmissionDialogProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onGradeSave: (assignmentId: number, grade: string, feedback: string) => void;
}

export function GradeSubmissionDialog({
  assignment,
  isOpen,
  onClose,
  onGradeSave,
}: GradeSubmissionDialogProps) {
  const [grade, setGrade] = useState(assignment.grade || '');
  const [feedback, setFeedback] = useState(assignment.feedback || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!grade) {
      toast({
        variant: 'destructive',
        title: 'Missing Grade',
        description: 'Please select a grade before saving.',
      });
      return;
    }

    setIsSaving(true);
    // TODO: Mock save process. This should be a POST request to a Python API.
    // Example: POST /api/v1/assignments/grade
    // Body: { assignmentId: ..., grade: ..., feedback: ... }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onGradeSave(assignment.id, grade, feedback);
    setIsSaving(false);

    toast({
      title: 'Grade Saved!',
      description: `The grade for "${assignment.title}" has been saved.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
             <DialogTitle className="text-2xl">Grade Submission</DialogTitle>
             <Badge variant={assignment.status === 'Graded' ? 'default' : 'secondary'} className={assignment.status === 'Graded' ? 'bg-green-600' : ''}>{assignment.status}</Badge>
          </div>
          <DialogDescription>
            Review the student's submission and provide a grade and feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Submission Details</h4>
                <div className="space-y-1">
                    <Label className="text-muted-foreground">Submission Title</Label>
                    <p className="font-semibold">{assignment.submissionTitle || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md min-h-[60px]">{assignment.submissionDescription || 'No description provided.'}</p>
                </div>
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">Problems Encountered</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md min-h-[60px]">{assignment.submissionProblems || 'No problems reported.'}</p>
                </div>
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Submitted File</Label>
                    <div className="flex items-center gap-3 p-3 border rounded-md">
                        <FileText className="h-6 w-6 text-primary" />
                        <span className="flex-1 text-sm font-medium truncate">{assignment.submissionFile || 'submission.pdf'}</span>
                        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Download</Button>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Grading</h4>
                 <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select value={grade} onValueChange={setGrade}>
                        <SelectTrigger id="grade" className="w-[120px]">
                            <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A">A (Excellent)</SelectItem>
                            <SelectItem value="B">B (Good)</SelectItem>
                            <SelectItem value="C">C (Average)</SelectItem>
                            <SelectItem value="D">D (Poor)</SelectItem>
                            <SelectItem value="F">F (Fail)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                     <Textarea 
                        id="feedback" 
                        rows={8} 
                        placeholder="Provide constructive feedback for the student..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                 </div>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !grade}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Grade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
