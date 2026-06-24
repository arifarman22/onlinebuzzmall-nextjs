'use client';

import { useState } from 'react';
import { CheckCircle, Clock, XCircle, History, Package } from 'lucide-react';
import { formatAmount } from '@/lib/utils';

interface Order {
  id: number; order_no: string | null; price: number; profit: number;
  balance: number; status: number; type: string | null; created_at: string;
  platformName: string; products: { name: string; image: string | null; price: number; quantity: number }[];
}

interface Props {
  orders: Order[];
}

function getImageUrl(image: string | null): string | null {
  if (!image || !image.trim()) return null;
  const img = image.trim();
  if (img.startsWith('http') || img.startsWith('/')) return img;
  return `/${img}`;
}

export default function RecordsClient({ orders }: Props) {
  const [tab, setTab] = useState<'completed' | 'incomplete' | 'all'>('completed');

  const completed = orders.filter(o => o.status === 1);
  const incomplete = orders.filter(o => o.status === 0);
  const filtered = tab === 'completed' ? completed : tab === 'incomplete' ? incomplete : orders;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Order Records</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}>
        <button
          onClick={() => setTab('completed')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === 'completed' ? '#1e293b' : 'transparent', color: tab === 'completed' ? '#34d399' : '#64748b' }}
        >
          Completed ({completed.length})
        </button>
        <button
          onClick={() => setTab('incomplete')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === 'incomplete' ? '#1e293b' : 'transparent', color: tab === 'incomplete' ? '#fbbf24' : '#64748b' }}
        >
          Incomplete ({incomplete.length})
        </button>
        <button
          onClick={() => setTab('all')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === 'all' ? '#1e293b' : 'transparent', color: tab === 'all' ? '#94a3b8' : '#64748b' }}
        >
          All ({orders.length})
        </button>
      </div>

      {/* Summary for completed */}
      {tab === 'completed' && completed.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-white">{completed.length}</p>
              <p className="text-[9px] text-slate-500">Orders</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{formatAmount(completed.reduce((s, o) => s + o.price, 0))}</p>
              <p className="text-[9px] text-slate-500">Total Amount</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-400">{formatAmount(completed.reduce((s, o) => s + o.profit, 0))}</p>
              <p className="text-[9px] text-slate-500">Total Earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 py-12 text-center">
          <History size={32} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm text-slate-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <StatusIcon status={o.status} />
                  <div>
                    <p className="text-sm font-medium text-white">#{o.order_no || o.id}</p>
                    <p className="text-[11px] text-slate-500">{o.platformName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Amount: {formatAmount(o.price)}</p>
                  {o.status === 1 && o.profit > 0 && (
                    <p className="text-sm font-bold text-emerald-400">+{formatAmount(o.profit)}</p>
                  )}
                  {o.status === 0 && (
                    <p className="text-[10px] text-amber-400 font-medium">Pending</p>
                  )}
                </div>
              </div>

              {/* Products with images */}
              {o.products.length > 0 && (
                <div className="space-y-2 mb-3">
                  {o.products.map((p, i) => {
                    const imgUrl = getImageUrl(p.image);
                    return (
                      <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-2">
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            <Package size={14} className="text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{formatAmount(p.price)} × {p.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-2 border-t border-slate-800">
                <span>{new Date(o.created_at).toLocaleDateString()}</span>
                <span>Balance: {formatAmount(o.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: number }) {
  if (status === 1) return <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center"><CheckCircle size={15} className="text-emerald-400" /></div>;
  if (status === 2) return <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center"><XCircle size={15} className="text-red-400" /></div>;
  return <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center"><Clock size={15} className="text-amber-400" /></div>;
}
