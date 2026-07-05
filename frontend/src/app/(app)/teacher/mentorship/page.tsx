'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { firestore, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Loader2,
  CalendarPlus,
  Mail,
  StickyNote,
  Trash2,
  Flame,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────────

interface Mentee {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  currentStreak?: number;
  enrolledCount?: number;
  avgProgress?: number;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  progress?: number;
  status?: string;
}

interface MentorSession {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  type: 'office_hours' | 'project_review' | 'career' | 'technical';
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface MentorNote {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  note: string;
  createdAt: { toDate?: () => Date } | null;
}

// ── Session type labels ─────────────────────────────────────────────────────────

const SESSION_TYPES: { value: MentorSession['type']; label: string }[] = [
  { value: 'office_hours', label: 'Office Hours' },
  { value: 'project_review', label: 'Project Review' },
  { value: 'career', label: 'Career Guidance' },
  { value: 'technical', label: 'Technical Deep-Dive' },
];

function sessionTypeLabel(type: string): string {
  return SESSION_TYPES.find((t) => t.value === type)?.label ?? type;
}

// ── Status badge helper ─────────────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: MentorSession['status'] }) {
  if (status === 'scheduled')
    return (
      <Badge className="bg-accent text-white border-none text-[10px] font-bold uppercase tracking-widest">
        Scheduled
      </Badge>
    );
  if (status === 'completed')
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none text-[10px] font-bold">
        Completed
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-[10px] font-bold">
      Cancelled
    </Badge>
  );
}

// ── Initials helper ─────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Leave Note Dialog ───────────────────────────────────────────────────────────

function LeaveNoteDialog({
  mentee,
  mentorId,
  onSaved,
}: {
  mentee: Mentee;
  mentorId: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(firestore, 'mentor_notes'), {
        mentorId,
        studentId: mentee.id,
        studentName: mentee.displayName,
        note: noteText.trim(),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Note saved', description: `Added note for ${mentee.displayName}.` });
      setNoteText('');
      setOpen(false);
      onSaved();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save note' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-8 text-xs font-bold border-border hover:border-accent hover:text-accent transition-colors"
        >
          <StickyNote className="mr-1.5 h-3.5 w-3.5" />
          Leave Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline font-extrabold tracking-tight">
            Note for {mentee.displayName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            This note is private and only visible to you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="note-text" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Note Content
          </Label>
          <Textarea
            id="note-text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your observation, feedback, or follow-up here..."
            className="h-32 resize-none rounded-xl"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !noteText.trim()}
            className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Schedule Session Dialog ─────────────────────────────────────────────────────

function ScheduleSessionDialog({
  mentees,
  mentorId,
  onSaved,
}: {
  mentees: Mentee[];
  mentorId: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    studentId: string;
    type: MentorSession['type'] | '';
    scheduledAt: string;
    durationMinutes: string;
    notes: string;
  }>({
    studentId: '',
    type: '',
    scheduledAt: '',
    durationMinutes: '60',
    notes: '',
  });

  const handleSave = async () => {
    if (!form.studentId || !form.type || !form.scheduledAt) return;
    const mentee = mentees.find((m) => m.id === form.studentId);
    if (!mentee) return;
    setSaving(true);
    try {
      await addDoc(collection(firestore, 'mentor_sessions'), {
        mentorId,
        studentId: form.studentId,
        studentName: mentee.displayName,
        type: form.type,
        scheduledAt: form.scheduledAt,
        durationMinutes: parseInt(form.durationMinutes, 10) || 60,
        status: 'scheduled',
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Session scheduled', description: `Booked with ${mentee.displayName}.` });
      setForm({ studentId: '', type: '', scheduledAt: '', durationMinutes: '60', notes: '' });
      setOpen(false);
      onSaved();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to schedule session' });
    } finally {
      setSaving(false);
    }
  };

  const isValid = !!form.studentId && !!form.type && !!form.scheduledAt;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-white font-bold h-10 px-5 rounded-xl text-xs uppercase tracking-widest">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Schedule Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline font-extrabold tracking-tight">
            Schedule a Mentorship Session
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create a session and it will appear in your sessions log.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Mentee
            </Label>
            <Select
              value={form.studentId}
              onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a mentee..." />
              </SelectTrigger>
              <SelectContent>
                {mentees.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Session Type
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as MentorSession['type'] }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="sched-at"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Date and Time
              </Label>
              <Input
                id="sched-at"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="duration"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min={15}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="session-notes"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Notes (optional)
            </Label>
            <Textarea
              id="session-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Agenda, topics to cover..."
              className="h-24 resize-none rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Book Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function MentorshipPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Data loaders ──────────────────────────────────────────────────────────────

  const loadNotes = useCallback(async (mentorId: string) => {
    try {
      const snap = await getDocs(
        query(
          collection(firestore, 'mentor_notes'),
          where('mentorId', '==', mentorId),
          orderBy('createdAt', 'desc')
        )
      );
      setNotes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MentorNote, 'id'>) })));
    } catch {
      // index may not be ready; silent fallback
      try {
        const snap = await getDocs(
          query(collection(firestore, 'mentor_notes'), where('mentorId', '==', mentorId))
        );
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<MentorNote, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
            const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
            return tb - ta;
          });
        setNotes(sorted);
      } catch {
        // permission denied or network error — leave state unchanged
      }
    }
  }, []);

  const loadSessions = useCallback(async (mentorId: string) => {
    try {
      const snap = await getDocs(
        query(
          collection(firestore, 'mentor_sessions'),
          where('mentorId', '==', mentorId),
          orderBy('scheduledAt', 'desc')
        )
      );
      setSessions(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MentorSession, 'id'>) }))
      );
    } catch {
      try {
        const snap = await getDocs(
          query(collection(firestore, 'mentor_sessions'), where('mentorId', '==', mentorId))
        );
        setSessions(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<MentorSession, 'id'>) }))
            .sort((a, b) => (b.scheduledAt > a.scheduledAt ? 1 : -1))
        );
      } catch {
        // silent
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      setLoading(true);
      try {
        // 1. Fetch mentees
        const menteeSnap = await getDocs(
          query(collection(firestore, 'users'), where('mentorId', '==', user!.uid))
        );
        type RawUser = Record<string, unknown> & { id: string };
        const rawMentees: RawUser[] = menteeSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));

        // 2. Fetch all enrollments for mentees in one go
        let allEnrollments: Enrollment[] = [];
        if (rawMentees.length > 0) {
          const menteeIds = rawMentees.map((m) => m.id);
          // Firestore 'in' supports up to 30 items
          const chunks: string[][] = [];
          for (let i = 0; i < menteeIds.length; i += 30) {
            chunks.push(menteeIds.slice(i, i + 30));
          }
          for (const chunk of chunks) {
            try {
              const eSnap = await getDocs(
                query(collection(firestore, 'enrollments'), where('studentId', 'in', chunk))
              );
              allEnrollments = allEnrollments.concat(
                eSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) }))
              );
            } catch {
              // partial fetch failure; continue
            }
          }
        }

        // 3. Merge enrollment stats into each mentee
        const enrichedMentees: Mentee[] = rawMentees.map((m) => {
          const mEnrollments = allEnrollments.filter((e) => e.studentId === m.id);
          const avgProgress =
            mEnrollments.length > 0
              ? Math.round(
                  mEnrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / mEnrollments.length
                )
              : 0;
          return {
            id: m.id,
            displayName: (m.displayName as string) ?? 'Unknown',
            email: (m.email as string) ?? '',
            photoURL: m.photoURL as string | undefined,
            currentStreak: (m.currentStreak as number | undefined) ?? 0,
            enrolledCount: mEnrollments.length,
            avgProgress,
          };
        });

        setMentees(enrichedMentees);

        // 4. Sessions and notes in parallel
        await Promise.all([loadSessions(user!.uid), loadNotes(user!.uid)]);
      } catch {
        // permission errors are emitted globally
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading, loadSessions, loadNotes]);

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(firestore, 'mentor_notes', noteId));
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ title: 'Note deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete note' });
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Loading mentorship data...
        </p>
      </div>
    );
  }

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const pastSessions = sessions.filter((s) => s.status !== 'scheduled');

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-headline tracking-tight">Mentorship Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guide your assigned students, track progress, and log sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm font-extrabold text-accent tabular-nums">{mentees.length}</span>
            <span className="text-xs font-medium text-muted-foreground">
              {mentees.length === 1 ? 'mentee' : 'mentees'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="mentees" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 mb-6 rounded-xl h-12">
          <TabsTrigger
            value="mentees"
            className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2 hidden sm:inline" />
            My Mentees
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white relative"
          >
            <Calendar className="w-4 h-4 mr-2 hidden sm:inline" />
            Sessions
            {upcomingSessions.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                {upcomingSessions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <StickyNote className="w-4 h-4 mr-2 hidden sm:inline" />
            Notes Archive
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: My Mentees ──────────────────────────────────────────────── */}
        <TabsContent value="mentees">
          {mentees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No mentees assigned yet"
              description="An admin assigns students to you from User Management."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mentees.map((mentee) => (
                <Card
                  key={mentee.id}
                  className="border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Avatar + name row */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-border">
                        <AvatarImage src={mentee.photoURL} alt={mentee.displayName} />
                        <AvatarFallback className="bg-accent/10 text-accent font-extrabold text-sm">
                          {initials(mentee.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-sm leading-tight truncate">
                          {mentee.displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{mentee.email}</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center p-2 rounded-xl bg-secondary/50 border border-border">
                        <BookOpen className="h-3.5 w-3.5 text-accent mb-1" />
                        <span className="text-base font-extrabold tabular-nums leading-none">
                          {mentee.enrolledCount ?? 0}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium mt-0.5 uppercase tracking-widest leading-none">
                          Courses
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-xl bg-secondary/50 border border-border">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mb-1" />
                        <span className="text-base font-extrabold tabular-nums leading-none">
                          {mentee.avgProgress ?? 0}%
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium mt-0.5 uppercase tracking-widest leading-none">
                          Progress
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-xl bg-secondary/50 border border-border">
                        <Flame className="h-3.5 w-3.5 text-orange-500 mb-1" />
                        <span className="text-base font-extrabold tabular-nums leading-none">
                          {mentee.currentStreak ?? 0}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium mt-0.5 uppercase tracking-widest leading-none">
                          Streak
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Overall Progress
                        </span>
                        <span className="text-[10px] font-bold tabular-nums text-accent">
                          {mentee.avgProgress ?? 0}%
                        </span>
                      </div>
                      <Progress value={mentee.avgProgress ?? 0} className="h-1.5 rounded-full" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {user && (
                        <LeaveNoteDialog
                          mentee={mentee}
                          mentorId={user.uid}
                          onSaved={() => user && loadNotes(user.uid)}
                        />
                      )}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-8 text-xs font-bold border-border hover:border-primary transition-colors"
                      >
                        <a href={`mailto:${mentee.email}`}>
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          Send Email
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: Sessions ────────────────────────────────────────────────── */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold font-headline tracking-tight">
                Session Log
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {upcomingSessions.length} upcoming · {pastSessions.length} past
              </p>
            </div>
            {user && (
              <ScheduleSessionDialog
                mentees={mentees}
                mentorId={user.uid}
                onSaved={() => user && loadSessions(user.uid)}
              />
            )}
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No sessions yet"
              description="Schedule your first mentorship session using the button above."
            />
          ) : (
            <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="font-bold text-xs px-6 py-4">Student</TableHead>
                    <TableHead className="font-bold text-xs">Type</TableHead>
                    <TableHead className="font-bold text-xs">Scheduled</TableHead>
                    <TableHead className="font-bold text-xs">Duration</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="hover:bg-accent/5 transition-colors"
                    >
                      <TableCell className="px-6 font-semibold text-sm">
                        {session.studentName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold rounded-lg"
                        >
                          {sessionTypeLabel(session.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {session.scheduledAt
                          ? new Date(session.scheduledAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {session.durationMinutes} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <SessionStatusBadge status={session.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB 3: Notes Archive ───────────────────────────────────────────── */}
        <TabsContent value="notes" className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold font-headline tracking-tight">
              Notes Archive
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Private observations and feedback for your mentees.
            </p>
          </div>

          {notes.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Leave notes for mentees from the My Mentees tab."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => {
                const dateStr = note.createdAt?.toDate
                  ? note.createdAt.toDate().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Just now';
                return (
                  <Card
                    key={note.id}
                    className="border border-border bg-card rounded-2xl shadow-sm group relative"
                  >
                    <CardHeader className="pb-2 pr-12">
                      <CardTitle className="text-sm font-extrabold leading-tight">
                        {note.studentName}
                      </CardTitle>
                      <CardDescription className="text-[11px]">{dateStr}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {note.note}
                      </p>
                    </CardContent>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
