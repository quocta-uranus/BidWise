'use client';

import { useAuthStore } from '@/lib/auth/auth.store';
import ProfileTab from '@/components/freelancer/ProfileTab';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return <ProfileTab />;
}
