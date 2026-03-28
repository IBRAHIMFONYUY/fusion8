import { UserRole } from './auth';

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  role: UserRole[];
}

export const navItems: NavItem[] = [
  // Admin
  { title: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard', role: ['admin'] },
  { title: 'Cohort Admissions', href: '/admin/cohorts', icon: 'GraduationCap', role: ['admin'] },
  { title: 'User Management', href: '/admin/users', icon: 'Users', role: ['admin'] },
  { title: 'Course Governance', href: '/admin/courses', icon: 'ShieldCheck', role: ['admin'] },
  { title: 'Analytics', href: '/admin/analytics', icon: 'BarChart', role: ['admin'] },
  // Teacher
  { title: 'Dashboard', href: '/teacher/dashboard', icon: 'LayoutDashboard', role: ['teacher'] },
  { title: 'My Courses', href: '/teacher/courses', icon: 'BookOpen', role: ['teacher'] },
  { title: 'Schedule', href: '/teacher/schedule', icon: 'Calendar', role: ['teacher'] },
  // Student
  { title: 'Dashboard', href: '/student/dashboard', icon: 'LayoutDashboard', role: ['student'] },
  { title: 'My Learning', href: '/student/courses', icon: 'BookOpen', role: ['student'] },
  { title: 'Projects', href: '/student/projects', icon: 'FolderKanban', role: ['student'] },
  { title: 'Settings', href: '/student/settings', icon: 'Settings', role: ['student'] },
];

export const getNavItemsByRole = (role: UserRole) => navItems.filter(item => item.role.includes(role));
