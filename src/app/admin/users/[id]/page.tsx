import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatAmount, formatDate, formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import UserInfoEditor from '@/components/admin/UserInfoEditor';
import UserDetailActions from '@/components/admin/UserDetailActions';
import UserQuickActions from '@/components/admin/UserQuickActions';
import UserRankAndAssignment from '@/components/admin/UserRankAndAssignment';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userExtra: true },
  });

  if (!user) return notFound();

  // Get sponsor/referrer info
  const sponsor = user.ref_by ? await db.user.findUnique({
    where: { id: user.ref_by },
    select: { id: true, username: true, firstname: true, lastname: true, email: true },
  }) : null;

  // Get position parent
  const posParent = user.pos_id ? await db.user.findUnique({
    where: { id: user.pos_id },
    select: { id: true, username: true, firstname: true, lastname: true },
  }) : null;

  // Get direct referrals
  const referrals = await db.user.findMany({
    where: { ref_by: userId },
    select: { id: true, username: true, firstname: true, lastname: true, created_at: true },
    take: 10,
    orderBy: { id: 'desc' },
  });

  // Get order set assigns
  const orderSetAssigns = await db.orderSetAssign.findMany({
    where: { user_id: userId },
    include: { orderSet: { select: { id: true, name: true, total_profit: true } } },
    orderBy: { id: 'desc' },
  });

  // Get plan info
  const plan = user.plan_id > 0 ? await db.plan.findUnique({ where: { id: user.plan_id } }) : null;

  // Get order list
  const orders = await db.orderComplete.findMany({
    where: { user_id: userId },
    include: { order: { select: { type: true, platform_id: true } } },
    orderBy: { id: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.firstname} {user.lastname}</h2>
          <p className="text-sm text-gray-500">@{user.username} · ID: {user.id}</p>
        </div>
        <Badge variant={user.status === 1 ? 'success' : 'danger'}>
          {user.status === 1 ? 'Active' : 'Banned'}
        </Badge>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-4">
          <UserQuickActions userId={user.id} username={user.username} status={user.status} />
        </CardContent>
      </Card>

      {/* VIP Rank + Order Set Assignment */}
      <UserRankAndAssignment userId={user.id} currentRankId={user.rank_id} />

      {/* Agent Account */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Agent Account</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Plan</p>
              <p className="font-semibold text-gray-900">{plan ? plan.name : 'No Plan'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Total Invest</p>
              <p className="font-semibold text-gray-900">{formatAmount(user.total_invest)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Referral Commission</p>
              <p className="font-semibold text-emerald-600">{formatAmount(user.total_ref_com)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Binary Commission</p>
              <p className="font-semibold text-indigo-600">{formatAmount(user.total_binary_com)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Balance</p>
              <p className="font-semibold text-gray-900">{formatAmount(user.balance)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Frozen Amount</p>
              <p className="font-semibold text-blue-600">{formatAmount(user.freeze_amount)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Daily Order Limit</p>
              <p className="font-semibold text-gray-900">{user.daily_order_limit}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Position</p>
              <p className="font-semibold text-gray-900">{user.position === 1 ? 'Left' : user.position === 2 ? 'Right' : 'None'}</p>
            </div>
          </div>
          {user.userExtra && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600">BV Left</p>
                <p className="font-semibold text-gray-900">{user.userExtra.bv_left}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600">BV Right</p>
                <p className="font-semibold text-gray-900">{user.userExtra.bv_right}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600">Paid Left</p>
                <p className="font-semibold text-gray-900">{user.userExtra.paid_left}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600">Paid Right</p>
                <p className="font-semibold text-gray-900">{user.userExtra.paid_right}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sponsors of User */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Sponsors of User</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Referral Sponsor</p>
              {sponsor ? (
                <div>
                  <p className="font-medium text-gray-900">{sponsor.firstname} {sponsor.lastname}</p>
                  <p className="text-xs text-gray-500">@{sponsor.username} · {sponsor.email}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No referrer</p>
              )}
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Position Parent (Binary Tree)</p>
              {posParent ? (
                <div>
                  <p className="font-medium text-gray-900">{posParent.firstname} {posParent.lastname}</p>
                  <p className="text-xs text-gray-500">@{posParent.username}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No position parent</p>
              )}
            </div>
          </div>
          {referrals.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Direct Referrals ({referrals.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium">@{ref.username}</span>
                    <span className="text-gray-400">{formatDate(ref.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Set Assign */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Order Set Assign</h3></CardHeader>
        <CardContent>
          {orderSetAssigns.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No order sets assigned</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Order Set</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Total Profit</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {orderSetAssigns.map((osa) => (
                    <tr key={osa.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-medium">{osa.orderSet?.name || `Set #${osa.order_set_id}`}</td>
                      <td className="py-2 px-3 text-emerald-600">{formatAmount(osa.orderSet?.total_profit || 0)}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${osa.percentage_completed}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{osa.percentage_completed.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information of User (Editable) */}
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

      {/* Admin Actions */}
      <div id="balance-section">
        <UserDetailActions user={{ id: user.id, status: user.status, balance: user.balance, freeze_amount: user.freeze_amount, username: user.username }} />
      </div>

      {/* Order List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Order List</h3>
            <span className="text-xs text-gray-500">{orders.length} orders</span>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Sr</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Order #</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Manage Crypto</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Order Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Profit</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Balance</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                          {o.type || o.order?.type || 'Standard'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-700">{o.order_no || `-`}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{o.order?.type === 'crypto' ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatAmount(o.price)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{formatAmount(o.profit)}</td>
                      <td className="py-3 px-4 text-gray-700">{formatAmount(o.balance)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={o.status === 1 ? 'success' : o.status === 0 ? 'warning' : 'danger'}>
                          {o.status === 1 ? 'Completed' : o.status === 0 ? 'Pending' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {o.end_at ? formatDateTime(o.end_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
