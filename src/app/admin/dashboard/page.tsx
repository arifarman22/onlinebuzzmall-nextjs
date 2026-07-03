import { db } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { formatAmount } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, UserCheck, MailX, PhoneOff,
  ArrowDownToLine, ArrowUpFromLine, Clock, XCircle,
  ChevronRight,
} from 'lucide-react';
import { AdminBrowserChart, AdminOSChart, AdminCountryChart } from '@/components/admin/AdminPieCharts';
import { ClientAdminRevenueChart, ClientAdminUserChart } from '@/components/admin/ClientAdminCharts';

const getDashboardStats = unstable_cache(
  async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers, activeUsers, unverifiedEmail, unverifiedMobile,
      totalDepositSum, totalWithdrawSum, pendingDeposits, rejectedDeposits,
      rawDeposits, rawWithdrawals, rawUsers,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: 1 } }),
      db.user.count({ where: { ev: 0 } }),
      db.user.count({ where: { sv: 0 } }),
      db.deposit.aggregate({ where: { status: 1 }, _sum: { amount: true } }),
      db.withdrawal.aggregate({ where: { status: 1 }, _sum: { amount: true } }),
      db.deposit.count({ where: { status: 2 } }),
      db.deposit.count({ where: { status: 3 } }),
      db.deposit.findMany({
        where: { status: 1, created_at: { gte: thirtyDaysAgo } },
        select: { created_at: true, amount: true },
      }),
      db.withdrawal.findMany({
        where: { status: 1, created_at: { gte: thirtyDaysAgo } },
        select: { created_at: true, amount: true },
      }),
      db.user.findMany({
        where: { created_at: { gte: thirtyDaysAgo } },
        select: { created_at: true },
      }),
    ]);

    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);

    const depMap: Record<string, number> = {};
    const witMap: Record<string, number> = {};
    const usrMap: Record<string, number> = {};

    for (const r of rawDeposits) depMap[dayKey(r.created_at)] = (depMap[dayKey(r.created_at)] || 0) + r.amount;
    for (const r of rawWithdrawals) witMap[dayKey(r.created_at)] = (witMap[dayKey(r.created_at)] || 0) + r.amount;
    for (const r of rawUsers) usrMap[dayKey(r.created_at)] = (usrMap[dayKey(r.created_at)] || 0) + 1;

    const revenueData = days.map(d => ({ date: fmt(d), deposits: depMap[dayKey(d)] || 0, withdrawals: witMap[dayKey(d)] || 0 }));
    const userData = days.map(d => ({ date: fmt(d), users: usrMap[dayKey(d)] || 0 }));

    return { totalUsers, activeUsers, unverifiedEmail, unverifiedMobile, totalDepositSum, totalWithdrawSum, pendingDeposits, rejectedDeposits, revenueData, userData };
  },
  ['admin-dashboard'],
  { revalidate: 120 }
);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  href: string;
}

function StatCard({ label, value, icon, gradient, href }: StatCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className="relative rounded-2xl p-5 overflow-hidden transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-2xl cursor-pointer"
        style={{ background: gradient }}
      >
        {/* Shine */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.25) 0%, transparent 55%)' }} />
        {/* Decorative circles */}
        <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
            <p className="text-3xl font-extrabold text-white mt-2 leading-none tracking-tight">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
            {icon}
          </div>
        </div>

        <div className="relative flex items-center mt-4 text-xs font-semibold transition-colors" style={{ color: 'rgba(255,255,255,0.75)' }}>
          View All <ChevronRight size={13} className="ml-0.5" />
        </div>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const {
    totalUsers, activeUsers, unverifiedEmail, unverifiedMobile,
    totalDepositSum, totalWithdrawSum, pendingDeposits, rejectedDeposits,
    revenueData, userData,
  } = await getDashboardStats();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* User Statistics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">User Statistics</h3>
          <Link href="/admin/users" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5">
            View All Users <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={totalUsers.toLocaleString()}
            href="/admin/users"
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            icon={<Users size={22} className="text-white" />}
          />
          <StatCard
            label="Active Users"
            value={activeUsers.toLocaleString()}
            href="/admin/users?status=active"
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            icon={<UserCheck size={22} className="text-white" />}
          />
          <StatCard
            label="Unverified Email"
            value={unverifiedEmail.toLocaleString()}
            href="/admin/users?ev=0"
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            icon={<MailX size={22} className="text-white" />}
          />
          <StatCard
            label="Unverified Mobile"
            value={unverifiedMobile.toLocaleString()}
            href="/admin/users?sv=0"
            gradient="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
            icon={<PhoneOff size={22} className="text-white" />}
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Financial Summary</h3>
          <Link href="/admin/deposits" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5">
            View Deposits <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Deposited"
            value={formatAmount(totalDepositSum._sum.amount || 0)}
            href="/admin/deposits"
            gradient="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
            icon={<ArrowDownToLine size={22} className="text-white" />}
          />
          <StatCard
            label="Total Withdrawn"
            value={formatAmount(totalWithdrawSum._sum.amount || 0)}
            href="/admin/withdrawals"
            gradient="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
            icon={<ArrowUpFromLine size={22} className="text-white" />}
          />
          <StatCard
            label="Pending Deposits"
            value={pendingDeposits}
            href="/admin/deposits?status=pending"
            gradient="linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
            icon={<Clock size={22} className="text-white" />}
          />
          <StatCard
            label="Rejected Deposits"
            value={rejectedDeposits}
            href="/admin/deposits?status=rejected"
            gradient="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
            icon={<XCircle size={22} className="text-white" />}
          />
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClientAdminRevenueChart data={revenueData} />
        <ClientAdminUserChart data={userData} />
      </div>

      {/* Pie Charts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Traffic Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminBrowserChart />
          <AdminOSChart />
          <AdminCountryChart />
        </div>
      </div>
    </div>
  );
}
