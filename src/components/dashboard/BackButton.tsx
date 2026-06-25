'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on main dashboard
  if (pathname === '/dashboard') return null;

  return (
    <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4">
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
}
