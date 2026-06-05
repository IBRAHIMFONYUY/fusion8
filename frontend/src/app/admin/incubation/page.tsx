'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
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
  Rocket,
  Loader2,
  TrendingUp,
  GraduationCap,
  Clock,
  Lightbulb,
  Users,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  PlusCircle,
  CalendarCheck,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────────

type StartupStage = 'idea' | 'validation' | 'mvp' | 'growth';
type StartupStatus = 'incubating' | 'graduated' | 'paused' | 'rejected';

interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  stage: StartupStage;
  founderId: string;
  founderName: string;
  teamMembers: Record<string, string>;
  skills: string[];
  status: StartupStatus;
  createdAt: { toDate?: () => Date } | null;
  fundingGoal: number;
  fundingReceived: number;
  reviewNotes?: string;
}

interface Proposal {
  id: string;
  title: string;
  studentLeadId?: string;
  studentLeadName?: string;
  problemStatement?: string;
  proposedSolution?: string;
  skillsNeeded?: string[];
  submittedAt: { toDate?: () => Date } | null;
  status: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const STAGE_CONFIG: Record<
  StartupStage,
  { label: string; className: string }
> = {
  idea: { label: 'Idea', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border-none' },
  validation: { label: 'Validation', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-none' },
  mvp: { label: 'MVP', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-none' },
  growth: { label: 'Growth', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none' },
};

const STATUS_CONFIG: Record<
  StartupStatus,
  { label: string; className: string }
> = {
  incubating: { label: 'Incubating', className: 'bg-accent/10 text-accent border-none' },
  graduated: { label: 'Graduated', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none' },
  paused: { label: 'Paused', className: 'bg-secondary text-muted-foreground border-none' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 border-none' },
};

function StageBadge({ stage }: { stage: StartupStage }) {
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG.idea;
  return (
    <Badge className={`text-[10px] font-bold uppercase tracking-widest ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: StartupStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.incubating;
  return (
    <Badge className={`text-[10px] font-bold uppercase tracking-widest ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

// ── Startup Detail Dialog ───────────────────────────────────────────────────────

function StartupDetailDialog({
  startup,
  open,
  onClose,
  onUpdated,
}: {
  startup: Startup;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<StartupStatus>(startup.status);
  const [reviewNotes, setReviewNotes] = useState(startup.reviewNotes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(startup.status);
    setReviewNotes(startup.reviewNotes ?? '');
  }, [startup]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(firestore, 'startups', startup.id), {
        status,
        reviewNotes: reviewNotes.trim(),
      });
      toast({ title: 'Startup updated', description: `${startup.name} has been updated.` });
      onUpdated();
      onClose();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update startup' });
    } finally {
      setSaving(false);
    }
  };

  const fundingPct =
    startup.fundingGoal > 0
      ? Math.min(100, Math.round((startup.fundingReceived / startup.fundingGoal) * 100))
      : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline font-extrabold tracking-tight text-xl">
            {startup.name}
          </DialogTitle>
          <DialogDescription className="text-xs italic">{startup.tagline}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Stage + Category */}
          <div className="flex flex-wrap gap-2">
            <StageBadge stage={startup.stage} />
            <StatusBadge status={startup.status} />
            {startup.category && (
              <Badge variant="outline" className="text-[10px] font-bold">
                {startup.category}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="p-4 bg-secondary/40 rounded-xl border border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Description
            </p>
            <p className="text-sm leading-relaxed">{startup.description || '—'}</p>
          </div>

          {/* Team + Founder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/40 rounded-xl border border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Founder
              </p>
              <p className="font-semibold text-sm">{startup.founderName || '—'}</p>
            </div>
            <div className="p-4 bg-secondary/40 rounded-xl border border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Team Size
              </p>
              <p className="font-semibold text-sm">
                {Object.keys(startup.teamMembers ?? {}).length + 1} member
                {Object.keys(startup.teamMembers ?? {}).length !== 0 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Funding */}
          <div className="p-4 bg-secondary/40 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Funding Progress
              </p>
              <span className="text-xs font-extrabold text-accent tabular-nums">
                {startup.fundingReceived?.toLocaleString() ?? 0} /{' '}
                {startup.fundingGoal?.toLocaleString() ?? 0} XAF
              </span>
            </div>
            <Progress value={fundingPct} className="h-2 rounded-full" />
            <p className="text-[10px] text-muted-foreground text-right tabular-nums">{fundingPct}% funded</p>
          </div>

          {/* Skills */}
          {startup.skills && startup.skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {startup.skills.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] rounded-lg">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Update Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StartupStatus)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incubating">Incubating</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review notes */}
          <div className="space-y-2">
            <Label
              htmlFor="review-notes"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Review Notes
            </Label>
            <Textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Internal feedback, next steps, investment notes..."
              className="h-28 resize-none rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Incubate Proposal Dialog ────────────────────────────────────────────────────

function IncubateProposalDialog({
  proposal,
  onIncubated,
}: {
  proposal: Proposal;
  onIncubated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: proposal.title ?? '',
    tagline: '',
    category: '',
    fundingGoal: '',
  });

  const handleIncubate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(firestore, 'startups'), {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        description: `${proposal.problemStatement ?? ''}\n\n${proposal.proposedSolution ?? ''}`.trim(),
        category: form.category.trim(),
        stage: 'idea' as StartupStage,
        founderId: proposal.studentLeadId ?? '',
        founderName: proposal.studentLeadName ?? '',
        teamMembers: {},
        skills: proposal.skillsNeeded ?? [],
        status: 'incubating' as StartupStatus,
        fundingGoal: parseFloat(form.fundingGoal) || 0,
        fundingReceived: 0,
        reviewNotes: '',
        sourceProposalId: proposal.id,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Startup created',
        description: `${form.name} has been moved to incubation.`,
      });
      setOpen(false);
      onIncubated();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to create startup' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-accent hover:bg-accent/90 text-white rounded-xl h-8 text-xs font-bold"
        >
          <Rocket className="mr-1.5 h-3.5 w-3.5" />
          Incubate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline font-extrabold tracking-tight">
            Create Startup from Proposal
          </DialogTitle>
          <DialogDescription className="text-xs">
            This will register the venture in the incubation pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Startup Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
              placeholder="Official startup name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Tagline
            </Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              className="rounded-xl"
              placeholder="One-line pitch"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Category
              </Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="rounded-xl"
                placeholder="e.g. AgriTech"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Funding Goal (XAF)
              </Label>
              <Input
                type="number"
                min={0}
                value={form.fundingGoal}
                onChange={(e) => setForm((f) => ({ ...f, fundingGoal: e.target.value }))}
                className="rounded-xl"
                placeholder="0"
              />
            </div>
          </div>

          {/* Source info */}
          <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Source Proposal
            </p>
            <p className="text-sm font-semibold">{proposal.title}</p>
            <p className="text-xs text-muted-foreground">
              By {proposal.studentLeadName ?? 'Unknown'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleIncubate}
            disabled={saving || !form.name.trim()}
            className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Launch into Incubation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function AdminIncubationPage() {
  const { role } = useAuth();
  const { toast } = useToast();

  const [startups, setStartups] = useState<Startup[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);

  // ── Loaders ───────────────────────────────────────────────────────────────────

  const loadStartups = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(firestore, 'startups'), orderBy('createdAt', 'desc'))
      );
      setStartups(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Startup, 'id'>) }))
      );
    } catch {
      try {
        const snap = await getDocs(collection(firestore, 'startups'));
        setStartups(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Startup, 'id'>) }))
            .sort((a, b) => {
              const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
              const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
              return tb - ta;
            })
        );
      } catch {
        // silent
      }
    }
  }, []);

  const loadProposals = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(
          collection(firestore, 'project_proposals'),
          where('status', '==', 'approved'),
          orderBy('submittedAt', 'desc')
        )
      );
      setProposals(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Proposal, 'id'>) }))
      );
    } catch {
      try {
        const snap = await getDocs(
          query(collection(firestore, 'project_proposals'), where('status', '==', 'approved'))
        );
        setProposals(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Proposal, 'id'>) }))
            .sort((a, b) => {
              const ta = a.submittedAt?.toDate?.()?.getTime() ?? 0;
              const tb = b.submittedAt?.toDate?.()?.getTime() ?? 0;
              return tb - ta;
            })
        );
      } catch {
        // silent
      }
    }
  }, []);

  useEffect(() => {
    if (role !== 'admin') return;
    async function load() {
      setLoading(true);
      await Promise.all([loadStartups(), loadProposals()]);
      setLoading(false);
    }
    load();
  }, [role, loadStartups, loadProposals]);

  // ── Derived stats ─────────────────────────────────────────────────────────────

  // Proposals that don't yet have a corresponding startup (matched by sourceProposalId)
  const incubatedProposalIds = new Set(
    startups
      .map((s) => (s as Startup & { sourceProposalId?: string }).sourceProposalId)
      .filter(Boolean)
  );
  const pendingProposals = proposals.filter((p) => !incubatedProposalIds.has(p.id));

  const incubatingCount = startups.filter((s) => s.status === 'incubating').length;
  const graduatedCount = startups.filter((s) => s.status === 'graduated').length;
  const graduatedStartups = startups.filter((s) => s.status === 'graduated');

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Loading innovation pipeline...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold font-headline tracking-tight">
          Innovation Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Oversee incubating ventures, approve proposals, and track the path from idea to graduation.
        </p>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Startups',
            value: startups.length,
            icon: Rocket,
            iconColor: 'text-accent',
            bg: 'bg-accent/10',
            sub: 'All registered ventures',
          },
          {
            label: 'Incubating',
            value: incubatingCount,
            icon: Layers,
            iconColor: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-500/15',
            sub: 'Currently in program',
          },
          {
            label: 'Graduated',
            value: graduatedCount,
            icon: GraduationCap,
            iconColor: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-500/15',
            sub: 'Successfully exited',
          },
          {
            label: 'Pending Proposals',
            value: pendingProposals.length,
            icon: FileText,
            iconColor: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-500/15',
            sub: 'Approved, awaiting launch',
          },
        ].map((s) => (
          <Card key={s.label} className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div
                className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}
              >
                <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
              </div>
              <div className="text-2xl font-extrabold font-headline tabular-nums">
                {s.value}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="startups" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 mb-6 rounded-xl h-12">
          <TabsTrigger
            value="startups"
            className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Rocket className="w-4 h-4 mr-2 hidden sm:inline" />
            Active Startups
          </TabsTrigger>
          <TabsTrigger
            value="proposals"
            className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white relative"
          >
            <Lightbulb className="w-4 h-4 mr-2 hidden sm:inline" />
            Proposal Pipeline
            {pendingProposals.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                {pendingProposals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="demoday"
            className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Sparkles className="w-4 h-4 mr-2 hidden sm:inline" />
            Demo Day
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Active Startups ─────────────────────────────────────────── */}
        <TabsContent value="startups">
          {startups.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No startups yet"
              description="Once proposals are incubated, startups will appear here."
            />
          ) : (
            <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-secondary/20">
                <CardTitle className="text-base font-extrabold font-headline flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-accent" />
                  All Ventures
                </CardTitle>
                <CardDescription className="text-xs">
                  {startups.length} registered &middot; click a row to manage
                </CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/10">
                    <TableHead className="font-bold text-xs px-6 py-4">Venture</TableHead>
                    <TableHead className="font-bold text-xs">Stage</TableHead>
                    <TableHead className="font-bold text-xs">Category</TableHead>
                    <TableHead className="font-bold text-xs">Founder</TableHead>
                    <TableHead className="font-bold text-xs text-center">Team</TableHead>
                    <TableHead className="font-bold text-xs w-36">Funding</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {startups.map((startup) => {
                    const fundingPct =
                      startup.fundingGoal > 0
                        ? Math.min(
                            100,
                            Math.round((startup.fundingReceived / startup.fundingGoal) * 100)
                          )
                        : 0;
                    const teamSize = Object.keys(startup.teamMembers ?? {}).length + 1;
                    return (
                      <TableRow
                        key={startup.id}
                        className="hover:bg-accent/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedStartup(startup)}
                      >
                        <TableCell className="px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                              <AvatarFallback className="text-[10px] font-extrabold bg-accent/10 text-accent">
                                {initials(startup.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-extrabold text-sm leading-tight truncate max-w-[160px]">
                                {startup.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[160px] italic">
                                {startup.tagline}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StageBadge stage={startup.stage} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {startup.category || '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {startup.founderName || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {teamSize}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={fundingPct} className="h-1.5 flex-1 rounded-full" />
                            <span className="text-[10px] font-bold tabular-nums text-accent w-7 text-right">
                              {fundingPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={startup.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Detail dialog */}
          {selectedStartup && (
            <StartupDetailDialog
              startup={selectedStartup}
              open={!!selectedStartup}
              onClose={() => setSelectedStartup(null)}
              onUpdated={loadStartups}
            />
          )}
        </TabsContent>

        {/* ── TAB 2: Proposal Pipeline ───────────────────────────────────────── */}
        <TabsContent value="proposals" className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold font-headline tracking-tight">
              Approved Proposals
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              These proposals have been approved and are ready to be launched as startups.
            </p>
          </div>

          {pendingProposals.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No proposals awaiting incubation"
              description="Approve student proposals in the Proposal Review section to see them here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pendingProposals.map((proposal) => {
                const dateStr = proposal.submittedAt?.toDate
                  ? proposal.submittedAt.toDate().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown date';
                return (
                  <Card
                    key={proposal.id}
                    className="border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-extrabold leading-tight">
                          {proposal.title}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none text-[10px] font-bold shrink-0">
                          Approved
                        </Badge>
                      </div>
                      <CardDescription className="text-[11px]">
                        {proposal.studentLeadName ?? 'Unknown student'} &middot; {dateStr}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {proposal.skillsNeeded && proposal.skillsNeeded.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {proposal.skillsNeeded.slice(0, 4).map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] rounded-md px-1.5">
                              {s}
                            </Badge>
                          ))}
                          {proposal.skillsNeeded.length > 4 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{proposal.skillsNeeded.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      <IncubateProposalDialog
                        proposal={proposal}
                        onIncubated={() => {
                          loadStartups();
                          loadProposals();
                        }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: Demo Day ────────────────────────────────────────────────── */}
        <TabsContent value="demoday" className="space-y-6">
          {/* Hero card */}
          <Card className="border border-border bg-primary text-primary-foreground rounded-2xl overflow-hidden relative">
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/20 border border-accent/30 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">
                    Fusion8 Ventures
                  </p>
                  <h2 className="text-xl font-extrabold font-headline tracking-tight">
                    Demo Day &middot; Coming Soon
                  </h2>
                </div>
              </div>
              <p className="text-sm text-primary-foreground/80 leading-relaxed max-w-xl mb-6">
                Demo Day is the culmination of the incubation cycle. Each venture gets a
                5-minute pitch to a panel of mentors, industry leaders, and sponsor
                representatives. The best pitches receive seed funding, visibility in the
                Fusion8 alumni network, and connections to regional accelerators across
                Central Africa.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[
                  { icon: Clock, title: '5-Minute Pitches', desc: 'Focused presentations with live Q&A from the panel.' },
                  { icon: Users, title: 'Mentor Panel', desc: 'Industry professionals and platform mentors evaluate each team.' },
                  { icon: DollarSign, title: 'Sponsor Visibility', desc: 'Funded sponsors attend to scout teams for partnerships.' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <item.icon className="h-5 w-5 text-accent mb-2" />
                    <p className="font-extrabold text-sm leading-tight mb-1">{item.title}</p>
                    <p className="text-[11px] text-primary-foreground/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() =>
                  toast({
                    title: 'Feature coming soon',
                    description: 'Demo Day configuration will be available in an upcoming release.',
                  })
                }
                variant="secondary"
                className="font-bold h-11 px-6 rounded-xl"
              >
                <CalendarCheck className="mr-2 h-4 w-4" />
                Configure Demo Day
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 -mr-20 -mt-20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/3 -ml-16 -mb-16 rounded-full blur-3xl" />
          </Card>

          {/* Graduated startups */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <h3 className="text-base font-extrabold font-headline tracking-tight">
                Previous Demo Day Alumni
              </h3>
            </div>

            {graduatedStartups.length === 0 ? (
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No graduated startups yet. Once ventures complete the program and are marked as
                  graduated, they will appear here as Demo Day alumni.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {graduatedStartups.map((startup) => {
                  const gradYear = startup.createdAt?.toDate?.()?.getFullYear() ?? '—';
                  return (
                    <Card
                      key={startup.id}
                      className="border border-border bg-card rounded-2xl shadow-sm"
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-10 w-10 ring-1 ring-border shrink-0">
                          <AvatarFallback className="text-xs font-extrabold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                            {initials(startup.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-sm leading-tight truncate">
                              {startup.name}
                            </p>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate italic">
                            {startup.tagline}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">
                            {startup.category} &middot; Class of {gradYear}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
