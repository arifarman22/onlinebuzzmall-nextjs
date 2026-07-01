import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount, formatDate, formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import DepositActions from '@/components/admin/DepositActions';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';

const PER_PAGE = 20;

export default async function AdminDepositsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string; filter?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const statusFilter = params.status;
  const filter = params.filter || 'all';

  const where: any = {};

  switch (filter) {
    case 'pending': where.status = 2; break;
    case 'approved': where.status = 1; break;
    case 'successful': where.status = 1; break;
    case 'rejected': where.status = 3; break;
    case 'initiated': where.status = 0; break;
    default: break;
  }

  if (statusFilter) where.status = Number(statusFilter);
  if (search) {
    const searchId = Number(search);
    if (searchId > 0) {
      where.OR = [
        { user_id: searchId },
        { trx: { contains: search } },
        { user: { username: { contains: search } } },
      ];
    } else {
      where.OR = [
        { trx: { contains: search } },
        { user: { username: { contains: search } } },
      ];
    }
  }

  const [deposits, total] = await Promise.all([
    db.deposit.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { username: true, email: true } } },
    }),
    db.deposit.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
    0: { label: 'Initiated', variant: 'default' },
    1: { label: 'Approved', variant: 'success' },
    2: { label: 'Pending', variant: 'warning' },
    3: { label: 'Rejected', variant: 'danger' },
  };

  const title = filter === 'pending' ? 'Pending Deposits' :
    filter === 'approved' ? 'Approved Deposits' :
    filter === 'successful' ? 'Successful Deposits' :
    filter === 'rejected' ? 'Rejected Deposits' :
    filter === 'initiated' ? 'Initiated Deposits' : 'All Deposits';

  // Gateway name from method_code
  const getGatewayName = (code: number | null) => {
    if (!code) return '-';
    const map: Record<number, string> = { 1001: 'CoinGate', 1002: 'NOWPayments', 1003: 'Coinbase', 1004: 'Manual Crypto' };
    return map[code] || `Gateway #${code}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">Total: {total}</span>
      </div>

      <SearchFilter
        basePath={`/admin/deposits?filter=${filter}`}
        placeholder="Search by TRX or username..."
        filters={[
          { key: 'status', label: 'All Status', options: [
            { value: '0', label: 'Initiated' },
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
                {deposits.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">No deposits found</td></tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                          {getGatewayName(d.method_code)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a href={`/admin/deposits/${d.id}`} className="font-mono text-xs text-indigo-600 hover:underline">{d.trx || '-'}</a>
                        {(d.detail as any)?.proof_url && <span className="ml-1 text-[10px] text-emerald-600">📎</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {formatDateTime(d.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{d.user?.username || '-'}</p>
                        <p className="text-xs text-gray-400">{d.user?.email || ''}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{formatAmount(d.amount)}</p>
                        {d.charge > 0 && <p className="text-xs text-gray-400">+ {formatAmount(d.charge)} charge</p>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-gray-700">{formatAmount(d.final_amo)}</p>
                        {d.rate !== 1 && d.rate > 0 && (
                          <p className="text-xs text-gray-400">Rate: {d.rate}</p>
                        )}
                        {d.method_currency && (
                          <p className="text-xs text-gray-400">{d.method_currency}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusMap[d.status]?.variant || 'default'}>
                          {statusMap[d.status]?.label || 'Unknown'}
                        </Badge>
                      </td>
                      {filter === 'pending' && (
                        <td className="py-3 px-4">
                          {d.status === 2 && <DepositActions depositId={d.id} amount={d.amount} userName={d.user?.username || ''} />}
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
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/admin/deposits?filter=${filter}`} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
