export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  approved?: boolean;
  mentorId?: string;
  mentorName?: string;
  // Engagement intelligence
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string;
  xp?: number;
  onboardingComplete?: boolean;
}

// ── Achievement system ────────────────────────────────────────────────────────

export type AchievementId =
  | 'first_enrollment'
  | 'first_lesson'
  | 'five_lessons'
  | 'twenty_lessons'
  | 'first_assignment'
  | 'first_project'
  | 'course_complete'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'earned'>[] = [
  { id: 'first_enrollment', name: 'Enrolled', description: 'Joined your first course', icon: '📚' },
  { id: 'first_lesson', name: 'First Step', description: 'Completed your first lesson', icon: '👣' },
  { id: 'five_lessons', name: 'Dedicated', description: 'Completed 5 lessons', icon: '⚡' },
  { id: 'twenty_lessons', name: 'Scholar', description: 'Completed 20 lessons', icon: '🎓' },
  { id: 'first_assignment', name: 'Deliverer', description: 'Submitted your first assignment', icon: '📋' },
  { id: 'first_project', name: 'Builder', description: 'Joined your first project', icon: '🔧' },
  { id: 'course_complete', name: 'Graduate', description: 'Completed a full course', icon: '🏅' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Logged in 3 days in a row', icon: '🔥' },
  { id: 'streak_7', name: 'Week Warrior', description: 'A full week of learning', icon: '🏆' },
  { id: 'streak_30', name: 'Iron Engineer', description: '30-day learning streak', icon: '💎' },
];

export function deriveAchievements(params: {
  enrollmentCount: number;
  lessonsCompleted: number;
  assignmentsSubmitted: number;
  projectCount: number;
  hasCompletedCourse: boolean;
  streak: number;
}): Achievement[] {
  const { enrollmentCount, lessonsCompleted, assignmentsSubmitted, projectCount, hasCompletedCourse, streak } = params;

  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    earned:
      (def.id === 'first_enrollment' && enrollmentCount >= 1) ||
      (def.id === 'first_lesson' && lessonsCompleted >= 1) ||
      (def.id === 'five_lessons' && lessonsCompleted >= 5) ||
      (def.id === 'twenty_lessons' && lessonsCompleted >= 20) ||
      (def.id === 'first_assignment' && assignmentsSubmitted >= 1) ||
      (def.id === 'first_project' && projectCount >= 1) ||
      (def.id === 'course_complete' && hasCompletedCourse) ||
      (def.id === 'streak_3' && streak >= 3) ||
      (def.id === 'streak_7' && streak >= 7) ||
      (def.id === 'streak_30' && streak >= 30),
  }));
}

// ── Project types ─────────────────────────────────────────────────────────────

export type ProjectStatus = 'recruiting' | 'in_progress' | 'completed';
export type ProjectCategory =
  | 'Agriculture'
  | 'Health'
  | 'Fintech'
  | 'Education'
  | 'Community'
  | 'Hardware';

export interface Project {
  id: string;
  title: string;
  description: string;
  studentLeadId: string;
  members?: Record<string, string>;
  status: ProjectStatus;
  category: ProjectCategory;
  skillsNeeded: string[];
  teamSize?: { total: number };
  createdAt?: any;
  team?: string[];
  tasks?: any[];
  openRoles?: string[];
}

// ── Assignment types ──────────────────────────────────────────────────────────

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

// ── Project proposal ──────────────────────────────────────────────────────────

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

// ── Course types ──────────────────────────────────────────────────────────────

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

// ── Cohort system ─────────────────────────────────────────────────────────────

export type CohortStatus = 'upcoming' | 'active' | 'completed';
export type EngineeringTrack =
  | 'Mechatronics'
  | 'Robotics'
  | 'AI/ML'
  | 'Electronics'
  | 'Software Engineering'
  | 'IoT'
  | 'CNC/CAD'
  | 'Hardware Design';

export interface Cohort {
  id: string;
  name: string;
  track: EngineeringTrack;
  startDate?: any;
  endDate?: any;
  description?: string;
  instructorId?: string;
  status: CohortStatus;
  enrolledCount?: number;
  capacity?: number;
  location?: 'online' | 'onsite' | 'hybrid';
}

// ── Mentorship system ─────────────────────────────────────────────────────────

export type MentorSessionType = 'office_hours' | 'project_review' | 'career' | 'technical';
export type MentorSessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface MentorSession {
  id: string;
  mentorId: string;
  studentId: string;
  studentName?: string;
  scheduledAt?: any;
  durationMinutes?: number;
  type: MentorSessionType;
  status: MentorSessionStatus;
  notes?: string;
  feedback?: string;
  rating?: number;
}

export interface MentorNote {
  id: string;
  mentorId: string;
  studentId: string;
  content: string;
  createdAt?: any;
  private?: boolean;
}

// ── Startup incubation ────────────────────────────────────────────────────────

export type StartupStage = 'idea' | 'validation' | 'mvp' | 'growth' | 'scaling';
export type StartupStatus = 'incubating' | 'graduated' | 'paused' | 'rejected';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate?: any;
  completedAt?: any;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface StartupProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  stage: StartupStage;
  founderId: string;
  founderName?: string;
  teamMembers?: Record<string, string>;
  skills: string[];
  pitchDeckUrl?: string;
  demoUrl?: string;
  fundingGoal?: number;
  fundingReceived?: number;
  milestones?: Milestone[];
  createdAt?: any;
  status: StartupStatus;
  cohortId?: string;
  reviewNotes?: string;
  sponsorId?: string;
}

// ── Lab booking ───────────────────────────────────────────────────────────────

export type LabType =
  | 'Robotics'
  | 'Electronics'
  | 'AI/ML'
  | 'CNC/CAD'
  | 'Innovation'
  | 'Mechatronics'
  | 'Prototyping';

export interface LabBooking {
  id: string;
  labType: LabType;
  studentId: string;
  studentName?: string;
  date?: any;
  timeSlot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt?: any;
}
