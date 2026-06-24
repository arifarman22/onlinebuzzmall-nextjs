import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount, formatDate, formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import WithdrawalActions from '@/components/admin/WithdrawalActions';
import WithdrawalMethodsManager from '@/components/admin/WithdrawalMethodsManager';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';

const PER_PAGE = 20;

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string; filter?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const statusFilter = params.status;
  const filter = params.filter || 'all';

  // Withdrawal Methods view — use client component with full CRUD
  if (filter === 'methods') {
    return <WithdrawalMethodsManager />;
  }

  // Withdrawals list view
  const where: any = {};

  switch (filter) {
    case 'pending': where.status = 2; break;
    case 'approved': where.status = 1; break;
    case 'rejected': where.status = 3; break;
    default: break;
  }

  if (statusFilter) where.status = Number(statusFilter);
  if (search) {
    where.OR = [
      { trx: { contains: search } },
      { user: { username: { contains: search } } },
    ];
  }

  const [withdrawals, total] = await Promise.all([
    db.withdrawal.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { username: true, email: true } } },
    }),
    db.withdrawal.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
    0: { label: 'Initiated', variant: 'default' },
    1: { label: 'Approved', variant: 'success' },
    2: { label: 'Pending', variant: 'warning' },
    3: { label: 'Rejected', variant: 'danger' },
  };

  const title = filter === 'pending' ? 'Pending Withdrawals' :
    filter === 'approved' ? 'Approved Withdrawals' :
    filter === 'rejected' ? 'Rejected Withdrawals' : 'All Withdrawals';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">Total: {total}</span>
      </div>

      <SearchFilter
        basePath={`/admin/withdrawals?filter=${filter}`}
        placeholder="Search by TRX or username..."
        filters={[
          { key: 'status', label: 'All Status', options: [
            { value: '1', label: 'Approved' },
            { value: '2', label: 'Pending' },
            { value: '3', label: 'Rejected' },
          ]},
        ]}
      />

      <Card>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Gateway</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Transaction</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Initiated</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Conversion</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Status</th>
                  {filter === 'pending' && <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Action</th>}
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">No withdrawals found</td></tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          {w.currency || 'Default'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs text-gray-700">{w.trx || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {formatDateTime(w.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{w.user?.username || '-'}</p>
                        <p className="text-xs text-gray-400">{w.user?.email || ''}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{formatAmount(w.amount)}</p>
                        {w.charge > 0 && <p className="text-xs text-gray-400">- {formatAmount(w.charge)} charge</p>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-gray-700">{formatAmount(w.final_amount)}</p>
                        {w.rate !== 1 && w.rate > 0 && (
                          <p className="text-xs text-gray-400">Rate: {w.rate}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusMap[w.status]?.variant || 'default'}>
                          {statusMap[w.status]?.label || 'Unknown'}
                        </Badge>
                      </td>
                      {filter === 'pending' && (
                        <td className="py-3 px-4">
                          {w.status === 2 && <WithdrawalActions withdrawalId={w.id} userId={w.user_id} amount={w.amount} />}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-100">
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/admin/withdrawals?filter=${filter}`} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
