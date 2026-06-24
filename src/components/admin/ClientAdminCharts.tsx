'use client';

import dynamic from 'next/dynamic';

const RevenueChart = dynamic(
  () => import('./AdminDashboardGraphs').then((m) => ({ default: m.AdminRevenueChart })),
  { ssr: false, loading: () => <div className="bg-white rounded-xl border border-gray-200 p-5 h-72 flex items-center justify-center text-gray-300 text-sm">Loading chart...</div> }
);

const UserChart = dynamic(
  () => import('./AdminDashboardGraphs').then((m) => ({ default: m.AdminUserChart })),
  { ssr: false, loading: () => <div className="bg-white rounded-xl border border-gray-200 p-5 h-72 flex items-center justify-center text-gray-300 text-sm">Loading chart...</div> }
);

export function ClientAdminRevenueChart({ data }: { data: any[] }) {
  return <RevenueChart data={data} />;
}

export function ClientAdminUserChart({ data }: { data: any[] }) {
  return <UserChart data={data} />;
}
