'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  title: string | null;
  message: string | null;
  type: string | null;
  is_read: number;
  created_at: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/notifications');
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await fetch('/api/user/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read_all' }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const handleClick = (n: Notification) => {
    setOpen(false);
    router.push(`/notifications/${n.id}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-emerald-400 font-medium hover:underline flex items-center gap-1">
                    <CheckCheck size={11} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}><X size={14} className="text-slate-500" /></button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-slate-500 text-center py-8">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No notifications</p>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`px-4 py-3 border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-800 ${n.is_read === 0 ? 'bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.is_read === 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${n.is_read === 0 ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {n.message?.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]*>/g, '').replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim()}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                      {n.is_read === 0 && (
                        <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">New</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-emerald-400 hover:bg-slate-800 border-t border-slate-800 transition-colors"
            >
              View all notifications <ArrowRight size={12} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
