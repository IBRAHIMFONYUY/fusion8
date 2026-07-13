"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as icons from "lucide-react"
import { useAuth } from "@/firebase"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/lib/nav"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface SidebarNavProps {
  items: NavItem[];
  isMobile?: boolean;
}

// Fixed journey order for grouped nav items. Items with no `group` (e.g.
// admin's flat list, or utility items like Notifications) render unlabeled
// after any grouped sections, matching the pre-grouping behavior exactly.
const GROUP_ORDER = ['Dashboard', 'Learn', 'Build', 'Labs', 'Community', 'Launch'];

function groupItems(items: NavItem[]): { label: string | null; items: NavItem[] }[] {
  const byGroup = new Map<string, NavItem[]>();
  const ungrouped: NavItem[] = [];

  for (const item of items) {
    if (!item.group) {
      ungrouped.push(item);
      continue;
    }
    if (!byGroup.has(item.group)) byGroup.set(item.group, []);
    byGroup.get(item.group)!.push(item);
  }

  const sections: { label: string | null; items: NavItem[] }[] = GROUP_ORDER
    .filter(g => byGroup.has(g))
    .map(g => ({ label: g, items: byGroup.get(g)! }));

  if (ungrouped.length > 0) {
    sections.push({ label: null, items: ungrouped });
  }

  return sections;
}

export function SidebarNav({ items, isMobile = false }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, role } = useAuth();

  const userName = user?.displayName || 'User';
  const userImage = user?.photoURL || "https://picsum.photos/seed/a1/100/100";

  const profileLink = `/${role || 'student'}/profile`;
  const sections = groupItems(items);

  return (
    <div className={cn("flex h-full flex-col", { "w-full": !isMobile })}>
      <div className={cn("flex h-[88px] items-center border-b px-6", { "border-b": !isMobile, "bg-background": isMobile })}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userImage} alt={userName} data-ai-hint="profile portrait" />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg line-clamp-1">{userName}</p>
            <p className="text-sm text-muted-foreground capitalize">{role || 'student'}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {sections.map((section, sectionIndex) => (
            <div key={section.label ?? `ungrouped-${sectionIndex}`} className={cn(sectionIndex > 0 && "mt-4")}>
              {section.label && (
                <p className="px-3 mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              {section.items.map((item, index) => {
                if (item.href.includes('profile') || item.href.includes('settings')) return null;

                const Icon = (icons as any)[item.icon] as icons.LucideIcon;
                if (!Icon) return null;

                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary mt-1",
                      pathname === item.href && "bg-accent text-accent-foreground hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
       <div className="mt-auto p-4 border-t">
          <div className="grid items-start px-0 text-sm font-medium">
             <Link
                href={profileLink}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary",
                  pathname === profileLink && "bg-accent text-accent-foreground hover:text-accent-foreground",
                )}
              >
                <icons.User className="h-5 w-5" />
                Profile
              </Link>
              <Link
                href="#"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary",
                )}
              >
                <icons.Settings className="h-5 w-5" />
                Settings
              </Link>
          </div>
      </div>
    </div>
  )
}
