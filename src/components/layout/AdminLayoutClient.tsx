'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
  roleSlug?: string;
  logo?: string;
  siteName?: string;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ user, roleSlug, logo, siteName, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} roleSlug={roleSlug} logo={logo} siteName={siteName} />

      {/* Main content area - offset on desktop only */}
      <div className="flex-1 lg:ml-64 flex flex-col h-dvh overflow-hidden">
        <AdminHeader user={user} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
