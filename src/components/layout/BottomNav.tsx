'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HelpCircle, User, ClipboardList } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/records', label: 'Record', icon: ClipboardList },
  { href: '/support', label: 'Support', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#0f172a', borderTop: '1px solid #1e293b', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ display: 'flex', height: '56px', width: '100%' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', textDecoration: 'none', color: isActive ? '#34d399' : '#64748b' }}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
