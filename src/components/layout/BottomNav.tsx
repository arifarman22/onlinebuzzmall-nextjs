'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HelpCircle, User, ClipboardList, ShoppingCart } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/records', label: 'Record', icon: ClipboardList },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, center: true },
  { href: '/support', label: 'Support', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#0f172a', borderTop: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', height: '56px', width: '100%', alignItems: 'center' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          if ((item as any).center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', textDecoration: 'none' }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? '#059669' : '#1e293b',
                  border: isActive ? '2px solid #34d399' : '2px solid #334155',
                  marginBottom: '2px',
                }}>
                  <item.icon size={20} strokeWidth={2.5} color={isActive ? '#fff' : '#64748b'} />
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: isActive ? '#34d399' : '#64748b' }}>
                  {item.label}
                </span>
              </Link>
            );
          }

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
