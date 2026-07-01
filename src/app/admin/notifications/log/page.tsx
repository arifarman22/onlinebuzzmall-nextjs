import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';

function cleanMessage(msg: string | null): string {
  if (!msg) return '-';
  return msg
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '').replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s+/g, ' ').trim();
}

const PER_PAGE = 30;

export default async function AdminNotificationsLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [notifications, total] = await Promise.all([
    db.notificationLog.findMany({
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.notificationLog.count(),
  ]);

  // Fetch usernames separately for non-admin notifications
  const userIds = [...new Set(notifications.filter(n => n.user_id != null && n.user_id > 0).map(n => n.user_id as number))];
  const users = userIds.length > 0 ? await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, firstname: true, lastname: true },
  }) : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Notifications</h2>
          <p className="text-sm text-gray-500">Total: {total.toLocaleString()}</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Title</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Message</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">User</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Date</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">No notifications found</td></tr>
                ) : notifications.map((n) => (
                  <tr key={n.id} className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${n.is_read === 0 ? 'bg-indigo-50/30' : ''}`}>
                    <td className="py-3 px-3 font-medium text-gray-900 max-w-[200px] truncate">{n.title || '-'}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs max-w-[300px] truncate">{cleanMessage(n.message)}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {!n.user_id || n.user_id === 0 ? (
                        <span className="text-indigo-600 font-medium">Admin</span>
                      ) : userMap[n.user_id] ? (
                        `${userMap[n.user_id].firstname || ''} ${userMap[n.user_id].lastname || ''}`.trim() || `@${userMap[n.user_id].username}`
                      ) : `User #${n.user_id}`}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={n.is_read === 1 ? 'success' : 'warning'}>
                        {n.is_read === 1 ? 'Read' : 'Unread'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">{formatDateTime(n.created_at)}</td>
                    <td className="py-3 px-3">
                      <Link href={`/admin/notifications/log/${n.id}`} className="text-indigo-600 text-xs font-medium hover:underline">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/notifications/log" />
        </CardContent>
      </Card>
    </div>
  );
}
