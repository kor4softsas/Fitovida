import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminAuth from '@/components/admin/AdminAuth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuth>
      <div className="min-h-screen bg-white">
        <AdminSidebar />
        
        {/* Main content */}
        <main className="lg:ml-72">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminAuth>
  );
}
