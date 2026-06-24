'use client';

import { useLoginLogger } from '@/hooks/useLoginLogger';

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  useLoginLogger();
  return <>{children}</>;
}
