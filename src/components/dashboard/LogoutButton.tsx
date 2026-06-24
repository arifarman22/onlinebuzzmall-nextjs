'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
    >
      <LogOut size={16} /> Logout
    </button>
  );
}
