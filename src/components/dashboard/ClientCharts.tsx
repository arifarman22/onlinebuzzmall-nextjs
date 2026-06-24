'use client';

import dynamic from 'next/dynamic';

const EarningsChartInner = dynamic(
  () => import('./DashboardCharts').then((m) => ({ default: m.EarningsChart })),
  { ssr: false, loading: () => <div className="bg-white rounded-xl border border-gray-200 p-5 h-64 flex items-center justify-center text-gray-300 text-sm">Loading chart...</div> }
);

const OrdersChartInner = dynamic(
  () => import('./DashboardCharts').then((m) => ({ default: m.OrdersChart })),
  { ssr: false, loading: () => <div className="bg-white rounded-xl border border-gray-200 p-5 h-64 flex items-center justify-center text-gray-300 text-sm">Loading chart...</div> }
);

export function ClientEarningsChart({ data }: { data: any[] }) {
  return <EarningsChartInner data={data} />;
}

export function ClientOrdersChart({ data }: { data: any[] }) {
  return <OrdersChartInner data={data} />;
}
