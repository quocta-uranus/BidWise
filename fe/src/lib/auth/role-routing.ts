import type { AuthUser } from '@/lib/api/auth.api';

export type LoginPortal = 'CLIENT' | 'FREELANCER' | 'ADMIN';

export function userHasPortalAccess(user: AuthUser, portal: LoginPortal): boolean {
  if (portal === 'ADMIN') {
    return user.roles.some((r) => r === 'ADMIN' || r === 'MODERATOR');
  }
  if (portal === 'FREELANCER') {
    return user.roles.includes('FREELANCER');
  }
  return user.roles.includes('CLIENT');
}

export function getPortalRedirect(portal: LoginPortal): string {
  if (portal === 'ADMIN') return '/admin';
  return '/dashboard';
}

export function getLoginPath(portal: LoginPortal): string {
  return `/login/${portal.toLowerCase()}`;
}

export function getPrimaryPortal(user: AuthUser): LoginPortal {
  if (user.roles.some((r) => r === 'ADMIN' || r === 'MODERATOR')) return 'ADMIN';
  if (user.roles.includes('FREELANCER')) return 'FREELANCER';
  return 'CLIENT';
}

export const portalLabels: Record<
  LoginPortal,
  { title: string; subtitle: string; wrongRole: string; registerHint?: string }
> = {
  CLIENT: {
    title: 'Đăng nhập Client',
    subtitle: 'Cổng dành cho khách hàng thuê freelancer',
    wrongRole: 'Tài khoản này không có quyền Client. Vui lòng chọn đúng cổng đăng nhập.',
    registerHint: 'Chưa có tài khoản Client?',
  },
  FREELANCER: {
    title: 'Đăng nhập Freelancer',
    subtitle: 'Cổng dành cho freelancer tìm việc và đấu thầu',
    wrongRole: 'Tài khoản này không có quyền Freelancer. Vui lòng chọn đúng cổng đăng nhập.',
    registerHint: 'Chưa có tài khoản Freelancer?',
  },
  ADMIN: {
    title: 'Đăng nhập Admin',
    subtitle: 'Cổng quản trị hệ thống BidWise',
    wrongRole: 'Tài khoản này không có quyền quản trị. Vui lòng dùng cổng Client hoặc Freelancer.',
  },
};
