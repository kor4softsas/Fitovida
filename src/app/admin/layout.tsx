import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminAuth from '@/components/admin/AdminAuth';
import { AdminFeedbackProvider } from '@/components/admin/AdminFeedback';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuth>
      <AdminFeedbackProvider>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar />
          
          {/* Main content */}
          <main className="lg:ml-72">
            <div className="p-4 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </AdminFeedbackProvider>
    </AdminAuth>
  );
}
