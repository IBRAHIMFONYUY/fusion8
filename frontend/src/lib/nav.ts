import { UserRole } from './auth';

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  role: UserRole[];
}

export const navItems: NavItem[] = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  { title: 'Dashboard',          href: '/admin/dashboard',   icon: 'LayoutDashboard', role: ['admin'] },
  { title: 'Cohort Admissions',  href: '/admin/cohorts',     icon: 'GraduationCap',   role: ['admin'] },
  { title: 'User Management',    href: '/admin/users',       icon: 'Users',           role: ['admin'] },
  { title: 'Course Governance',  href: '/admin/courses',     icon: 'ShieldCheck',     role: ['admin'] },
  { title: 'Innovation Pipeline',href: '/admin/incubation',  icon: 'Rocket',          role: ['admin'] },
  { title: 'Blog',               href: '/admin/blog',        icon: 'Newspaper',       role: ['admin'] },
  { title: 'Analytics',          href: '/admin/analytics',   icon: 'BarChart',        role: ['admin'] },

  // ── Teacher ────────────────────────────────────────────────────────────────
  { title: 'Dashboard',          href: '/teacher/dashboard',        icon: 'LayoutDashboard', role: ['teacher'] },
  { title: 'My Courses',         href: '/teacher/courses',          icon: 'BookOpen',        role: ['teacher'] },
  { title: 'Mentorship',         href: '/teacher/mentorship',       icon: 'HeartHandshake',  role: ['teacher'] },
  { title: 'Assignments',        href: '/teacher/assignments',      icon: 'FileText',        role: ['teacher'] },
  { title: 'Gradebook',          href: '/teacher/gradebook',        icon: 'GraduationCap',   role: ['teacher'] },
  { title: 'Schedule',           href: '/teacher/schedule',         icon: 'Calendar',        role: ['teacher'] },
  { title: 'Attendance',         href: '/teacher/attendance',       icon: 'ClipboardList',   role: ['teacher'] },
  { title: 'Proposal Review',    href: '/teacher/proposal-review',  icon: 'FileSearch',      role: ['teacher'] },

  // ── Student ────────────────────────────────────────────────────────────────
  { title: 'Dashboard',          href: '/student/dashboard',     icon: 'LayoutDashboard', role: ['student'] },
  { title: 'My Learning',        href: '/student/courses',       icon: 'BookOpen',        role: ['student'] },
  { title: 'Live Sessions',      href: '/student/live',          icon: 'Radio',           role: ['student'] },
  { title: 'Projects',           href: '/student/projects',      icon: 'FolderKanban',    role: ['student'] },
  { title: 'My Cohort',          href: '/student/cohort',        icon: 'Users2',          role: ['student'] },
  { title: 'Innovation Lab',     href: '/student/incubation',    icon: 'Rocket',          role: ['student'] },
  { title: 'Assignments',        href: '/student/assignments',   icon: 'ClipboardList',   role: ['student'] },
  { title: 'Notifications',      href: '/student/notifications', icon: 'Bell',            role: ['student'] },
];

export const getNavItemsByRole = (role: UserRole) =>
  navItems.filter(item => item.role.includes(role));
