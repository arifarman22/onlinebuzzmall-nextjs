import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Bell, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

function cleanMessage(msg: string | null): string {
  if (!msg) return 'No message content.';
  return msg
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s+/g, ' ').trim();
}

function parseLinks(type: string | null): { userLink: string | null; adminLink: string | null } {
  if (!type) return { userLink: null, adminLink: null };
  const parts = type.split('|');
  // format: system|userLink|adminLink
  return {
    userLink: parts[1] || null,
    adminLink: parts[2] || null,
  };
}

function deriveLinkFromTitle(title: string | null, userId?: number | null): { link: string; label: string } | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('deposit')) return { link: `/admin/deposits`, label: 'View Deposits' };
  if (t.includes('withdraw')) return { link: `/admin/withdrawals${userId ? `?search=${userId}` : ''}`, label: 'View Withdrawals' };
  if (t.includes('order')) return { link: '/admin/order-sets', label: 'View Orders' };
  if (t.includes('kyc')) return { link: `/admin/kyc`, label: 'View KYC' };
  if (t.includes('support') || t.includes('ticket')) return { link: '/admin/support', label: 'View Support' };
  if (t.includes('user') || t.includes('register')) return { link: userId ? `/admin/users/${userId}` : '/admin/users', label: 'View User' };
  return null;
}

export default async function AdminNotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') return null;

  const { id } = await params;
  const notification = await db.notificationLog.findUnique({ where: { id: Number(id) } });
  if (!notification) notFound();

  // Mark as read
  if (notification.is_read === 0) {
    await db.notificationLog.update({ where: { id: notification.id }, data: { is_read: 1, read_at: new Date() } });
  }

  // Fetch user if applicable
  const user = notification.user_id && notification.user_id > 0
    ? await db.user.findUnique({ where: { id: notification.user_id }, select: { id: true, username: true, firstname: true, lastname: true, email: true } })
    : null;

  const { adminLink: storedAdminLink } = parseLinks(notification.type);
  const derived = !storedAdminLink ? deriveLinkFromTitle(notification.title, notification.user_id) : null;
  const actionLink = storedAdminLink || derived?.link || null;
  const actionLabel = storedAdminLink
    ? (storedAdminLink.includes('deposit') ? 'View Deposit Details' : storedAdminLink.includes('withdraw') ? 'View Withdrawal' : 'View Details')
    : derived?.label || null;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/notifications/log" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Notification #{notification.id}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-indigo-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">{notification.title || 'Notification'}</h2>
            <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${notification.is_read === 1 ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                {notification.is_read === 1 ? 'Read' : 'Unread'}
              </span>
              {notification.type && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                  {notification.type.split('|')[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">User</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
              <User size={16} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {`${user.firstname || ''} ${user.lastname || ''}`.trim() || `@${user.username}`}
              </p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <Link href={`/admin/users/${user.id}`} className="ml-auto text-xs text-indigo-600 hover:underline font-medium">
              View Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Message</h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {cleanMessage(notification.message)}
        </p>
      </div>

      {/* Action */}
      {actionLink && (
        <Link
          href={actionLink}
          className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors group"
        >
          <span className="text-sm font-medium text-indigo-700">{actionLabel}</span>
          <ArrowRight size={16} className="text-indigo-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
