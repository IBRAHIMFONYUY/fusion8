'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import {
  FileText, Loader2, Plus, Trash2, Clock, Users as UsersIcon,
  Link2, Youtube, Github, FileIcon, Eye, X, Paperclip,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  addDoc, collection, deleteDoc, doc, query,
  serverTimestamp, where, updateDoc,
} from 'firebase/firestore';
import { lmsService, LMSCourse } from '@/services/lms-service';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type MaterialType = 'pdf' | 'video' | 'github' | 'link';

interface Material {
  label: string;
  url: string;
  type: MaterialType;
}

interface AssignmentForm {
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  maxScore: string;
  materials: Material[];
}

const blankForm: AssignmentForm = {
  title: '', description: '', courseId: '', dueDate: '', maxScore: '100',
  materials: [],
};

const MATERIAL_TYPES: { value: MaterialType; label: string; icon: React.ElementType }[] = [
  { value: 'pdf',    label: 'PDF / Document', icon: FileIcon },
  { value: 'video',  label: 'Video (YouTube)', icon: Youtube },
  { value: 'github', label: 'GitHub / Code',   icon: Github },
  { value: 'link',   label: 'Other Link',      icon: Link2 },
];

function materialIcon(type: MaterialType) {
  const map = { pdf: FileIcon, video: Youtube, github: Github, link: Link2 };
  return map[type] ?? Link2;
}

export default function TeacherAssignmentsPage() {
  const { user, firestore } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<any>(null);
  const [form, setForm] = useState<AssignmentForm>(blankForm);
  const [submitting, setSubmitting] = useState(false);

  // Material being added
  const [newMat, setNewMat] = useState<Material>({ label: '', url: '', type: 'link' });

  useEffect(() => {
    async function loadCourses() {
      if (!user) return;
      try {
        const data = await lmsService.getTeacherCourses(user.uid);
        setCourses(data);
      } catch {}
      finally { setCoursesLoading(false); }
    }
    loadCourses();
  }, [user]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'assignments'), where('teacherId', '==', user.uid));
  }, [firestore, user]);

  const { data: assignments, isLoading } = useCollection<any>(assignmentsQuery);

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'submissions'), where('teacherId', '==', user.uid));
  }, [firestore, user]);

  const { data: submissions } = useCollection<any>(submissionsQuery);

  const submissionCountFor = (id: string) =>
    (submissions || []).filter((s) => s.assignmentId === id).length;

  const courseTitle = (id: string) =>
    courses.find((c) => c.id === id)?.title || id;

  const addMaterial = () => {
    if (!newMat.label.trim() || !newMat.url.trim()) return;
    setForm(f => ({ ...f, materials: [...f.materials, { ...newMat, label: newMat.label.trim(), url: newMat.url.trim() }] }));
    setNewMat({ label: '', url: '', type: 'link' });
  };

  const removeMaterial = (i: number) =>
    setForm(f => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
    if (!form.title || !form.courseId) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Title and course are required.' });
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
        maxScore: parseInt(form.maxScore) || 100,
        materials: form.materials,
        teacherId: user.uid,
        teacherName: user.displayName || 'Instructor',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Assignment published', description: 'Students enrolled in this course will see it now.' });
      setForm(blankForm);
      setNewMat({ label: '', url: '', type: 'link' });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Could not publish', description: err?.message || 'Check your permissions.' });
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
      toast({ variant: 'destructive', title: 'Delete failed', description: err?.message });
    }
  };

  const loading = isLoading || coursesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">Create deliverables, attach materials, and review submissions.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setForm(blankForm); setNewMat({ label: '', url: '', type: 'link' }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <Plus className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-headline text-xl">New Assignment</DialogTitle>
                <DialogDescription>Publish a deliverable with materials. Students see it immediately on their Academic Workspace.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-5">
                {/* Basic info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="a-title">Assignment Title <span className="text-accent">*</span></Label>
                    <Input id="a-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build an Arduino LED Matrix" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-course">Course <span className="text-accent">*</span></Label>
                    <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}>
                      <SelectTrigger id="a-course" className="h-11">
                        <SelectValue placeholder={courses.length === 0 ? 'No courses yet' : 'Select a course'} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-due">Due Date (optional)</Label>
                    <Input id="a-due" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-score">Max Score</Label>
                    <Input id="a-score" type="number" min="1" max="1000" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} className="h-11 w-28" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-desc">Instructions & Requirements</Label>
                  <Textarea id="a-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the task, deliverables, acceptance criteria, grading rubric..." rows={5} className="resize-none" />
                </div>

                {/* Materials section */}
                <div className="space-y-3 border-t border-dashed pt-4">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-accent" />
                    <Label className="text-sm font-black uppercase tracking-wide">Reference Materials</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Attach PDFs, videos, GitHub repos, or any links students need to complete this assignment.</p>

                  {/* Existing materials */}
                  {form.materials.length > 0 && (
                    <div className="space-y-2">
                      {form.materials.map((m, i) => {
                        const Icon = materialIcon(m.type);
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl border border-black/[0.06]">
                            <Icon className="h-4 w-4 text-accent shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{m.label}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">{m.url}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeMaterial(i)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new material */}
                  <div className="bg-secondary/20 border border-dashed rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Material</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Select value={newMat.type} onValueChange={v => setNewMat(m => ({ ...m, type: v as MaterialType }))}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIAL_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2"><t.icon className="h-3.5 w-3.5" />{t.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Label (e.g. Week 3 Slides)" value={newMat.label} onChange={e => setNewMat(m => ({ ...m, label: e.target.value }))} className="h-10" />
                      <Input placeholder="https://..." value={newMat.url} onChange={e => setNewMat(m => ({ ...m, url: e.target.value }))} className="h-10 font-mono text-xs" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMaterial}
                      disabled={!newMat.label.trim() || !newMat.url.trim()}
                      className="font-bold border-2 rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add to Assignment
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting || !form.courseId || !form.title} className="bg-accent hover:bg-orange-600 text-white font-bold px-6">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Publish Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="border-none shadow-xl">
        <CardHeader className="border-b border-dashed">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" /> Published Assignments
          </CardTitle>
          <CardDescription>Click an assignment to view details and attached materials.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
          ) : assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="font-bold">Title</TableHead>
                  <TableHead className="font-bold">Course</TableHead>
                  <TableHead className="font-bold">Due</TableHead>
                  <TableHead className="font-bold">Materials</TableHead>
                  <TableHead className="font-bold">Submissions</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.id} className="hover:bg-accent/5">
                    <TableCell className="py-4">
                      <p className="font-bold text-sm">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>}
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{a.courseTitle || courseTitle(a.courseId)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {a.dueDate || 'Flexible'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        <Paperclip className="h-3 w-3 mr-1" />
                        {(a.materials || []).length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        <UsersIcon className="h-3 w-3 mr-1" />
                        {submissionCountFor(a.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailAssignment(a)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
                              <AlertDialogDescription>"{a.title}" will be removed for all enrolled students.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
                description={courses.length === 0 ? 'Publish a course first, then create assignments.' : 'Create your first assignment to give students something to deliver.'}
                action={courses.length === 0 ? { text: 'Go to Courses', href: '/teacher/courses' } : { text: 'New Assignment', onClick: () => setDialogOpen(true) }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment detail dialog */}
      {detailAssignment && (
        <Dialog open={!!detailAssignment} onOpenChange={() => setDetailAssignment(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl pr-6">{detailAssignment.title}</DialogTitle>
              <DialogDescription>{detailAssignment.courseTitle} · Due: {detailAssignment.dueDate || 'Flexible'} · Max: {detailAssignment.maxScore || 100} pts</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {detailAssignment.description && (
                <div className="bg-secondary/30 rounded-xl p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">Instructions</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{detailAssignment.description}</p>
                </div>
              )}
              {(detailAssignment.materials || []).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5" /> Reference Materials ({detailAssignment.materials.length})
                  </p>
                  {detailAssignment.materials.map((m: Material, i: number) => {
                    const Icon = materialIcon(m.type);
                    return (
                      <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-secondary/30 hover:bg-accent/10 border border-black/[0.06] hover:border-accent/20 rounded-xl transition-all group">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold group-hover:text-accent transition-colors">{m.label}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{m.url}</p>
                        </div>
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No materials attached to this assignment.</p>
              )}
              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-dashed">
                <span>Submissions received: <strong className="text-foreground">{submissionCountFor(detailAssignment.id)}</strong></span>
                <a href="/teacher/gradebook" className="text-accent hover:underline font-bold">View in Gradebook →</a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
