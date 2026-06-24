import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, UserCheck, MailX, PhoneOff,
  ArrowDownToLine, ArrowUpFromLine, Clock, XCircle,
} from 'lucide-react';
import { AdminBrowserChart, AdminOSChart, AdminCountryChart } from '@/components/admin/AdminPieCharts';
import { ClientAdminRevenueChart, ClientAdminUserChart } from '@/components/admin/ClientAdminCharts';

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    activeUsers,
    unverifiedEmail,
    unverifiedMobile,
    totalDepositSum,
    totalWithdrawSum,
    pendingDeposits,
    rejectedDeposits,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 1 } }),
    db.user.count({ where: { ev: 0 } }),
    db.user.count({ where: { sv: 0 } }),
    db.deposit.aggregate({ where: { status: 1 }, _sum: { amount: true } }),
    db.withdrawal.aggregate({ where: { status: 1 }, _sum: { amount: true } }),
    db.deposit.count({ where: { status: 2 } }),
    db.deposit.count({ where: { status: 3 } }),
  ]);

  // Revenue chart (last 30 days)
  const revenueData = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i)); d.setHours(0, 0, 0, 0); return d;
    }).map(async (day) => {
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const [dep, wit] = await Promise.all([
        db.deposit.aggregate({ where: { status: 1, created_at: { gte: day, lt: next } }, _sum: { amount: true } }),
        db.withdrawal.aggregate({ where: { status: 1, created_at: { gte: day, lt: next } }, _sum: { amount: true } }),
      ]);
      return { date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), deposits: dep._sum.amount || 0, withdrawals: wit._sum.amount || 0 };
    })
  );

  // User registration chart (last 30 days)
  const userData = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i)); d.setHours(0, 0, 0, 0); return d;
    }).map(async (day) => {
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const count = await db.user.count({ where: { created_at: { gte: day, lt: next } } });
      return { date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), users: count };
    })
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* User Statistics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">User Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers.toLocaleString()}</p>
                </div>
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsers.toLocaleString()}</p>
                </div>
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck size={20} className="text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Unverified Email</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{unverifiedEmail.toLocaleString()}</p>
                </div>
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
                  <MailX size={20} className="text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Unverified Mobile</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{unverifiedMobile.toLocaleString()}</p>
                </div>
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                  <PhoneOff size={20} className="text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Deposit</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(totalDepositSum._sum.amount || 0)}</p>
                </div>
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <ArrowDownToLine size={20} className="text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(totalWithdrawSum._sum.amount || 0)}</p>
                </div>
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                  <ArrowUpFromLine size={20} className="text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending Deposits</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{pendingDeposits}</p>
                </div>
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock size={20} className="text-amber-600" />
                </div>
              </div>
              <Link href="/admin/deposits" className="inline-block mt-3 text-xs text-indigo-600 hover:underline font-medium">View All →</Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Rejected Deposits</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{rejectedDeposits}</p>
                </div>
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle size={20} className="text-red-600" />
                </div>
              </div>
              <Link href="/admin/deposits" className="inline-block mt-3 text-xs text-indigo-600 hover:underline font-medium">Rejected Deposits →</Link>
            </CardContent>
          </Card>
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
