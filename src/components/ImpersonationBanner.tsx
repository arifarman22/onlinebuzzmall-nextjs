'use client';

import { useSession, signOut } from 'next-auth/react';
import { Shield, ArrowLeft } from 'lucide-react';

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const impersonatedBy = (session?.user as any)?.impersonatedBy;

  if (!impersonatedBy) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Shield size={16} />
        <span className="font-medium">Admin Impersonation Mode</span>
        <span className="text-amber-100 text-xs">— You are viewing this account as admin</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/admin/dashboard' })}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
      >
        <ArrowLeft size={12} /> Return to Admin
      </button>
    </div>
  );
}
