'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import {
  FileText,
  Loader2,
  Plus,
  Trash2,
  Clock,
  Users as UsersIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { lmsService, LMSCourse } from '@/services/lms-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AssignmentForm {
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
}

const blankForm: AssignmentForm = {
  title: '',
  description: '',
  courseId: '',
  dueDate: '',
};

export default function TeacherAssignmentsPage() {
  const { user, firestore } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AssignmentForm>(blankForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      if (!user) return;
      try {
        const data = await lmsService.getTeacherCourses(user.uid);
        setCourses(data);
      } catch (e) {
        // silent — handled by error emitter elsewhere
      } finally {
        setCoursesLoading(false);
      }
    }
    loadCourses();
  }, [user]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'assignments'),
      where('teacherId', '==', user.uid),
    );
  }, [firestore, user]);

  const { data: assignments, isLoading } = useCollection<any>(assignmentsQuery);

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'submissions'),
      where('teacherId', '==', user.uid),
    );
  }, [firestore, user]);

  const { data: submissions } = useCollection<any>(submissionsQuery);

  const submissionCountFor = (assignmentId: string) =>
    (submissions || []).filter((s) => s.assignmentId === assignmentId).length;

  const courseTitle = (id: string) =>
    courses.find((c) => c.id === id)?.title || 'Unassigned';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
    if (!form.title || !form.courseId) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Title and course are required.',
      });
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'assignments'), {
        title: form.title,
        description: form.description,
        courseId: form.courseId,
        courseTitle: courseTitle(form.courseId),
        dueDate: form.dueDate || null,
        teacherId: user.uid,
        teacherName: user.displayName || 'Instructor',
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Assignment published',
        description: 'Students enrolled in this course will see it now.',
      });
      setForm(blankForm);
      setDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Could not publish',
        description: err?.message || 'Check your permissions.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'assignments', id));
      toast({ title: 'Assignment removed' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err?.message,
      });
    }
  };

  const loading = isLoading || coursesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Create deliverables and review who has submitted.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New assignment</DialogTitle>
                <DialogDescription>
                  Publish a deliverable to a course. Students see it on their
                  Academic Workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="a-title">Title</Label>
                  <Input
                    id="a-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Build an Arduino LED Matrix"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-course">Course</Label>
                  <Select
                    value={form.courseId}
                    onValueChange={(v) => setForm({ ...form, courseId: v })}
                  >
                    <SelectTrigger id="a-course">
                      <SelectValue
                        placeholder={
                          courses.length === 0
                            ? 'You have no courses yet'
                            : 'Select a course'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-due">Due date (optional)</Label>
                  <Input
                    id="a-due"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-desc">Instructions (optional)</Label>
                  <Textarea
                    id="a-desc"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Spec, deliverables, grading criteria..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !form.courseId}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Publish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="border-b border-dashed">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Published assignments
          </CardTitle>
          <CardDescription>
            Submissions are reviewed in the Gradebook.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
          ) : assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="font-bold">Title</TableHead>
                  <TableHead className="font-bold">Course</TableHead>
                  <TableHead className="font-bold">Due</TableHead>
                  <TableHead className="font-bold">Submissions</TableHead>
                  <TableHead className="text-right font-bold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id} className="hover:bg-accent/5">
                    <TableCell className="py-4">
                      <p className="font-bold text-sm">{a.title}</p>
                      {a.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {a.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {a.courseTitle || courseTitle(a.courseId)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {a.dueDate || 'Flexible'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        <UsersIcon className="h-3 w-3 mr-1" />
                        {submissionCountFor(a.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this assignment?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              "{a.title}" will be removed for all enrolled
                              students. Existing submissions are kept.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(a.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={FileText}
                title="No assignments yet"
                description={
                  courses.length === 0
                    ? 'Publish a course first, then create assignments for it.'
                    : 'Create your first assignment to give students something to deliver.'
                }
                action={
                  courses.length === 0
                    ? { text: 'Go to courses', href: '/teacher/courses' }
                    : {
                        text: 'New assignment',
                        onClick: () => setDialogOpen(true),
                      }
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
