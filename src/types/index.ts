export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  approved?: boolean;
}

export type ProjectStatus = 'recruiting' | 'in_progress' | 'completed';
export type ProjectCategory = 'Agriculture' | 'Health' | 'Fintech' | 'Education' | 'Community' | 'Hardware';

export interface Project {
  id: string;
  title: string;
  description: string;
  studentLeadId: string;
  members?: Record<string, string>; // Map of UID -> Role
  status: ProjectStatus;
  category: ProjectCategory;
  skillsNeeded: string[];
  teamSize?: { total: number };
  createdAt?: any;
  team?: string[];
  tasks?: any[];
  openRoles?: string[];
}

export interface Assignment {
  id: number;
  title: string;
  status: 'Pending' | 'Graded' | string;
  grade?: string;
  feedback?: string;
  dueDate?: Date | string;
  courseId?: string;
  submissionTitle?: string;
  submissionDescription?: string;
  submissionProblems?: string;
  submissionFile?: string;
}

export interface ProjectProposal {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string | number | Date;
  studentLeadId: string;
  problemStatement: string;
  proposedSolution: string;
  skillsNeeded: string[];
  reviewNotes?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  level: string;
  enrolledStudents?: string[];
}

export interface CourseData {
  id: string;
  title: string;
  description?: string;
  longDescription?: string;
  price?: number;
  thumbnail?: string;
  imageUrl?: string;
  status?: string;
  modules?: any[];
  enrolledCount?: number;
}
