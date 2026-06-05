'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCog } from 'lucide-react';
import type { UserProfile } from '@/lib/auth';

interface MentorAssignCellProps {
  student: UserProfile;
  teachers: UserProfile[];
  onSave: (
    studentId: string,
    mentorId: string,
    mentorName: string,
  ) => Promise<void>;
}

const UNASSIGNED = '__unassigned__';

export function MentorAssignCell({
  student,
  teachers,
  onSave,
}: MentorAssignCellProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(student.mentorId || UNASSIGNED);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selected === UNASSIGNED) {
        await onSave(student.id, '', '');
      } else {
        const mentor = teachers.find((t) => t.id === selected);
        await onSave(student.id, selected, mentor?.displayName || 'Mentor');
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {student.mentorId ? (
          <button
            type="button"
            className="flex items-center gap-2 text-left group"
          >
            <Badge variant="secondary" className="font-medium group-hover:bg-secondary/80">
              {student.mentorName || 'Mentor assigned'}
            </Badge>
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <UserCog className="h-3.5 w-3.5 mr-1.5" />
            Assign mentor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign mentor</DialogTitle>
          <DialogDescription>
            Pick a teacher to mentor {student.displayName}. They will see this
            student in their mentees list.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>— No mentor —</SelectItem>
              {teachers
                .filter((t) => t.role === 'teacher' || t.role === 'admin')
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.displayName} ({t.role})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {teachers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No teachers available yet. Approve a lecturer application first.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
