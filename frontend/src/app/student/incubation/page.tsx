'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Rocket,
  Lightbulb,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Trophy,
  Loader2,
  ChevronRight,
  Globe,
  Zap,
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  stage: 'idea' | 'validation' | 'mvp' | 'growth' | 'scaling';
  founderId: string;
  founderName: string;
  teamMembers: Record<string, string>;
  skills: string[];
  status: 'incubating' | 'graduated' | 'paused';
  createdAt: any;
  fundingGoal: number;
  fundingReceived: number;
  milestones: Milestone[];
}

interface Proposal {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageLabel(stage: Startup['stage']): string {
  const labels: Record<Startup['stage'], string> = {
    idea: 'Idea',
    validation: 'Validation',
    mvp: 'MVP',
    growth: 'Growth',
    scaling: 'Scaling',
  };
  return labels[stage] ?? stage;
}

function statusColor(status: 'incubating' | 'graduated' | 'paused'): string {
  if (status === 'graduated') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'paused') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-accent/10 text-accent border-accent/20';
}

function proposalStatusColor(status: Proposal['status']): string {
  if (status === 'approved') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function milestoneStatusColor(status: Milestone['status']): string {
  if (status === 'completed') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'in_progress') return 'bg-accent/10 text-accent border-accent/20';
  return 'bg-secondary text-muted-foreground border-border';
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function daysSince(createdAt: any): number {
  if (!createdAt) return 0;
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ── Stage progression stepper ─────────────────────────────────────────────────

const ALL_STAGES: Startup['stage'][] = ['idea', 'validation', 'mvp', 'growth', 'scaling'];

function StageStepper({ current }: { current: Startup['stage'] }) {
  const currentIndex = ALL_STAGES.indexOf(current);
  return (
    <div className="relative flex items-center justify-between gap-2">
      {/* connector line */}
      <div className="absolute inset-x-0 top-5 h-0.5 bg-border -z-0" />
      {ALL_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={stage} className="flex flex-col items-center gap-2 flex-1 z-10">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                active
                  ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30'
                  : done
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span
              className={`text-xs font-semibold text-center leading-tight ${
                active ? 'text-accent' : done ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              {stageLabel(stage)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Journey timeline (STATE A) ────────────────────────────────────────────────

const JOURNEY_STAGES = [
  {
    num: '01',
    title: 'Ideation',
    icon: Lightbulb,
    description:
      'Find a problem worth solving. Validate that it affects real people in your community. Document the opportunity clearly.',
    detail: 'Submit your venture proposal via the FUSION8 portal for instructor review.',
  },
  {
    num: '02',
    title: 'Validation',
    icon: Target,
    description:
      'Talk to potential users, run quick surveys, and confirm there is genuine demand before building anything.',
    detail: 'Participate in FUSION8 feedback sessions and mentor-led validation workshops.',
  },
  {
    num: '03',
    title: 'MVP',
    icon: Zap,
    description:
      'Build the minimum viable product — the simplest version of your solution that real users can try.',
    detail: 'Use FUSION8 lab resources, Arduino kits, and cloud credits to ship fast.',
  },
  {
    num: '04',
    title: 'Growth',
    icon: TrendingUp,
    description:
      'Grow your user base, refine the product based on feedback, and start building a sustainable business model.',
    detail: 'Access FUSION8 mentor network and investor demo day to attract early funding.',
  },
];

// ── Innovation Stats (STATE A) ────────────────────────────────────────────────

interface InnovationStats {
  activeProjects: number;
  recruitingTeams: number;
  approvedProposals: number;
}

async function fetchInnovationStats(db: any): Promise<InnovationStats> {
  try {
    const [projectsSnap, recruitingSnap, proposalsSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'startups'),
          where('status', '==', 'incubating'),
          limit(100)
        )
      ),
      getDocs(
        query(
          collection(db, 'startups'),
          where('stage', 'in', ['idea', 'validation', 'mvp']),
          limit(100)
        )
      ),
      getDocs(
        query(
          collection(db, 'project_proposals'),
          where('status', '==', 'approved'),
          limit(100)
        )
      ),
    ]);
    return {
      activeProjects: projectsSnap.size,
      recruitingTeams: recruitingSnap.size,
      approvedProposals: proposalsSnap.size,
    };
  } catch {
    return { activeProjects: 0, recruitingTeams: 0, approvedProposals: 0 };
  }
}

// ── Add Member Dialog ─────────────────────────────────────────────────────────

function AddMemberDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Team Member</DialogTitle>
          <DialogDescription>
            Enter the email address and role of the person you want to invite to
            your startup.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email Address</Label>
            <Input
              id="member-email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-role">Role</Label>
            <Input
              id="member-role"
              placeholder="e.g. Frontend Engineer, Hardware Lead"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-white rounded-xl"
            onClick={onClose}
          >
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Mentor Review Dialog ──────────────────────────────────────────────────────

function MentorReviewDialog({
  open,
  startupId,
  startupName,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  startupId: string;
  startupName: string;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Request Mentor Review</DialogTitle>
          <DialogDescription>
            A FUSION8 mentor will be assigned to review your pitch deck and
            provide structured feedback on{' '}
            <span className="font-semibold">{startupName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reviews typically take 2–3 business days. You will receive a
            notification once feedback is available.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-white rounded-xl"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting…
              </>
            ) : (
              'Confirm Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── STATE A: No Startup ───────────────────────────────────────────────────────

function NoStartupView({
  proposals,
  stats,
}: {
  proposals: Proposal[] | null;
  stats: InnovationStats;
}) {
  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <div className="bg-primary text-white rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-black/[0.12] rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide">
            <Rocket className="h-4 w-4 text-accent" />
            FUSION8 Incubation Program
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-headline leading-tight">
            Build Africa's Next Startup
          </h1>
          <p className="text-base md:text-lg text-neutral-300 leading-relaxed max-w-xl">
            FUSION8 gives engineering students in Cameroon the tools, mentors,
            and resources to turn ideas into real ventures — from first sketch
            to funded product.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white font-bold h-12 px-8 rounded-xl shadow-xl shadow-accent/25"
            >
              <NextLink href="/student/propose">
                <Rocket className="mr-2 h-4 w-4" />
                Propose a Venture
              </NextLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 border-black/[0.12] text-white hover:bg-white/20 h-12 px-8 rounded-xl"
            >
              <NextLink href="/student/projects">
                Browse Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </NextLink>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-white/5 rounded-full -mb-24 blur-2xl pointer-events-none" />
      </div>

      {/* Innovation Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Active Projects',
            value: stats.activeProjects,
            icon: Rocket,
            iconColor: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'Teams Recruiting',
            value: stats.recruitingTeams,
            icon: Users,
            iconColor: 'text-blue-600',
            bg: 'bg-blue-100',
          },
          {
            label: 'Approved This Cycle',
            value: stats.approvedProposals,
            icon: Trophy,
            iconColor: 'text-green-600',
            bg: 'bg-green-100',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border bg-card rounded-2xl">
            <CardContent className="p-6">
              <div
                className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="text-4xl font-extrabold font-headline">{stat.value}</div>
              <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journey Timeline */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-headline">
            Your Incubation Journey
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Every successful FUSION8 venture moves through four stages.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {JOURNEY_STAGES.map((stage, i) => (
            <Card
              key={stage.num}
              className="border border-border bg-card rounded-2xl relative overflow-hidden group hover:border-accent/40 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent/60 to-accent/10" />
              <CardContent className="p-6 pl-8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center">
                    <stage.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground tracking-[0.15em] uppercase">
                    Stage {stage.num}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold font-headline text-base">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    {stage.description}
                  </p>
                </div>
                <div className="pt-1 border-t border-border">
                  <p className="text-[11px] text-accent font-semibold leading-snug">
                    {stage.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Proposals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-headline">My Proposals</h2>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-semibold"
          >
            <NextLink href="/student/propose">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Proposal
            </NextLink>
          </Button>
        </div>
        {proposals && proposals.length > 0 ? (
          <div className="space-y-3">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="border border-border bg-card rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug truncate">{p.title}</p>
                  {p.submittedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {p.submittedAt?.toDate
                        ? p.submittedAt.toDate().toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  )}
                </div>
                <Badge
                  className={`capitalize text-xs border shrink-0 ${proposalStatusColor(p.status)}`}
                  variant="outline"
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-2xl p-10 text-center">
            <Lightbulb className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground mb-4">
              No proposals submitted yet.
            </p>
            <Button
              asChild
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white rounded-xl"
            >
              <NextLink href="/student/propose">Submit Your First Idea</NextLink>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STATE B: Has Startup ──────────────────────────────────────────────────────

function StartupCommandCenter({
  startup,
  uid,
  firestore,
}: {
  startup: Startup;
  uid: string;
  firestore: any;
}) {
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  const [mentorSubmitting, setMentorSubmitting] = useState(false);
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);

  const isFounder = startup.founderId === uid;
  const teamMemberIds = Object.keys(startup.teamMembers ?? {});
  const allMemberIds = Array.from(
    new Set([startup.founderId, ...teamMemberIds])
  );

  // Fetch display names for all team members
  useEffect(() => {
    if (!firestore || allMemberIds.length === 0) return;
    const fetchNames = async () => {
      const names: Record<string, string> = {};
      await Promise.all(
        allMemberIds.map(async (memberId) => {
          try {
            const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
            const snap = await getDoc(firestoreDoc(firestore, 'users', memberId));
            if (snap.exists()) {
              const data = snap.data();
              names[memberId] =
                data.displayName || data.fullName || data.email || memberId.slice(0, 8);
            } else {
              names[memberId] = memberId.slice(0, 8);
            }
          } catch {
            names[memberId] = memberId.slice(0, 8);
          }
        })
      );
      setTeamNames(names);
    };
    fetchNames();
  }, [firestore, allMemberIds.join(',')]);

  const milestones: Milestone[] = startup.milestones ?? [];
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const milestoneProgress =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const fundingProgress =
    startup.fundingGoal > 0
      ? Math.min(100, Math.round((startup.fundingReceived / startup.fundingGoal) * 100))
      : 0;

  const handleMarkComplete = async (milestoneId: string) => {
    if (!firestore) return;
    setUpdatingMilestone(milestoneId);
    try {
      const updatedMilestones = milestones.map((m) =>
        m.id === milestoneId ? { ...m, status: 'completed' as const } : m
      );
      await updateDoc(doc(firestore, 'startups', startup.id), {
        milestones: updatedMilestones,
      });
    } catch {
      // silently ignore permission errors
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const handleRequestMentorReview = async () => {
    if (!firestore) return;
    setMentorSubmitting(true);
    try {
      await addDoc(collection(firestore, 'mentor_sessions'), {
        type: 'project_review',
        startupId: startup.id,
        startupName: startup.name,
        requestedBy: uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch {
      // silently ignore
    } finally {
      setMentorSubmitting(false);
      setMentorDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Startup Hero */}
      <div className="bg-primary text-white rounded-2xl p-7 md:p-10 relative overflow-hidden">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  className="capitalize text-xs border bg-white/15 border-black/[0.12] text-white"
                  variant="outline"
                >
                  {stageLabel(startup.stage)}
                </Badge>
                <Badge
                  className={`capitalize text-xs border ${statusColor(startup.status)}`}
                  variant="outline"
                >
                  {startup.status}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold font-headline leading-tight">
                {startup.name}
              </h1>
              <p className="text-neutral-300 text-base leading-relaxed max-w-lg">
                {startup.tagline}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-300">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{allMemberIds.length}</span>
              <span>member{allMemberIds.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {startup.fundingGoal > 0 && (
            <div className="max-w-md space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-neutral-300">Funding Progress</span>
                <span className="text-white font-bold">
                  XAF {(startup.fundingReceived ?? 0).toLocaleString()} /{' '}
                  {startup.fundingGoal.toLocaleString()}
                </span>
              </div>
              <Progress
                value={fundingProgress}
                className="h-2 bg-white/20 [&>div]:bg-accent rounded-full"
              />
              <p className="text-xs text-neutral-400 font-medium">
                {fundingProgress}% funded
              </p>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/8 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Current Stage',
            value: stageLabel(startup.stage),
            icon: Target,
            iconColor: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'Team Size',
            value: allMemberIds.length,
            icon: Users,
            iconColor: 'text-blue-600',
            bg: 'bg-blue-100',
          },
          {
            label: 'Milestones Done',
            value: `${completedCount}/${milestones.length || 0}`,
            icon: CheckCircle2,
            iconColor: 'text-green-600',
            bg: 'bg-green-100',
          },
          {
            label: 'Days Since Founded',
            value: daysSince(startup.createdAt),
            icon: Clock,
            iconColor: 'text-amber-600',
            bg: 'bg-amber-100',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div
                className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}
              >
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-extrabold font-headline">{stat.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Milestones + Team */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  Milestones
                </CardTitle>
                <span className="text-xs font-semibold text-muted-foreground">
                  {completedCount}/{milestones.length}
                </span>
              </div>
              {milestones.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>Overall completion</span>
                    <span className="text-accent font-bold">{milestoneProgress}%</span>
                  </div>
                  <Progress value={milestoneProgress} className="h-1.5 rounded-full" />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.length > 0 ? (
                milestones.map((m) => (
                  <div
                    key={m.id}
                    className="border border-border rounded-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm leading-snug">{m.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize border ${milestoneStatusColor(
                            m.status
                          )}`}
                        >
                          {m.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>
                    {m.status === 'in_progress' && isFounder && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkComplete(m.id)}
                        disabled={updatingMilestone === m.id}
                        className="shrink-0 h-8 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        {updatingMilestone === m.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mark Done
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No milestones defined yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Team
                </CardTitle>
                {isFounder && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddMemberOpen(true)}
                    className="h-8 text-xs rounded-lg"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {allMemberIds.map((memberId) => {
                const role =
                  memberId === startup.founderId
                    ? 'Founder'
                    : startup.teamMembers?.[memberId] ?? 'Member';
                const name = teamNames[memberId] ?? '…';
                return (
                  <div
                    key={memberId}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center font-bold text-sm text-accent shrink-0">
                      {name === '…' ? '…' : initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                    {memberId === startup.founderId && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-accent/10 text-accent border-accent/20 shrink-0"
                      >
                        Founder
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right — Details + Quick Actions */}
        <div className="space-y-6">
          {/* Startup Details */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold font-headline">
                Startup Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Category
                </p>
                <p className="text-sm font-semibold">{startup.category || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(startup.skills ?? []).length > 0 ? (
                    startup.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-[11px] rounded-lg border-border"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No skills listed</span>
                  )}
                </div>
              </div>
              {startup.createdAt && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Founded
                  </p>
                  <p className="text-sm font-semibold">
                    {startup.createdAt?.toDate
                      ? startup.createdAt.toDate().toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              )}
              {startup.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {startup.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-10 justify-between rounded-xl text-sm font-semibold hover:border-accent/40"
                onClick={() => {}}
              >
                Update Pitch Deck
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 justify-between rounded-xl text-sm font-semibold hover:border-accent/40"
                onClick={() => setMentorDialogOpen(true)}
              >
                Request Mentor Review
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-10 justify-between rounded-xl text-sm font-semibold hover:border-accent/40"
              >
                <NextLink href={`/projects/${startup.id}`}>
                  View Public Profile
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </NextLink>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stage Progression */}
      <Card className="border border-border bg-card rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Stage Progression
          </CardTitle>
          <CardDescription className="text-xs">
            Your startup is currently at the{' '}
            <span className="font-bold text-accent">{stageLabel(startup.stage)}</span> stage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StageStepper current={startup.stage} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
      />
      <MentorReviewDialog
        open={mentorDialogOpen}
        startupId={startup.id}
        startupName={startup.name}
        onClose={() => setMentorDialogOpen(false)}
        onSubmit={handleRequestMentorReview}
        isSubmitting={mentorSubmitting}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncubationPage() {
  const { user, firestore, isLoading: authLoading } = useAuth();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [startupLoading, setStartupLoading] = useState(true);
  const [stats, setStats] = useState<InnovationStats>({
    activeProjects: 0,
    recruitingTeams: 0,
    approvedProposals: 0,
  });

  // Proposals for the no-startup state
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'project_proposals'),
      where('studentLeadId', '==', user.uid),
      orderBy('submittedAt', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: proposals } = useCollection<Proposal>(proposalsQuery);

  // Startup detection: founder first, then team member
  useEffect(() => {
    if (!firestore || !user) {
      setStartupLoading(false);
      return;
    }

    let cancelled = false;

    const detectStartup = async () => {
      setStartupLoading(true);
      try {
        // 1. Try founder
        const founderSnap = await getDocs(
          query(
            collection(firestore, 'startups'),
            where('founderId', '==', user.uid),
            limit(1)
          )
        );

        if (!founderSnap.empty && !cancelled) {
          const d = founderSnap.docs[0];
          setStartup({ id: d.id, ...(d.data() as Omit<Startup, 'id'>) });
          setStartupLoading(false);
          return;
        }

        // 2. Try team member
        const memberField = `teamMembers.${user.uid}`;
        const memberSnap = await getDocs(
          query(
            collection(firestore, 'startups'),
            where(memberField, '!=', null),
            limit(1)
          )
        );

        if (!memberSnap.empty && !cancelled) {
          const d = memberSnap.docs[0];
          setStartup({ id: d.id, ...(d.data() as Omit<Startup, 'id'>) });
          setStartupLoading(false);
          return;
        }

        if (!cancelled) {
          setStartup(null);
          setStartupLoading(false);
        }
      } catch {
        if (!cancelled) {
          setStartup(null);
          setStartupLoading(false);
        }
      }
    };

    detectStartup();
    return () => {
      cancelled = true;
    };
  }, [firestore, user]);

  // Fetch innovation stats when no startup
  useEffect(() => {
    if (!firestore || startup !== null) return;
    fetchInnovationStats(firestore).then(setStats);
  }, [firestore, startup]);

  // Loading state
  if (authLoading || startupLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading your incubation space…
          </p>
        </div>
      </div>
    );
  }

  if (startup) {
    return (
      <StartupCommandCenter
        startup={startup}
        uid={user?.uid ?? ''}
        firestore={firestore}
      />
    );
  }

  return (
    <NoStartupView
      proposals={(proposals as Proposal[] | null)}
      stats={stats}
    />
  );
}
