import { UserRole } from './auth';

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  role: UserRole[];
  // Journey section this item belongs to (Dashboard/Learn/Build/Labs/Community/Launch).
  // Omit to render the item as an ungrouped utility item (e.g. Notifications),
  // matching how Profile/Settings are already handled in SidebarNav.
  group?: string;
}

export const navItems: NavItem[] = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  // Deliberately ungrouped — admin is an operations/governance console, not a
  // personal journey, so it keeps the flat list it's always had.
  { title: 'Dashboard',          href: '/admin/dashboard',   icon: 'LayoutDashboard', role: ['admin'] },
  { title: 'Cohort Admissions',  href: '/admin/cohorts',     icon: 'GraduationCap',   role: ['admin'] },
  { title: 'User Management',    href: '/admin/users',       icon: 'Users',           role: ['admin'] },
  { title: 'Course Governance',  href: '/admin/courses',     icon: 'ShieldCheck',     role: ['admin'] },
  { title: 'Innovation Pipeline',href: '/admin/incubation',  icon: 'Rocket',          role: ['admin'] },
  { title: 'Blog',               href: '/admin/blog',        icon: 'Newspaper',       role: ['admin'] },
  { title: 'Analytics',          href: '/admin/analytics',   icon: 'BarChart',        role: ['admin'] },

  // ── Teacher ────────────────────────────────────────────────────────────────
  { title: 'Dashboard',          href: '/teacher/dashboard',        icon: 'LayoutDashboard', role: ['teacher'], group: 'Dashboard' },
  { title: 'My Courses',         href: '/teacher/courses',          icon: 'BookOpen',        role: ['teacher'], group: 'Learn' },
  { title: 'Assignments',        href: '/teacher/assignments',      icon: 'FileText',        role: ['teacher'], group: 'Learn' },
  { title: 'Gradebook',          href: '/teacher/gradebook',        icon: 'GraduationCap',   role: ['teacher'], group: 'Learn' },
  { title: 'Schedule',           href: '/teacher/schedule',         icon: 'Calendar',        role: ['teacher'], group: 'Labs' },
  { title: 'Attendance',         href: '/teacher/attendance',       icon: 'ClipboardList',   role: ['teacher'], group: 'Labs' },
  { title: 'Mentorship',         href: '/teacher/mentorship',       icon: 'HeartHandshake',  role: ['teacher'], group: 'Community' },
  { title: 'Proposal Review',    href: '/teacher/proposal-review',  icon: 'FileSearch',      role: ['teacher'], group: 'Launch' },
  { title: 'Notifications',      href: '/teacher/notifications',    icon: 'Bell',            role: ['teacher'] },

  // ── Student ────────────────────────────────────────────────────────────────
  { title: 'Dashboard',          href: '/student/dashboard',     icon: 'LayoutDashboard', role: ['student'], group: 'Dashboard' },
  { title: 'My Learning',        href: '/student/courses',       icon: 'BookOpen',        role: ['student'], group: 'Learn' },
  { title: 'Assignments',        href: '/student/assignments',   icon: 'ClipboardList',   role: ['student'], group: 'Learn' },
  { title: 'Projects',           href: '/student/projects',      icon: 'FolderKanban',    role: ['student'], group: 'Build' },
  { title: 'Live Sessions',      href: '/student/live',          icon: 'Radio',           role: ['student'], group: 'Labs' },
  { title: 'My Cohort',          href: '/student/cohort',        icon: 'Users2',          role: ['student'], group: 'Community' },
  { title: 'Innovation Lab',     href: '/student/incubation',    icon: 'Rocket',          role: ['student'], group: 'Launch' },
  { title: 'Notifications',      href: '/student/notifications', icon: 'Bell',            role: ['student'] },
];

export const getNavItemsByRole = (role: UserRole) =>
  navItems.filter(item => item.role.includes(role));
