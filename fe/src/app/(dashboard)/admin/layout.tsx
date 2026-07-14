import { Suspense } from 'react';
import AuthProvider from '@/components/auth/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">Loading...</div>}>
        {children}
      </Suspense>
    </AuthProvider>
  );
}
