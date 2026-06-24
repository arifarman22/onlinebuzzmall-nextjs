'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, Package, Layers,
  ArrowDownToLine, ArrowUpFromLine, Settings, Shield,
  ChevronDown, ChevronRight, UserCheck, UserX, UserCog, UsersRound,
  CreditCard, Clock, CheckCircle2, XCircle as XCircle2, BookOpen, X, Trash2,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  roleSlug?: string;
  logo?: string;
  siteName?: string;
}

export default function AdminSidebar({ mobileOpen, onClose, roleSlug = 'super-admin', logo, siteName = 'Admin Panel' }: AdminSidebarProps) {
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/deposits/count')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (data.success) setPendingCount(data.pending || 0); })
      .catch(() => {});
  }, [pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.();
  }, [pathname, currentSearchParams]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Manage Users', icon: Users,
      submenu: [
        { href: '/admin/users?filter=all', label: 'All Users', icon: UsersRound },
        { href: '/admin/users?filter=active', label: 'Active Users', icon: UserCheck },
        { href: '/admin/users?filter=agent', label: 'Agent Accounts', icon: UserCog },
        { href: '/admin/users?filter=banned', label: 'Banned Users', icon: UserX },
      ],
    },
    { href: '/admin/gateways', label: 'Gateways', icon: CreditCard },
    { href: '/admin/kyc', label: 'KYC', icon: Shield },
    { href: '/admin/kyc-settings', label: 'KYC Settings', icon: Settings },
    {
      label: 'Deposits', icon: ArrowDownToLine,
      submenu: [
        { href: '/admin/deposits?filter=all', label: 'All Deposits', icon: Layers },
        { href: '/admin/deposits?filter=pending', label: 'Pending Deposits', icon: Clock, badge: pendingCount },
        { href: '/admin/deposits?filter=approved', label: 'Approved Deposits', icon: CheckCircle2 },
        { href: '/admin/deposits?filter=successful', label: 'Successful Deposits', icon: CheckCircle2 },
        { href: '/admin/deposits?filter=rejected', label: 'Rejected Deposits', icon: XCircle2 },
        { href: '/admin/deposits?filter=initiated', label: 'Initiated Deposits', icon: Clock },
      ],
    },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/order-sets', label: 'Order Sets', icon: Layers },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/platforms', label: 'Platforms', icon: Layers },
    { href: '/admin/platform-rules', label: 'Platform Rules', icon: BookOpen },
    { href: '/admin/plans', label: 'Plans', icon: Package },
    {
      label: 'Withdrawals', icon: ArrowUpFromLine,
      submenu: [
        { href: '/admin/withdrawals?filter=methods', label: 'Withdrawal Methods', icon: CreditCard },
        { href: '/admin/withdrawals?filter=pending', label: 'Pending Withdrawals', icon: Clock },
        { href: '/admin/withdrawals?filter=approved', label: 'Approved Withdrawals', icon: CheckCircle2 },
        { href: '/admin/withdrawals?filter=rejected', label: 'Rejected Withdrawals', icon: XCircle2 },
        { href: '/admin/withdrawals?filter=all', label: 'All Withdrawals', icon: Layers },
      ],
    },
    { href: '/admin/commissions', label: 'Commissions', icon: ArrowDownToLine },
    { href: '/admin/support', label: 'Support Tickets', icon: Settings },
    { href: '/admin/support-settings', label: 'Support Settings', icon: Settings },
    { href: '/admin/notifications', label: 'Notifications', icon: Settings },
    { href: '/admin/pages', label: 'Pages (CMS)', icon: Layers },
    { href: '/admin/reports', label: 'Reports', icon: LayoutDashboard },
    { href: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/clear-cache', label: 'Clear Cache', icon: Trash2 },
  ];

  // Role-based menu filtering
  const ROLE_MENUS: Record<string, string[]> = {
    'super-admin': ['*'],
    'moderator': ['Dashboard', 'Manage Users', 'Deposits', 'Withdrawals', 'Orders', 'Order Sets', 'Support', 'KYC', 'Reports'],
    'support': ['Dashboard', 'Support', 'KYC'],
  };

  const allowedMenus = ROLE_MENUS[roleSlug] || ROLE_MENUS['support'];
  const filteredNavItems = allowedMenus.includes('*')
    ? navItems
    : navItems.filter((item) => allowedMenus.includes(item.label));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700 flex-shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={siteName} className="h-8 max-w-[140px] object-contain" />
          ) : (
            <span className="text-xl font-bold text-white">{siteName}</span>
          )}
        </Link>
        <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
          <X size={18} />
        </button>
      </div>

      {/* Nav - scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 overscroll-contain">
        {filteredNavItems.map((item) => {
          if ('submenu' in item && item.submenu) {
            const isOpen = openMenus.includes(item.label);
            const isChildActive = item.submenu.some((s: any) => {
              const sPath = s.href.split('?')[0];
              const sFilter = new URLSearchParams(s.href.split('?')[1] || '').get('filter');
              const currentFilter = currentSearchParams.get('filter');
              return pathname === sPath && currentFilter === sFilter;
            });

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isChildActive ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    {item.label}
                  </div>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                    {item.submenu!.map((sub: any) => {
                      const subPath = sub.href.split('?')[0];
                      const subFilter = new URLSearchParams(sub.href.split('?')[1] || '').get('filter');
                      const currentFilter = currentSearchParams.get('filter');
                      const isActive = pathname === subPath && currentFilter === subFilter;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors',
                            isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <sub.icon size={14} />
                            {sub.label}
                          </div>
                          {sub.badge > 0 && (
                            <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer - no absolute, stays in flow */}
      <div className="p-3 border-t border-slate-700 flex-shrink-0">
        <div className="px-4 py-2 text-xs text-slate-500">© OnlineBuzz Mall</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:block fixed top-0 left-0 h-dvh w-64 bg-slate-900 text-white z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - drawer with overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          {/* Drawer */}
          <aside className="absolute top-0 left-0 h-dvh w-72 bg-slate-900 text-white shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
