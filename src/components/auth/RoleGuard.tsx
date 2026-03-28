'use client';

import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'teacher' | 'admin')[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (role && !allowedRoles.includes(role)) {
        router.push('/unauthorized');
      }
    }
  }, [user, role, isLoading, allowedRoles, router]);

  if (isLoading || !user || !role || !allowedRoles.includes(role)) {
    return null; 
  }

  return <>{children}</>;
}
