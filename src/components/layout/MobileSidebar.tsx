'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, X, Home, ShoppingCart, Wallet, History, LogOut, ArrowDownToLine, ArrowUpFromLine, Users } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/invite', label: 'Referrals', icon: Users },
];

interface Props {
  logo?: string;
  siteName?: string;
}

export default function MobileSidebar({ logo, siteName = 'OnlineBuzz' }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sidebar = (
    <>
      <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', zIndex: 100000, background: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.5)' }}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #1e293b' }}>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            {logo ? (
              <img src={logo} alt={siteName} style={{ height: '32px', maxWidth: '130px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{siteName}</span>
            )}
          </Link>
          <button onClick={() => setOpen(false)} style={{ padding: '6px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', marginBottom: '2px', color: isActive ? '#34d399' : '#94a3b8', background: isActive ? 'rgba(52,211,153,0.1)' : 'transparent' }}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: '8px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
        <Menu size={22} />
      </button>
      {open && mounted && createPortal(sidebar, document.body)}
    </>
  );
}
