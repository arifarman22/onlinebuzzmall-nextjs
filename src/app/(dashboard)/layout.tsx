import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import DashboardClient from '@/components/layout/DashboardClient';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import NotificationBell from '@/components/dashboard/NotificationBell';
import MobileSidebar from '@/components/layout/MobileSidebar';
import BottomNav from '@/components/layout/BottomNav';
import { getBranding } from '@/lib/branding';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if ((session.user as any).deleted) {
    await signOut({ redirect: false });
    redirect('/login?error=account_deleted');
  }

  if ((session.user as any).role === 'admin') {
    redirect('/admin');
  }

  const { logo, siteName } = await getBranding();

  return (
    <DashboardClient>
      <ImpersonationBanner />
      <div className="min-h-screen bg-slate-950 pb-16 lg:pb-0">
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 py-3">
          <MobileSidebar logo={logo} siteName={siteName} />
          <NotificationBell />
        </div>
        <main className="px-4 pb-4 pt-4 max-w-4xl mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </DashboardClient>
  );
}
