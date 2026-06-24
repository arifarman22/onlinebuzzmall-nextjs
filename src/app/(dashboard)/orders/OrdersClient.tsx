'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, CheckCircle, Clock, TrendingUp, DollarSign, Percent, Package } from 'lucide-react';
import { formatAmount } from '@/lib/utils';

interface PlatformInfo {
  id: number; name: string; image: string | null; commission: number;
  currency: string; start_price: number; end_price: number; vip_level: number; max_orders_per_day: number;
}

interface AssignmentInfo {
  id: number; order_set_id: number; percentage_completed: number;
  platform_id: number | null; platform_vip: number; orderSetName: string | null; orderCount: number;
}

interface Props {
  user: { balance: number; freeze_amount: number };
  platforms: PlatformInfo[];
  assignments: AssignmentInfo[];
  stats: { completed: number; pending: number; totalProfit: number };
}

function getImageUrl(image: string | null): string | null {
  if (!image || !image.trim()) return null;
  const img = image.trim();
  if (img.startsWith('http') || img.startsWith('/')) return img;
  return `/${img}`;
}

const VIP_CONFIG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'VIP 1', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  2: { label: 'VIP 2', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  3: { label: 'VIP 3', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

export default function OrdersClient({ user, platforms, assignments, stats }: Props) {
  const [activeVip, setActiveVip] = useState<'all' | number>('all');

  const vipLevels = [...new Set(platforms.map(p => p.vip_level))].sort();
  const filteredPlatforms = activeVip === 'all' ? platforms : platforms.filter(p => p.vip_level === activeVip);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
          <CheckCircle size={14} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.completed}</p>
          <p className="text-[9px] text-slate-500">Completed</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
          <Clock size={14} className="text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.pending}</p>
          <p className="text-[9px] text-slate-500">Pending</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
          <TrendingUp size={14} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-400">{formatAmount(stats.totalProfit)}</p>
          <p className="text-[9px] text-slate-500">Profit</p>
        </div>
      </div>

      {/* VIP Level Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveVip('all')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
            activeVip === 'all'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
          }`}
        >
          All
        </button>
        {vipLevels.map((vip) => {
          const cfg = VIP_CONFIG[vip] || VIP_CONFIG[1];
          const isActive = activeVip === vip;
          return (
            <button
              key={vip}
              onClick={() => setActiveVip(vip)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                isActive
                  ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Platform Cards */}
      <div className="space-y-4">
        {filteredPlatforms.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 py-12 text-center">
            <Package size={32} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">No platforms for this level</p>
          </div>
        ) : (
          filteredPlatforms.map((platform) => {
            const platformAssignments = assignments.filter(a => a.platform_id === platform.id);
            const hasAssignment = platformAssignments.length > 0;
            const totalTasks = platformAssignments.reduce((s, a) => s + a.orderCount, 0);
            const completedPct = hasAssignment
              ? platformAssignments.reduce((s, a) => s + a.percentage_completed, 0) / platformAssignments.length
              : 0;

            return (
              <div key={platform.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <div className="flex items-center gap-4 mb-4">
                  {getImageUrl(platform.image) ? (
                    <img src={getImageUrl(platform.image)!} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                      <ShoppingCart size={22} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-white text-base">{platform.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{platform.max_orders_per_day} orders/day · {totalTasks} tasks</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <DollarSign size={14} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-slate-500 font-medium">Price</p>
                      <p className="text-xs font-bold text-white">{formatAmount(platform.start_price)} - {formatAmount(platform.end_price)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Percent size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-slate-500 font-medium">Commission</p>
                      <p className="text-xs font-bold text-emerald-400">{platform.commission}%</p>
                    </div>
                  </div>
                </div>

                {hasAssignment && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium text-slate-300">{completedPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(completedPct, 100)}%` }} />
                    </div>
                  </div>
                )}

                {hasAssignment ? (
                  <Link
                    href={`/orders/${platform.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <TrendingUp size={16} /> Order Now
                  </Link>
                ) : (
                  <div className="w-full flex items-center justify-center py-3 bg-slate-800 text-slate-500 text-sm font-medium rounded-xl">
                    Not Assigned
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
