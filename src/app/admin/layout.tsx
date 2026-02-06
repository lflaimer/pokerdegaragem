'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    );
  }

  return (
    <AdminAuthProvider>
      <AdminProtectedRoute>
        <div className="flex min-h-screen bg-gray-900">
          <AdminSidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </AdminProtectedRoute>
    </AdminAuthProvider>
  );
}
