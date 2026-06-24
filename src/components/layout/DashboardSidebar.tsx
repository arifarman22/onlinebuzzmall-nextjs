'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import {
  Home,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  User,
  History,
  HelpCircle,
  Menu,
  X,
  Send,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { href: '/transfer', label: 'Transfer', icon: Send },
  { href: '/transactions', label: 'History', icon: History },
  { href: '/invite', label: 'Invite Friends', icon: Users },
  { href: '/support', label: 'Support', icon: HelpCircle },
  { href: '/profile', label: 'Profile & Security', icon: User },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
            OnlineBuzz
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => useAppStore.getState().setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="px-4 py-2 text-xs text-gray-400">© OnlineBuzz Mall</div>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { toggleSidebar } = useAppStore();
  return (
    <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
      <Menu size={24} />
    </button>
  );
}
