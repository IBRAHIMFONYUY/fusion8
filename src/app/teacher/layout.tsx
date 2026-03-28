import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { getNavItemsByRole } from "@/lib/nav";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = getNavItemsByRole('teacher');
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <div className="grid min-h-screen w-full md:grid-cols-[256px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <SidebarNav items={navItems} />
        </div>
        <div className="flex flex-col">
          <DashboardHeader role="teacher" />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-secondary/40">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
