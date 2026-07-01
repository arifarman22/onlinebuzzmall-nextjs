import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAmount, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import SearchFilter from '@/components/ui/SearchFilter';
import UserStatusToggle from '@/components/admin/UserStatusToggle';

const PER_PAGE = 20;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string; filter?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const statusFilter = params.status;
  const filter = params.filter || 'all';

  const where: any = {};

  // Sidebar filter
  switch (filter) {
    case 'active': {
      // Users who logged in within last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUserIds = await db.userLogin.findMany({
        where: { created_at: { gte: sevenDaysAgo } },
        select: { user_id: true },
        distinct: ['user_id'],
      });
      where.id = { in: activeUserIds.map(u => u.user_id) };
      where.status = 1;
      break;
    }
    case 'banned': where.status = 0; break;
    case 'agent': where.plan_id = { gt: 0 }; break;
    default: break;
  }

  // Manual status filter override
  if (statusFilter !== undefined && statusFilter !== '') {
    where.status = Number(statusFilter);
  } else if (!where.status) {
    // Exclude soft-deleted users unless a specific status filter is active
    where.status = { not: -1 };
  }

  if (search) {
    const searchId = Number(search);
    if (searchId > 0) {
      where.OR = [
        { id: searchId },
        { username: { contains: search } },
        { email: { contains: search } },
        { firstname: { contains: search } },
        { lastname: { contains: search } },
      ];
    } else {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { firstname: { contains: search } },
        { lastname: { contains: search } },
      ];
    }
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const title = filter === 'active' ? 'Active Users' : filter === 'banned' ? 'Banned Users' : filter === 'agent' ? 'Agent Accounts' : 'All Users';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">Total: {total}</span>
        </div>
        {filter === 'all' && (
          <Link href="/admin/users/create" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Create User</Link>
        )}
        {filter === 'agent' && (
          <Link href="/admin/users/create-agent" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Create Agent</Link>
        )}
      </div>

      <SearchFilter
        basePath={`/admin/users?filter=${filter}`}
        placeholder="Search username, email, name..."
        filters={[
          { key: 'status', label: 'All Status', options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Banned' }] },
        ]}
      />

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">User</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Email - Phone</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Task Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Joined At</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Balance</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400">No users found</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-xs text-gray-700">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.mobile || 'No phone'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={user.status === 1 ? 'success' : 'danger'}>
                          {user.status === 1 ? 'Active' : 'Banned'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(user.created_at)}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">{formatAmount(user.balance)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <UserStatusToggle userId={user.id} currentStatus={user.status} username={user.username} />
                          <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-700 text-xs font-medium">
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} basePath={`/admin/users?filter=${filter}`} />
        </CardContent>
      </Card>
    </div>
  );
}
