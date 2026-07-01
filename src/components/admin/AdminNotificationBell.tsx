'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string | null;
  message: string | null;
  type: string | null;
  is_read: number;
  created_at: string;
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications?action=recent');
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch {}
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }} className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Admin Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center gap-1">
                    <CheckCheck size={11} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}><X size={14} className="text-gray-400" /></button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No notifications</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${n.is_read === 0 ? 'bg-indigo-50/50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${n.is_read === 0 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                      <p className="text-xs font-medium text-gray-900">{n.title}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 ml-4 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1 ml-4">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <Link href="/admin/notifications/log" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 transition-colors">
              View all Notifications <ArrowRight size={12} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
