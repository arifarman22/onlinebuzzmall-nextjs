'use client';

import { useEffect, useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    // Check via NextAuth session
    if ((session?.user as any)?.impersonatedBy) {
      setIsImpersonating(true);
      return;
    }
    // Check via imp_token cookie (no NextAuth session in new tab)
    fetch('/api/admin/impersonate/check')
      .then(r => r.json())
      .then(d => { if (d.impersonating) setIsImpersonating(true); })
      .catch(() => {});
  }, [session]);

  if (!isImpersonating) return null;

  const handleReturn = async () => {
    await fetch('/api/admin/impersonate/check', { method: 'DELETE' });
    window.close();
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Shield size={16} />
        <span className="font-medium">Admin Impersonation Mode</span>
        <span className="text-amber-100 text-xs">— Viewing as user</span>
      </div>
      <button
        onClick={handleReturn}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
      >
        <ArrowLeft size={12} /> Close Tab
      </button>
    </div>
  );
}
