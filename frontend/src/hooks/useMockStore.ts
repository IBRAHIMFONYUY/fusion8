import type { ProjectProposal, Project } from '@/types';

export const useMockStore = () => ({
  proposals: [] as ProjectProposal[],
  updateProposalStatus: (id: number, status: 'approved' | 'rejected', notes?: string) => {},
  addApplicantToProject: (projectId: string, applicant: any) => {},
  addProject: (project: Project) => {},
});
