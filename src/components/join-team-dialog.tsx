
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types';
import { useMockStore } from '@/hooks/useMockStore';

interface JoinTeamDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function JoinTeamDialog({
  project,
  isOpen,
  onClose,
}: JoinTeamDialogProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [pitch, setPitch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { addApplicantToProject } = useMockStore() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !pitch) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a role and write a pitch.',
      });
      return;
    }

    setIsSubmitting(true);
    const applicantPayload = {
        id: Date.now(),
        userId: 1, // Mocked current user ID
        name: 'John Doe', // Mocked current user name
        avatarId: 'avatar-1', // Mocked current user avatar
        applyingFor: selectedRole,
        pitch: pitch,
    };

    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    addApplicantToProject(project.id, applicantPayload);

    setIsSubmitting(false);
    toast({
      title: 'Application Sent!',
      description: `Your application to join "${project.title}" as a ${selectedRole} has been sent to the project lead.`,
    });
    onClose();
    // Reset form after a delay
    setTimeout(() => {
        setSelectedRole('');
        setPitch('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply to Join "{project.title}"</DialogTitle>
            <DialogDescription>
              Submit your application to the project lead. Explain why you're a great fit for the team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Which role are you applying for?</Label>
               <Select value={selectedRole} onValueChange={setSelectedRole} required>
                  <SelectTrigger id="role">
                      <SelectValue placeholder="Select an open role" />
                  </SelectTrigger>
                  <SelectContent>
                      {(project.openRoles || []).map((role: string) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pitch">Your Pitch</Label>
              <Textarea
                id="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Briefly describe your relevant skills and why you're excited about this project..."
                required
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedRole || !pitch}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Send Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
