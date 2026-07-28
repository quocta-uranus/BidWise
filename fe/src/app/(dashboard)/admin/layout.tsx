import { Suspense } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">Loading...</div>}>
      {children}
    </Suspense>
  );
}
