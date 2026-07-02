'use client';

import { useState } from 'react';
import { CheckCircle, Clock, XCircle, History, Package, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatAmount } from '@/lib/utils';

interface Order {
  id: number; order_no: string | null; price: number; profit: number;
  balance: number; status: number; type: string | null; created_at: string;
  platformName: string; products: { name: string; image: string | null; price: number; quantity: number }[];
}

interface Txn {
  id: number; trx: string | null; amount: number; trx_type: string | null;
  remark: string | null; balance: number; created_at: string;
}

interface Props {
  orders: Order[];
  transactions: Txn[];
}

function getImageUrl(image: string | null): string | null {
  if (!image || !image.trim()) return null;
  const img = image.trim();
  if (img.startsWith('http') || img.startsWith('/')) return img;
  return `/${img}`;
}

const PAGE_SIZE = 25;

export default function RecordsClient({ orders, transactions }: Props) {
  const [tab, setTab] = useState<'completed' | 'incomplete' | 'transactions'>('completed');
  const [page, setPage] = useState(1);

  const completed = orders.filter(o => o.status === 1);
  const incomplete = orders.filter(o => o.status === 0);

  const allItems = tab === 'completed' ? completed : tab === 'incomplete' ? incomplete : transactions;
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
  const paginated = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeTab = (t: typeof tab) => { setTab(t); setPage(1); };

  const tabs = [
    { key: 'completed', label: 'Completed', count: completed.length, color: '#34d399' },
    { key: 'incomplete', label: 'Incomplete', count: incomplete.length, color: '#fbbf24' },
    { key: 'transactions', label: 'Transactions', count: transactions.length, color: '#818cf8' },
  ] as const;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Order Records</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.key ? '#1e293b' : 'transparent', color: tab === t.key ? t.color : '#64748b' }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Completed summary */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors"
          >← Prev</button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors"
          >Next →</button>
        </div>
      )}

      {/* Orders List */}
      {tab !== 'transactions' && (
        (() => {
          const filtered = paginated as Order[];
          return filtered.length === 0 ? (
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
                      {o.status === 1 && o.profit > 0 && <p className="text-sm font-bold text-emerald-400">+{formatAmount(o.profit)}</p>}
                      {o.status === 0 && <p className="text-[10px] text-amber-400 font-medium">Pending</p>}
                    </div>
                  </div>
                  {o.products.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {o.products.map((p, i) => {
                        const imgUrl = getImageUrl(p.image);
                        return (
                          <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-2">
                            {imgUrl ? <img src={imgUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center"><Package size={14} className="text-slate-500" /></div>}
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
          );
        })()
      )}

      {/* Transactions List */}
      {tab === 'transactions' && (
        paginated.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 py-12 text-center">
            <History size={32} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(paginated as Txn[]).map((t) => {
              const isCredit = t.trx_type === '+';
              return (
                <div key={t.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {isCredit ? <ArrowDownLeft size={15} className="text-emerald-400" /> : <ArrowUpRight size={15} className="text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{t.remark || 'Transaction'}</p>
                        <p className="text-[10px] text-slate-500">{t.trx || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}{formatAmount(Math.abs(t.amount))}
                      </p>
                      <p className="text-[10px] text-slate-500">Bal: {formatAmount(t.balance)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-800">{new Date(t.created_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: number }) {
  if (status === 1) return <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center"><CheckCircle size={15} className="text-emerald-400" /></div>;
  if (status === 2) return <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center"><XCircle size={15} className="text-red-400" /></div>;
  return <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center"><Clock size={15} className="text-amber-400" /></div>;
}
