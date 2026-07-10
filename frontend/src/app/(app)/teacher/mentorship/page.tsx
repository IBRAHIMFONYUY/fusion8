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
  documentId,
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
  Calendar,
  AlertTriangle,
  Wifi,
  MapPin,
  TrendingUp,
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
  lastActiveAt?: Date | null;
  attendanceMode?: 'online' | 'onsite';
  courseTitles?: string[];
  enrolledDaysAgo?: number;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  progress?: number;
  status?: string;
  attendanceMode?: string;
  createdAt?: { toDate?: () => Date } | null;
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

// ── Helpers ─────────────────────────────────────────────────────────────────────

const SESSION_TYPES: { value: MentorSession['type']; label: string }[] = [
  { value: 'office_hours', label: 'Office Hours' },
  { value: 'project_review', label: 'Project Review' },
  { value: 'career', label: 'Career Guidance' },
  { value: 'technical', label: 'Technical Deep-Dive' },
];

function sessionTypeLabel(type: string): string {
  return SESSION_TYPES.find((t) => t.value === type)?.label ?? type;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getEngagementStatus(mentee: Mentee): 'at-risk' | 'inactive' | 'active' | 'strong' {
  const { avgProgress = 0, enrolledDaysAgo = 0, currentStreak = 0, lastActiveAt } = mentee;
  const daysSinceActive = lastActiveAt ? daysSince(lastActiveAt) : (enrolledDaysAgo ?? 999);
  if (enrolledDaysAgo > 14 && avgProgress < 10) return 'at-risk';
  if (daysSinceActive > 7 && avgProgress < 30) return 'at-risk';
  if (daysSinceActive > 3 || (avgProgress === 0 && enrolledDaysAgo > 7)) return 'inactive';
  if (currentStreak >= 3 || avgProgress >= 60) return 'strong';
  return 'active';
}

function EngagementBadge({ mentee }: { mentee: Mentee }) {
  const status = getEngagementStatus(mentee);
  if (status === 'at-risk')
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-none text-[10px] font-bold flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> At Risk
      </Badge>
    );
  if (status === 'inactive')
    return (
      <Badge variant="secondary" className="text-[10px] font-bold">
        Inactive
      </Badge>
    );
  if (status === 'strong')
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none text-[10px] font-bold flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> Strong
      </Badge>
    );
  return (
    <Badge className="bg-accent/10 text-accent border-none text-[10px] font-bold">Active</Badge>
  );
}

function AttendanceBadge({ mode }: { mode?: string }) {
  if (mode === 'onsite')
    return (
      <Badge variant="outline" className="text-[10px] font-bold flex items-center gap-1">
        <MapPin className="h-2.5 w-2.5" /> Onsite
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px] font-bold flex items-center gap-1">
      <Wifi className="h-2.5 w-2.5" /> Online
    </Badge>
  );
}

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
            Create a 1-on-1 mentorship session with a student.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Student
            </Label>
            <Select
              value={form.studentId}
              onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a student..." />
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
                Duration (min)
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
      } catch { /* silent */ }
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
      } catch { /* silent */ }
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      setLoading(true);
      try {
        // 1. Get teacher's course IDs
        const coursesSnap = await getDocs(
          query(collection(firestore, 'courses'), where('teacherId', '==', user!.uid))
        );
        const courseMap: Record<string, string> = {};
        coursesSnap.docs.forEach((d) => {
          courseMap[d.id] = (d.data().title as string) || d.id;
        });
        const courseIds = Object.keys(courseMap);

        if (courseIds.length === 0) {
          setMentees([]);
          await Promise.all([loadSessions(user!.uid), loadNotes(user!.uid)]);
          return;
        }

        // 2. Get all enrollments for those courses (batch 30)
        let allEnrollments: Enrollment[] = [];
        for (let i = 0; i < courseIds.length; i += 30) {
          const chunk = courseIds.slice(i, i + 30);
          try {
            const eSnap = await getDocs(
              query(collection(firestore, 'enrollments'), where('courseId', 'in', chunk))
            );
            allEnrollments = allEnrollments.concat(
              eSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) }))
            );
          } catch { /* partial fail */ }
        }

        // 3. Unique student IDs
        const studentIdSet = new Set<string>(
          allEnrollments.map((e) => e.studentId).filter(Boolean)
        );
        const studentIds = [...studentIdSet];

        if (studentIds.length === 0) {
          setMentees([]);
          await Promise.all([loadSessions(user!.uid), loadNotes(user!.uid)]);
          return;
        }

        // 4. Fetch user profiles in batches of 30 by document ID
        const userProfiles: Record<string, any> = {};
        for (let i = 0; i < studentIds.length; i += 30) {
          const chunk = studentIds.slice(i, i + 30);
          try {
            const uSnap = await getDocs(
              query(collection(firestore, 'users'), where(documentId(), 'in', chunk))
            );
            uSnap.docs.forEach((d) => {
              userProfiles[d.id] = { id: d.id, ...d.data() };
            });
          } catch { /* partial fail */ }
        }

        // 5. Merge enrollment stats per student
        const enrichedMentees: Mentee[] = studentIds.map((sid) => {
          const profile = userProfiles[sid] ?? { id: sid, displayName: 'Unknown', email: '' };
          const sEnrollments = allEnrollments.filter((e) => e.studentId === sid);
          const avgProgress =
            sEnrollments.length > 0
              ? Math.round(
                  sEnrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / sEnrollments.length
                )
              : 0;
          const courseTitles = sEnrollments.map((e) => courseMap[e.courseId] ?? e.courseId);

          // Determine earliest enrollment date
          let oldestEnrollmentDate: Date | null = null;
          sEnrollments.forEach((e) => {
            const d = e.createdAt?.toDate?.();
            if (d && (!oldestEnrollmentDate || d < oldestEnrollmentDate)) {
              oldestEnrollmentDate = d;
            }
          });
          const enrolledDaysAgo = oldestEnrollmentDate
            ? daysSince(oldestEnrollmentDate)
            : 0;

          // Last active from user profile
          let lastActiveAt: Date | null = null;
          if (profile.lastActiveAt?.toDate) lastActiveAt = profile.lastActiveAt.toDate();
          else if (profile.lastLoginAt?.toDate) lastActiveAt = profile.lastLoginAt.toDate();

          // Attendance mode from any enrollment
          const attendanceMode =
            (sEnrollments.find((e) => e.attendanceMode)?.attendanceMode as 'online' | 'onsite') ??
            'online';

          return {
            id: sid,
            displayName: (profile.displayName as string) ?? 'Unknown',
            email: (profile.email as string) ?? '',
            photoURL: profile.photoURL as string | undefined,
            currentStreak: (profile.currentStreak as number | undefined) ?? 0,
            enrolledCount: sEnrollments.length,
            avgProgress,
            lastActiveAt,
            attendanceMode,
            courseTitles,
            enrolledDaysAgo,
          };
        });

        // Sort: at-risk first, then inactive, then active
        const order = { 'at-risk': 0, inactive: 1, active: 2, strong: 3 };
        enrichedMentees.sort(
          (a, b) => order[getEngagementStatus(a)] - order[getEngagementStatus(b)]
        );

        setMentees(enrichedMentees);
        await Promise.all([loadSessions(user!.uid), loadNotes(user!.uid)]);
      } catch {
        // permission errors emitted globally
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

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Loading student data...
        </p>
      </div>
    );
  }

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const pastSessions = sessions.filter((s) => s.status !== 'scheduled');
  const atRiskMentees = mentees.filter((m) => getEngagementStatus(m) === 'at-risk');
  const onlineMentees = mentees.filter((m) => m.attendanceMode !== 'onsite');
  const onsiteMentees = mentees.filter((m) => m.attendanceMode === 'onsite');

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-headline tracking-tight">Student Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor all students enrolled in your courses — track engagement and follow up proactively.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm font-extrabold text-accent tabular-nums">{mentees.length}</span>
            <span className="text-xs font-medium text-muted-foreground">students</span>
          </div>
          {atRiskMentees.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-extrabold text-red-600 dark:text-red-400 tabular-nums">{atRiskMentees.length}</span>
              <span className="text-xs font-medium text-red-500">at risk</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex w-full bg-secondary/50 p-1 mb-6 rounded-xl h-12 gap-1">
          <TabsTrigger
            value="all"
            className="flex-1 rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2 hidden sm:inline" />
            All Students
          </TabsTrigger>
          {atRiskMentees.length > 0 && (
            <TabsTrigger
              value="at-risk"
              className="flex-1 rounded-lg font-bold text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white relative"
            >
              <AlertTriangle className="w-4 h-4 mr-2 hidden sm:inline" />
              At Risk
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {atRiskMentees.length}
              </span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="sessions"
            className="flex-1 rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white relative"
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
            className="flex-1 rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <StickyNote className="w-4 h-4 mr-2 hidden sm:inline" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: All Students ──────────────────────────────────────────── */}
        <TabsContent value="all">
          {mentees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No enrolled students yet"
              description="Students who enroll in your courses will appear here for tracking."
            />
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Card className="border-none shadow-sm bg-secondary/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-extrabold tabular-nums">{mentees.length}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Total</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50 dark:bg-green-900/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-extrabold tabular-nums text-green-600">
                      {mentees.filter(m => getEngagementStatus(m) === 'strong' || getEngagementStatus(m) === 'active').length}
                    </p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Active</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-extrabold tabular-nums text-red-600">{atRiskMentees.length}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">At Risk</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-secondary/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-extrabold tabular-nums">{onsiteMentees.length}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Onsite</p>
                  </CardContent>
                </Card>
              </div>

              <MenteeGrid
                mentees={mentees}
                user={user}
                onNoteSaved={() => user && loadNotes(user.uid)}
              />
            </>
          )}
        </TabsContent>

        {/* ── TAB: At Risk ───────────────────────────────────────────────── */}
        {atRiskMentees.length > 0 && (
          <TabsContent value="at-risk">
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                These students have low progress and/or haven't been active recently. Reach out to keep them on track.
              </p>
            </div>
            <MenteeGrid
              mentees={atRiskMentees}
              user={user}
              onNoteSaved={() => user && loadNotes(user.uid)}
            />
          </TabsContent>
        )}

        {/* ── TAB: Sessions ──────────────────────────────────────────────── */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold font-headline tracking-tight">Session Log</h2>
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
              description="Schedule a 1-on-1 mentorship session with a student using the button above."
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
                    <TableRow key={session.id} className="hover:bg-accent/5 transition-colors">
                      <TableCell className="px-6 font-semibold text-sm">{session.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold rounded-lg">
                          {sessionTypeLabel(session.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {session.scheduledAt
                          ? new Date(session.scheduledAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
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

        {/* ── TAB: Notes ─────────────────────────────────────────────────── */}
        <TabsContent value="notes" className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold font-headline tracking-tight">Notes Archive</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Private observations and follow-up notes for students.</p>
          </div>

          {notes.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Leave follow-up notes for students from the All Students tab."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => {
                const dateStr = note.createdAt?.toDate
                  ? note.createdAt.toDate().toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                  : 'Just now';
                return (
                  <Card key={note.id} className="border border-border bg-card rounded-2xl shadow-sm group relative">
                    <CardHeader className="pb-2 pr-12">
                      <CardTitle className="text-sm font-extrabold leading-tight">{note.studentName}</CardTitle>
                      <CardDescription className="text-[11px]">{dateStr}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{note.note}</p>
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

// ── Mentee Grid ─────────────────────────────────────────────────────────────────

function MenteeGrid({
  mentees,
  user,
  onNoteSaved,
}: {
  mentees: Mentee[];
  user: any;
  onNoteSaved: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {mentees.map((mentee) => {
        const lastActiveText = mentee.lastActiveAt
          ? `Active ${daysSince(mentee.lastActiveAt) === 0 ? 'today' : `${daysSince(mentee.lastActiveAt)}d ago`}`
          : mentee.enrolledDaysAgo
          ? `Enrolled ${mentee.enrolledDaysAgo}d ago`
          : 'New student';

        return (
          <Card
            key={mentee.id}
            className="border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-5 space-y-4">
              {/* Avatar + name + badges */}
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-border shrink-0">
                  <AvatarImage src={mentee.photoURL} alt={mentee.displayName} />
                  <AvatarFallback className="bg-accent/10 text-accent font-extrabold text-sm">
                    {initials(mentee.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm leading-tight truncate">{mentee.displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{mentee.email}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <EngagementBadge mentee={mentee} />
                    <AttendanceBadge mode={mentee.attendanceMode} />
                  </div>
                </div>
              </div>

              {/* Course(s) enrolled in */}
              {mentee.courseTitles && mentee.courseTitles.length > 0 && (
                <div className="text-[10px] text-muted-foreground font-medium bg-secondary/40 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 shrink-0" />
                  <span className="truncate">{mentee.courseTitles.slice(0, 2).join(' · ')}
                    {mentee.courseTitles.length > 2 ? ` +${mentee.courseTitles.length - 2}` : ''}</span>
                </div>
              )}

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

              {/* Last active */}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0" />
                {lastActiveText}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {user && (
                  <LeaveNoteDialog mentee={mentee} mentorId={user.uid} onSaved={onNoteSaved} />
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-xs font-bold border-border hover:border-primary transition-colors"
                >
                  <a href={`mailto:${mentee.email}`}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
