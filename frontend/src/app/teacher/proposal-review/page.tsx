'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ProposalReviewDialog } from '@/components/proposal-review-dialog';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ProjectProposal } from '@/types';

type FirestoreProposal = ProjectProposal & { firestoreId: string };

export default function ProposalReviewPage() {
  const { firestore, isLoading: authLoading } = useAuth();
  const [selected, setSelected] = useState<FirestoreProposal | null>(null);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'project_proposals'), orderBy('submittedAt', 'desc'));
  }, [firestore]);

  const { data: rawProposals, isLoading } = useCollection(proposalsQuery);

  const proposals: FirestoreProposal[] = (rawProposals ?? []).map((p: any) => ({
    firestoreId: p.id,
    id: p.id,
    title: p.title ?? '',
    status: p.status ?? 'pending',
    submittedAt: p.submittedAt?.toDate?.() ?? new Date(),
    studentLeadId: p.studentLeadId ?? '',
    problemStatement: p.problemStatement ?? '',
    proposedSolution: p.proposedSolution ?? '',
    skillsNeeded: p.skillsNeeded ?? [],
    reviewNotes: p.reviewNotes,
  }));

  const statusBadge = (status: string) => {
    if (status === 'approved')
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-none text-[10px] font-bold">Approved</Badge>;
    if (status === 'rejected')
      return <Badge variant="destructive" className="text-[10px] font-bold">Rejected</Badge>;
    return <Badge variant="secondary" className="text-[10px] font-bold animate-pulse">Pending Review</Badge>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const pending = proposals.filter(p => p.status === 'pending').length;

  return (
    <>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-extrabold font-headline tracking-tight">Proposal Review</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve student venture proposals for the Innovation Incubator.
            {pending > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-lg">
                {pending} awaiting review
              </span>
            )}
          </p>
        </div>

        <Card className="border border-border bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              All Proposals
            </CardTitle>
            <CardDescription className="text-xs">
              {proposals.length} total · {pending} pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="font-bold text-xs">Venture Title</TableHead>
                    <TableHead className="font-bold text-xs">Submitted</TableHead>
                    <TableHead className="font-bold text-xs">Skills</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.firestoreId} className="hover:bg-accent/5 transition-colors">
                      <TableCell className="font-semibold text-sm max-w-[220px]">
                        <p className="truncate">{proposal.title}</p>
                        <p className="text-[11px] text-muted-foreground font-normal mt-0.5 truncate">
                          {proposal.problemStatement.slice(0, 60)}…
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {new Date(proposal.submittedAt as any).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {proposal.skillsNeeded.slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[9px] rounded-md px-1.5">{s}</Badge>
                          ))}
                          {proposal.skillsNeeded.length > 3 && (
                            <span className="text-[9px] text-muted-foreground">+{proposal.skillsNeeded.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(proposal.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-8 text-xs"
                          onClick={() => setSelected(proposal)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {proposal.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={FileText}
                title="No proposals yet"
                description="When students submit venture proposals, they will appear here for review."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {selected && firestore && (
        <ProposalReviewDialog
          proposal={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          db={firestore}
        />
      )}
    </>
  );
}
