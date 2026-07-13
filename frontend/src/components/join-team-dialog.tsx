
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to Join "{project.title}"</DialogTitle>
          <DialogDescription>
            Team applications aren't open yet. Reach out to the project lead directly in the meantime.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
