import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';

const PER_PAGE = 20;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const status = params.status;

  const where: any = {};
  if (status !== undefined && status !== '') where.status = Number(status);
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { platform: { name: { contains: search } } },
    ];
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { platform: { select: { name: true } } },
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Total: {total.toLocaleString()}</p>
        </div>
        <Link href="/admin/products/create" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Create Product</Link>
      </div>

      <SearchFilter
        basePath="/admin/products"
        placeholder="Search product name, platform..."
        filters={[
          { key: 'status', label: 'All Status', options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
        ]}
      />

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Image</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Name</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Platform</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Price</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Quantity</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">No products found</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      {p.image ? (
                        <img src={p.image.startsWith('http') ? p.image : `/${p.image}`} alt={p.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium">{p.name}</td>
                    <td className="py-3 px-3 text-gray-600">{p.platform?.name}</td>
                    <td className="py-3 px-3">{formatAmount(p.price)}</td>
                    <td className="py-3 px-3">{p.quantity}</td>
                    <td className="py-3 px-3">
                      <Badge variant={p.status === 1 ? 'success' : 'danger'}>
                        {p.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Link href={`/admin/products/${p.id}`} className="text-indigo-600 text-xs font-medium">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/products" />
        </CardContent>
      </Card>
    </div>
  );
}
