import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import AdminLayoutClient from '@/components/layout/AdminLayoutClient';
import { getBranding } from '@/lib/branding';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user && (session.user as any).role === 'admin';

  if (!isAdmin) {
    if (session?.user) {
      const { redirect } = await import('next/navigation');
      redirect('/dashboard');
    }
    return <>{children}</>;
  }

  const roleSlug = (session.user as any).roleSlug || 'super-admin';
  const { adminLogo, logo, siteName } = await getBranding();

  return (
    <Suspense fallback={<div className="h-screen bg-gray-50" />}>
      <AdminLayoutClient
        user={{ name: session.user.name, email: session.user.email, image: session.user.image }}
        roleSlug={roleSlug}
        logo={adminLogo || logo}
        siteName={siteName}
      >
        {children}
      </AdminLayoutClient>
    </Suspense>
  );
}
