import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Bell, Circle } from 'lucide-react';

function cleanMessage(msg: string | null): string {
  if (!msg) return '';
  return msg
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s+/g, ' ').trim();
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const notifications = await db.notificationLog.findMany({
    where: { user_id: Number(session.user.id) },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">{notifications.filter(n => n.is_read === 0).length} unread</p>
        </div>
        {notifications.some(n => n.is_read === 0) && (
          <form action="/api/user/notifications" method="POST">
            <Link
              href="/notifications?markAll=1"
              className="text-xs text-emerald-400 hover:underline"
            >
              Mark all read
            </Link>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 py-14 text-center">
            <Bell size={28} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <Link
              key={n.id}
              href={`/notifications/${n.id}`}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors hover:border-slate-600 ${n.is_read === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {n.is_read === 0
                  ? <Circle size={8} className="text-emerald-400 fill-emerald-400" />
                  : <Circle size={8} className="text-slate-700 fill-slate-700" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.is_read === 0 ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cleanMessage(n.message)}</p>
                <p className="text-[10px] text-slate-600 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {n.is_read === 0 && (
                <span className="flex-shrink-0 text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">New</span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
