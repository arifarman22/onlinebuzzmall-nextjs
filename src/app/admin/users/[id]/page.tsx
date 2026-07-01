import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { formatAmount, formatDate, formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import UserInfoEditor from '@/components/admin/UserInfoEditor';
import UserDetailActions from '@/components/admin/UserDetailActions';
import UserQuickActions from '@/components/admin/UserQuickActions';
import UserRankAndAssignment from '@/components/admin/UserRankAndAssignment';
import Link from 'next/link';
import {
  User, Mail, Phone, Calendar, DollarSign, ShoppingBag,
  Users, Shield, GitBranch, TrendingUp, Clock, Hash,
  CheckCircle, XCircle, AlertCircle, ArrowLeft,
} from 'lucide-react';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);

  const user = await db.user.findUnique({ where: { id: userId }, include: { userExtra: true } });
  if (!user) return notFound();

  const [sponsor, posParent, referrals, orderSetAssigns, plan, orders, deposits, withdrawals, rank] = await Promise.all([
    user.ref_by ? db.user.findUnique({ where: { id: user.ref_by }, select: { id: true, username: true, firstname: true, lastname: true, email: true } }) : null,
    user.pos_id ? db.user.findUnique({ where: { id: user.pos_id }, select: { id: true, username: true, firstname: true, lastname: true } }) : null,
    db.user.findMany({ where: { ref_by: userId }, select: { id: true, username: true, firstname: true, lastname: true, created_at: true }, take: 10, orderBy: { id: 'desc' } }),
    db.orderSetAssign.findMany({ where: { user_id: userId }, include: { orderSet: { select: { id: true, name: true, total_profit: true } } }, orderBy: { id: 'desc' } }),
    user.plan_id > 0 ? db.plan.findUnique({ where: { id: user.plan_id } }) : null,
    db.orderComplete.findMany({ where: { user_id: userId }, include: { order: { select: { type: true, platform_id: true } } }, orderBy: { id: 'desc' }, take: 50 }),
    db.deposit.findMany({ where: { user_id: userId }, orderBy: { id: 'desc' }, take: 5 }),
    db.withdrawal.findMany({ where: { user_id: userId }, orderBy: { id: 'desc' }, take: 5 }),
    user.rank_id > 0 ? db.userRankSetting.findUnique({ where: { id: user.rank_id } }) : null,
  ]);

  const totalDeposited = deposits.filter(d => d.status === 1).reduce((s, d) => s + d.amount, 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 1).reduce((s, w) => s + w.amount, 0);
  const completedOrders = orders.filter(o => o.status === 1).length;

  const statuses = [
    { label: 'Email', verified: user.ev === 1 },
    { label: 'KYC', verified: user.kv === 1 },
    { label: '2FA', verified: user.ts === 1 },
    { label: 'Account', verified: user.status === 1 },
  ];

  return (
    <div className="space-y-6">

      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/users" className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {(user.firstname?.[0] || user.username[0]).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.firstname} {user.lastname}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-500">@{user.username}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400 font-mono">ID #{user.id}</span>
                  {rank && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">{rank.name}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Badge variant={user.status === 1 ? 'success' : 'danger'}>
          {user.status === 1 ? 'Active' : 'Banned'}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <UserQuickActions userId={user.id} username={user.username} status={user.status} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Balance', value: formatAmount(user.balance), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Deposited', value: formatAmount(totalDeposited), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Withdrawn', value: formatAmount(totalWithdrawn), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Orders Done', value: completedOrders, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Referral Comm.', value: formatAmount(user.total_ref_com), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Frozen', value: formatAmount(user.freeze_amount), icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Direct Referrals', value: referrals.length, icon: GitBranch, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Daily Limit', value: user.daily_order_limit, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={14} className={s.color} />
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Verification Status</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statuses.map((s) => (
            <div key={s.label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${s.verified ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {s.verified ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={15} className="text-red-400 flex-shrink-0" />}
              <div>
                <p className="text-xs font-medium text-gray-700">{s.label}</p>
                <p className={`text-[10px] ${s.verified ? 'text-emerald-600' : 'text-red-500'}`}>{s.verified ? 'Verified' : 'Not verified'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Phone, label: 'Mobile', value: user.mobile ? `${user.country_code || ''} ${user.mobile}` : '—' },
            { icon: Calendar, label: 'Joined', value: formatDate(user.created_at) },
            { icon: Hash, label: 'Plan', value: plan?.name || 'No Plan' },
            { icon: User, label: 'Referrer', value: sponsor ? `@${sponsor.username} (ID: ${sponsor.id})` : 'None' },
            { icon: GitBranch, label: 'Position', value: user.position === 1 ? 'Left' : user.position === 2 ? 'Right' : 'None' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <item.icon size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 w-20 flex-shrink-0">{item.label}</span>
              <span className="font-medium text-gray-900 truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* VIP Rank + Order Set */}
      <UserRankAndAssignment userId={user.id} currentRankId={user.rank_id} />

      {/* Balance Actions + Info Editor side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div id="balance-section">
          <UserDetailActions user={{ id: user.id, status: user.status, balance: user.balance, freeze_amount: user.freeze_amount, username: user.username }} />
        </div>
        <div id="info-section">
          <UserInfoEditor user={{
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            ref_by: user.ref_by,
            withdrawal_password: user.withdrawal_password,
            daily_order_limit: user.daily_order_limit,
            created_at: user.created_at.toISOString(),
          }} />
        </div>
      </div>

      {/* Referrals + Sponsors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sponsors</p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-400 mb-1">Referral Sponsor</p>
              {sponsor ? (
                <Link href={`/admin/users/${sponsor.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                  @{sponsor.username} — {sponsor.firstname} {sponsor.lastname}
                </Link>
              ) : <p className="text-sm text-gray-400">No referrer</p>}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-400 mb-1">Position Parent (Binary Tree)</p>
              {posParent ? (
                <Link href={`/admin/users/${posParent.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                  @{posParent.username} — {posParent.firstname} {posParent.lastname}
                </Link>
              ) : <p className="text-sm text-gray-400">No position parent</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Direct Referrals ({referrals.length})</p>
          {referrals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No referrals yet</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref) => (
                <Link key={ref.id} href={`/admin/users/${ref.id}`} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                  <span className="text-sm font-medium text-gray-800">@{ref.username}</span>
                  <span className="text-xs text-gray-400">{formatDate(ref.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Deposits + Withdrawals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Recent Deposits</p>
            <Link href={`/admin/deposits?search=${user.id}`} className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {deposits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No deposits</p>
            ) : deposits.map((d) => (
              <Link key={d.id} href={`/admin/deposits/${d.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatAmount(d.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(d.created_at)}</p>
                </div>
                <Badge variant={d.status === 1 ? 'success' : d.status === 2 ? 'warning' : 'danger'}>
                  {d.status === 1 ? 'Approved' : d.status === 2 ? 'Pending' : 'Rejected'}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Recent Withdrawals</p>
            <Link href={`/admin/withdrawals?search=${user.id}`} className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {withdrawals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No withdrawals</p>
            ) : withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatAmount(w.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(w.created_at)}</p>
                </div>
                <Badge variant={w.status === 1 ? 'success' : w.status === 2 ? 'warning' : 'danger'}>
                  {w.status === 1 ? 'Approved' : w.status === 2 ? 'Pending' : 'Rejected'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Set Assignments */}
      {orderSetAssigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Order Set Assignments</p>
          </div>
          <div className="divide-y divide-gray-50">
            {orderSetAssigns.map((osa) => (
              <div key={osa.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{osa.orderSet?.name || `Set #${osa.order_set_id}`}</p>
                  <p className="text-xs text-gray-400">Profit: {formatAmount(osa.orderSet?.total_profit || 0)}</p>
                </div>
                <div className="flex items-center gap-2 w-32">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${osa.percentage_completed}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{osa.percentage_completed.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Order History</p>
          <span className="text-xs text-gray-400">{orders.length} orders · {completedOrders} completed</span>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No orders found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Order No</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Profit</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Balance After</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{o.order_no || '—'}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{formatAmount(o.price)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{formatAmount(o.profit)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatAmount(o.balance)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={o.status === 1 ? 'success' : o.status === 0 ? 'warning' : 'danger'}>
                        {o.status === 1 ? 'Completed' : o.status === 0 ? 'Pending' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">{o.end_at ? formatDateTime(o.end_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
