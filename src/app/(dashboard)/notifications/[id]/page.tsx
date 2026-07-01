import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Bell, ArrowRight, CheckCircle } from 'lucide-react';
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

function parseLink(type: string | null): string | null {
  if (!type) return null;
  const parts = type.split('|');
  // format: system|userLink|adminLink — return userLink
  return parts[1] || null;
}

function getLinkLabel(link: string): string {
  if (link.includes('transaction')) return 'View Transactions';
  if (link.includes('deposit')) return 'View Deposits';
  if (link.includes('withdraw')) return 'View Withdrawals';
  if (link.includes('order')) return 'View Orders';
  if (link.includes('profile')) return 'Go to Profile';
  if (link.includes('support')) return 'Go to Support';
  return 'View Details';
}

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const notification = await db.notificationLog.findUnique({
    where: { id: Number(id) },
  });

  if (!notification || notification.user_id !== Number(session.user.id)) notFound();

  // Mark as read
  if (notification.is_read === 0) {
    await db.notificationLog.update({
      where: { id: notification.id },
      data: { is_read: 1, read_at: new Date() },
    });
  }

  const link = parseLink(notification.type);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">{notification.title}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                <CheckCircle size={9} /> Read
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Message body */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Message</h3>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {cleanMessage(notification.message)}
        </p>
      </div>

      {/* Action button */}
      {link && (
        <Link
          href={link}
          className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/15 transition-colors group"
        >
          <span className="text-sm font-medium text-emerald-400">{getLinkLabel(link)}</span>
          <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      <Link href="/notifications" className="block text-center text-xs text-slate-500 hover:text-slate-400 pb-2">
        ← Back to all notifications
      </Link>
    </div>
  );
}
