'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Home, ShoppingCart, HelpCircle, User, Wallet, History, Users, LogOut, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/invite', label: 'Referrals', icon: Users },
  { href: '/support', label: 'Support', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

interface Props {
  logo?: string;
  siteName?: string;
}

export default function Sidebar({ logo, siteName = 'OnlineBuzz' }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={siteName} className="h-8 max-w-[140px] object-contain" />
          ) : (
            <h1 className="text-lg font-bold text-emerald-400">{siteName}</h1>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
