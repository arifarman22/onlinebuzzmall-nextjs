'use client';

import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface RevenueChartProps {
  data: { date: string; deposits: number; withdrawals: number }[];
}

export function AdminRevenueChart({ data }: RevenueChartProps) {
  const totalDep = data.reduce((s, d) => s + d.deposits, 0);
  const totalWit = data.reduce((s, d) => s + d.withdrawals, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Deposits vs Withdrawals</h3>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="text-emerald-600 font-medium">${totalDep.toFixed(0)} deposited</p>
          <p className="text-orange-600 font-medium">${totalWit.toFixed(0)} withdrawn</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="witGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2} fill="url(#depGrad)" name="Deposits" />
            <Area type="monotone" dataKey="withdrawals" stroke="#f97316" strokeWidth={2} fill="url(#witGrad)" name="Withdrawals" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface UserChartProps {
  data: { date: string; users: number }[];
}

export function AdminUserChart({ data }: UserChartProps) {
  const totalNew = data.reduce((s, d) => s + d.users, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">New Registrations</h3>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </div>
        </div>
        <span className="text-sm font-bold text-cyan-600">{totalNew} new</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} name="New Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
