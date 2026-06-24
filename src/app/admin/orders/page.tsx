import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';

const PER_PAGE = 20;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const status = params.status;

  const where: any = {};
  if (status !== undefined && status !== '') where.status = Number(status);
  if (search) {
    where.OR = [
      { order_no: { contains: search } },
      { user: { username: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.orderComplete.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { username: true } } },
    }),
    db.orderComplete.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <span className="text-sm text-gray-500">Total: {total.toLocaleString()}</span>
      </div>

      <SearchFilter
        basePath="/admin/orders"
        placeholder="Search order no, username..."
        filters={[
          { key: 'status', label: 'All Status', options: [{ value: '1', label: 'Completed' }, { value: '0', label: 'Pending' }] },
        ]}
      />

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Order No</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">User</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Price</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Profit</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400">No orders found</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs">{o.order_no}</td>
                    <td className="py-3 px-3 font-medium">{o.user?.username}</td>
                    <td className="py-3 px-3">{formatAmount(o.price)}</td>
                    <td className="py-3 px-3 text-emerald-600 font-medium">{formatAmount(o.profit)}</td>
                    <td className="py-3 px-3">
                      <Badge variant={o.status === 1 ? 'success' : 'warning'}>
                        {o.status === 1 ? 'Completed' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{o.end_at ? formatDate(o.end_at) : formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/orders" />
        </CardContent>
      </Card>
    </div>
  );
}
