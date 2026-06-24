'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

interface RevenueChartProps {
  data: { date: string; deposits: number; withdrawals: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-xs text-gray-400">Deposits vs Withdrawals (30 days)</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2} fill="url(#depositGrad)" name="Deposits" />
            <Area type="monotone" dataKey="withdrawals" stroke="#f97316" strokeWidth={2} fill="url(#withdrawGrad)" name="Withdrawals" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface UserGrowthChartProps {
  data: { date: string; users: number }[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
          <Activity size={16} className="text-cyan-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">User Registrations</h3>
          <p className="text-xs text-gray-400">New users (30 days)</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="New Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface OrdersChartProps {
  data: { date: string; orders: number; profit: number }[];
}

export function AdminOrdersChart({ data }: OrdersChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
          <BarChart3 size={16} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Orders & Profit</h3>
          <p className="text-xs text-gray-400">Last 14 days</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="orders" fill="#a855f7" radius={[3, 3, 0, 0]} name="Orders" />
            <Bar dataKey="profit" fill="#6366f1" radius={[3, 3, 0, 0]} name="Profit ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StatusPieProps {
  data: { name: string; value: number; color: string }[];
  title: string;
  subtitle: string;
}

export function StatusPieChart({ data, title, subtitle }: StatusPieProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
          <PieIcon size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
