'use client';

import { useState } from 'react';
import { useMockStore } from '@/hooks/useMockStore';
import type { ProjectProposal } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ProposalReviewDialog } from '@/components/proposal-review-dialog';
import { Eye, FileText } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';

export default function ProposalReviewPage() {
    const { proposals, updateProposalStatus } = useMockStore();
    const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);

    const handleReviewClick = (proposal: ProjectProposal) => {
        setSelectedProposal(proposal);
    };

    const handleCloseDialog = () => {
        setSelectedProposal(null);
    };

    const handleStatusChange = (proposalId: number, status: 'approved' | 'rejected', reviewNotes?: string) => {
        updateProposalStatus(proposalId, status, reviewNotes);
        handleCloseDialog();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Project Proposal Review</CardTitle>
                    <CardDescription>
                        Review and approve student-led project proposals to be featured in the Innovation Incubator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {proposals.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Student Lead</TableHead>
                                    <TableHead>Date Submitted</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposals.map((proposal: ProjectProposal) => (
                                    <TableRow key={proposal.id}>
                                        <TableCell className="font-medium">{proposal.title}</TableCell>
                                        <TableCell>Jane Doe</TableCell>
                                        <TableCell>{format(proposal.submittedAt, 'PPP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                proposal.status === 'approved' ? 'default' :
                                                proposal.status === 'rejected' ? 'destructive' :
                                                'secondary'
                                            } className={proposal.status === 'approved' ? 'bg-green-600' : ''}>
                                                {proposal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleReviewClick(proposal)}>
                                                <Eye className="mr-2 h-4 w-4" />
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
                          title="No proposals to review"
                          description="When students submit project proposals, they will appear here for your review and approval."
                        />
                    )}
                </CardContent>
            </Card>

            {selectedProposal && (
                <ProposalReviewDialog
                    proposal={selectedProposal}
                    isOpen={!!selectedProposal}
                    onClose={handleCloseDialog}
                    onStatusChange={handleStatusChange}
                />
            )}
        </>
    );
}
