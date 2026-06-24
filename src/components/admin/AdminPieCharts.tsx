'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Globe, Monitor, Smartphone } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

interface ChartData {
  name: string;
  value: number;
}

function PieChartCard({ title, icon: Icon, data, loading }: { title: string; icon: any; data: ChartData[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-72">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Icon size={14} className="text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">No data yet</div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: any) => [v, 'Users']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.slice(0, 5).map((item, i) => {
              const total = data.reduce((s, d) => s + d.value, 0);
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-gray-500">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function AdminBrowserChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/traffic-stats?type=browser')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <PieChartCard title="Browsers Used" icon={Monitor} data={data} loading={loading} />;
}

export function AdminOSChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/traffic-stats?type=os')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <PieChartCard title="Operating Systems" icon={Smartphone} data={data} loading={loading} />;
}

export function AdminCountryChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/traffic-stats?type=country')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <PieChartCard title="Traffic by Country" icon={Globe} data={data} loading={loading} />;
}
