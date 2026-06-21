'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { type LoginPortal, userHasPortalAccess, getPrimaryPortal } from '@/lib/auth/role-routing';

interface RoleGuardProps {
  // Which portal the page belongs to. Omit for pages that any
  // authenticated user can see.
  portal?: LoginPortal;
  children: React.ReactNode;
}

/**
 * Guards an entire route subtree:
 *  - waits for the auth store to finish loading
 *  - redirects unauthenticated users to /login
 *  - when `portal` is given, kicks out users who don't have access
 *    to that portal (e.g. a Freelancer visiting /client/jobs)
 */
export function RoleGuard({ portal, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirect}`);
      return;
    }
    if (portal && !userHasPortalAccess(user, portal)) {
      // Send the user to their own portal — never grant cross-portal access.
      const correct = getPrimaryPortal(user);
      const target = correct === 'ADMIN' ? '/admin' : '/dashboard';
      router.replace(target);
    }
  }, [isLoading, isAuthenticated, user, portal, pathname, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Đang tải...
      </div>
    );
  }

  if (portal && !userHasPortalAccess(user, portal)) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Đang chuyển hướng...
      </div>
    );
  }

  return <>{children}</>;
}
