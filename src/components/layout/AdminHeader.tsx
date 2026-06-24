'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, Settings, Shield, ChevronDown, Menu } from 'lucide-react';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

interface AdminHeaderProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  onMenuToggle?: () => void;
}

export default function AdminHeader({ user, onMenuToggle }: AdminHeaderProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base md:text-lg font-semibold text-gray-900">Admin Panel</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Notifications */}
        <AdminNotificationBell />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 pl-2 pr-2 md:pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              {user.image ? (
                <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={16} className="text-indigo-600" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 leading-tight">Super Admin</p>
            </div>
            <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link href="/admin/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings size={15} className="text-gray-400" /> Site Settings
                </Link>
                <Link href="/admin/roles" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Shield size={15} className="text-gray-400" /> Roles & Permissions
                </Link>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
