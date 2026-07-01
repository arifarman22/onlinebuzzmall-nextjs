import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount, formatDate, formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';
import Link from 'next/link';
import OrderProductsExpand from '@/components/admin/OrderProductsExpand';

const PER_PAGE = 20;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const status = params.status;

  const where: any = {};
  if (status !== undefined && status !== '') where.status = Number(status);
  if (search) {
    const searchId = Number(search);
    if (searchId > 0) {
      where.OR = [
        { user_id: searchId },
        { order_no: { contains: search } },
        { user: { username: { contains: search } } },
      ];
    } else {
      where.OR = [
        { order_no: { contains: search } },
        { user: { username: { contains: search } } },
      ];
    }
  }

  const [orders, total] = await Promise.all([
    db.orderComplete.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        user: { select: { id: true, username: true } },
        order: {
          include: {
            platform: { select: { id: true, name: true } },
            orderDetails: {
              include: {
                product: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Order No</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Platform</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Products</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Profit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Balance After</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-gray-400">No orders found</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-700">{o.order_no || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                          {o.type || o.order?.type || 'Standard'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-700">
                        {o.order?.platform ? (
                          <Link href={`/admin/platforms`} className="text-indigo-600 hover:underline">
                            {o.order.platform.name}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {o.user ? (
                          <Link href={`/admin/users/${o.user.id}`} className="text-indigo-600 hover:underline font-medium text-xs">
                            @{o.user.username}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <OrderProductsExpand
                          orderId={o.id}
                          products={(o.order?.orderDetails || []).map(d => ({
                            name: d.product?.name || 'Unknown',
                            quantity: d.quantity,
                            price: d.price,
                            image: d.product?.image || null,
                          }))}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatAmount(o.price)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{formatAmount(o.profit)}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{formatAmount(o.balance)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={o.status === 1 ? 'success' : 'warning'}>
                          {o.status === 1 ? 'Completed' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                        {o.end_at ? formatDateTime(o.end_at) : formatDate(o.created_at)}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4">
            <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/orders" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
