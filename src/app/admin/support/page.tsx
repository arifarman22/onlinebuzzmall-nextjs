import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';

const PER_PAGE = 20;

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const status = params.status;

  const where: any = {};
  if (status !== undefined && status !== '') where.status = Number(status);
  if (search) {
    where.OR = [
      { ticket: { contains: search } },
      { subject: { contains: search } },
      { user: { username: { contains: search } } },
    ];
  }

  const [tickets, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { username: true } } },
    }),
    db.supportTicket.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
    0: { label: 'Open', variant: 'info' },
    1: { label: 'Answered', variant: 'success' },
    2: { label: 'Replied', variant: 'warning' },
    3: { label: 'Closed', variant: 'default' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
        <span className="text-sm text-gray-500">Total: {total}</span>
      </div>

      <SearchFilter
        basePath="/admin/support"
        placeholder="Search ticket, subject, username..."
        filters={[
          { key: 'status', label: 'All Status', options: [
            { value: '0', label: 'Open' }, { value: '1', label: 'Answered' },
            { value: '2', label: 'Replied' }, { value: '3', label: 'Closed' },
          ]},
        ]}
      />

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Ticket</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">User</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Subject</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Date</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400">No tickets found</td></tr>
                ) : tickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs">#{t.ticket}</td>
                    <td className="py-3 px-3">{t.user?.username || t.name}</td>
                    <td className="py-3 px-3 font-medium max-w-[200px] truncate">{t.subject}</td>
                    <td className="py-3 px-3"><Badge variant={statusMap[t.status]?.variant || 'default'}>{statusMap[t.status]?.label}</Badge></td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(t.created_at)}</td>
                    <td className="py-3 px-3"><Link href={`/admin/support/${t.id}`} className="text-indigo-600 text-xs font-medium">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/support" />
        </CardContent>
      </Card>
    </div>
  );
}
