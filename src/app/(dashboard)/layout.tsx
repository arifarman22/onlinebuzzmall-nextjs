import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth, signOut } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import DashboardClient from '@/components/layout/DashboardClient';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import NotificationBell from '@/components/dashboard/NotificationBell';
import MobileSidebar from '@/components/layout/MobileSidebar';
import BottomNav from '@/components/layout/BottomNav';
import BackButton from '@/components/dashboard/BackButton';
import { getBranding } from '@/lib/branding';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Check deleted via NextAuth session only (skip if impersonating)
  const cookieStore = await cookies();
  const isImpersonating = !!cookieStore.get('imp_token')?.value;

  if (!isImpersonating) {
    const session = await auth();
    if ((session?.user as any)?.deleted) {
      await signOut({ redirect: false });
      redirect('/login?error=account_deleted');
    }
    if ((session?.user as any)?.role === 'admin') {
      redirect('/admin');
    }
  }

  const { logo, siteName } = await getBranding();

  return (
    <DashboardClient>
      <ImpersonationBanner />
      <div className="min-h-screen bg-slate-950 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 py-3">
          <MobileSidebar logo={logo} siteName={siteName} />
          <NotificationBell />
        </div>
        <main className="px-4 pb-8 pt-4 max-w-4xl mx-auto">
          <BackButton />
          {children}
        </main>
        <BottomNav />
      </div>
    </DashboardClient>
  );
}
