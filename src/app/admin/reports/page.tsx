'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  History, Users, Bell, LogIn, Download, Search, Filter,
  ChevronLeft, ChevronRight, X, Globe, Monitor, Smartphone,
} from 'lucide-react';

type ReportType = 'transactions' | 'commissions' | 'logins' | 'notifications';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const tabs: { key: ReportType; label: string; icon: any }[] = [
  { key: 'transactions', label: 'Transactions', icon: History },
  { key: 'commissions', label: 'Commissions', icon: Users },
  { key: 'logins', label: 'Login History', icon: LogIn },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('transactions');
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      type: activeTab,
      page: String(page),
      limit: '20',
    });
    if (search) params.set('search', search);
    if (filter) params.set('filter', filter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    const res = await fetch(`/api/admin/reports?${params}`);
    const json = await res.json();
    if (json.success) {
      setData(json.data);
      setPagination(json.pagination);
    }
    setLoading(false);
  }, [activeTab, search, filter, fromDate, toDate]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleExport = (format: string) => {
    const params = new URLSearchParams({ type: activeTab, export: format, limit: '10000' });
    if (search) params.set('search', search);
    if (filter) params.set('filter', filter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    window.open(`/api/admin/reports?${params}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); setFilter(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={activeTab === 'transactions' ? 'Username or TRX ID...' : 'Search...'}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">All</option>
                {activeTab === 'transactions' && (
                  <>
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                    <option value="order">Order</option>
                    <option value="referral_commission">Referral</option>
                    <option value="balance_transfer">Transfer</option>
                    <option value="admin_balance_adjust">Admin Adjust</option>
                  </>
                )}
                {activeTab === 'commissions' && (
                  <>
                    <option value="referral">Referral</option>
                    <option value="matching">Matching</option>
                    <option value="binary">Binary</option>
                  </>
                )}
                {activeTab === 'logins' && (
                  <>
                    <option value="Chrome">Chrome</option>
                    <option value="Firefox">Firefox</option>
                    <option value="Safari">Safari</option>
                    <option value="Edge">Edge</option>
                  </>
                )}
                {activeTab === 'notifications' && (
                  <>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                  </>
                )}
              </select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => { setSearch(''); setFilter(''); setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              Clear
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="py-0 px-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Filter size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'transactions' && <TransactionsTable data={data} onSelect={setSelectedItem} />}
              {activeTab === 'commissions' && <CommissionsTable data={data} onSelect={setSelectedItem} />}
              {activeTab === 'logins' && <LoginsTable data={data} onSelect={setSelectedItem} />}
              {activeTab === 'notifications' && <NotificationsTable data={data} onSelect={setSelectedItem} />}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm font-medium">{pagination.page}/{pagination.totalPages}</span>
                <button
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal item={selectedItem} type={activeTab} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

// ===== TABLE COMPONENTS =====

function TransactionsTable({ data, onSelect }: { data: any[]; onSelect: (item: any) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">User</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">TRX ID</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Balance</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Remark</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id} onClick={() => onSelect(t)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="py-3 px-4 font-medium">{t.user?.username || '-'}</td>
            <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.trx}</td>
            <td className={`py-3 px-4 font-semibold ${t.trx_type === '+' ? 'text-emerald-600' : 'text-red-500'}`}>
              {t.trx_type}${t.amount?.toFixed(2)}
            </td>
            <td className="py-3 px-4 text-gray-600">${t.post_balance?.toFixed(2)}</td>
            <td className="py-3 px-4">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{t.remark}</span>
            </td>
            <td className="py-3 px-4 text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CommissionsTable({ data, onSelect }: { data: any[]; onSelect: (item: any) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Sponsor</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Type</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Details</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id} onClick={() => onSelect(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="py-3 px-4 font-medium">{c.user?.username || `ID: ${c.sponsor_id}`}</td>
            <td className="py-3 px-4 font-semibold text-emerald-600">${c.amount?.toFixed(2)}</td>
            <td className="py-3 px-4">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{c.type || '-'}</span>
            </td>
            <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{c.details || '-'}</td>
            <td className="py-3 px-4 text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LoginsTable({ data, onSelect }: { data: any[]; onSelect: (item: any) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">User</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">IP Address</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Location</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Browser</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">OS</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map((l) => (
          <tr key={l.id} onClick={() => onSelect(l)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="py-3 px-4 font-medium">{l.user?.username || '-'}</td>
            <td className="py-3 px-4 font-mono text-xs text-gray-500">{l.user_ip || '-'}</td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-1.5">
                <Globe size={13} className="text-gray-400" />
                <span className="text-gray-600">{l.country || '-'}{l.city ? `, ${l.city}` : ''}</span>
              </div>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-1.5">
                <Monitor size={13} className="text-gray-400" />
                <span>{l.browser || '-'}</span>
              </div>
            </td>
            <td className="py-3 px-4 text-gray-600">{l.os || '-'}</td>
            <td className="py-3 px-4 text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NotificationsTable({ data, onSelect }: { data: any[]; onSelect: (item: any) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Title</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Type</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">User ID</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Status</th>
          <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Sent</th>
        </tr>
      </thead>
      <tbody>
        {data.map((n) => (
          <tr key={n.id} onClick={() => onSelect(n)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
            <td className="py-3 px-4 font-medium max-w-[200px] truncate">{n.title || '-'}</td>
            <td className="py-3 px-4">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{n.type || '-'}</span>
            </td>
            <td className="py-3 px-4 text-gray-600">{n.user_id || '-'}</td>
            <td className="py-3 px-4">
              {n.is_read ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">Read</span>
              ) : (
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">Unread</span>
              )}
            </td>
            <td className="py-3 px-4 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ===== DETAIL MODAL =====

function DetailModal({ item, type, onClose }: { item: any; type: ReportType; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'transactions' && 'Transaction Details'}
            {type === 'commissions' && 'Commission Details'}
            {type === 'logins' && 'Login Details'}
            {type === 'notifications' && 'Notification Details'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {type === 'transactions' && (
            <>
              <DetailRow label="ID" value={item.id} />
              <DetailRow label="Username" value={item.user?.username} />
              <DetailRow label="Email" value={item.user?.email} />
              <DetailRow label="Transaction ID" value={item.trx} mono />
              <DetailRow label="Amount" value={`${item.trx_type}$${item.amount?.toFixed(2)}`} highlight={item.trx_type === '+' ? 'green' : 'red'} />
              <DetailRow label="Charge" value={`$${item.charge?.toFixed(2)}`} />
              <DetailRow label="Post Balance" value={`$${item.post_balance?.toFixed(2)}`} />
              <DetailRow label="Type" value={item.trx_type === '+' ? 'Credit' : 'Debit'} />
              <DetailRow label="Remark" value={item.remark} />
              <DetailRow label="Details" value={item.details} />
              <DetailRow label="Date" value={new Date(item.created_at).toLocaleString()} />
            </>
          )}
          {type === 'commissions' && (
            <>
              <DetailRow label="ID" value={item.id} />
              <DetailRow label="Sponsor" value={item.user?.username || `ID: ${item.sponsor_id}`} />
              <DetailRow label="User ID" value={item.user_id} />
              <DetailRow label="Amount" value={`$${item.amount?.toFixed(2)}`} highlight="green" />
              <DetailRow label="Type" value={item.type} />
              <DetailRow label="Details" value={item.details} />
              <DetailRow label="Date" value={new Date(item.created_at).toLocaleString()} />
            </>
          )}
          {type === 'logins' && (
            <>
              <DetailRow label="ID" value={item.id} />
              <DetailRow label="Username" value={item.user?.username} />
              <DetailRow label="Email" value={item.user?.email} />
              <DetailRow label="IP Address" value={item.user_ip} mono />
              <DetailRow label="Country" value={item.country} />
              <DetailRow label="Country Code" value={item.country_code} />
              <DetailRow label="City" value={item.city} />
              <DetailRow label="Region" value={item.region} />
              <DetailRow label="ISP" value={item.isp} />
              <DetailRow label="Latitude" value={item.latitude} />
              <DetailRow label="Longitude" value={item.longitude} />
              <DetailRow label="Browser" value={item.browser} />
              <DetailRow label="Operating System" value={item.os} />
              <DetailRow label="Device Type" value={item.device_type} />
              <DetailRow label="Date" value={new Date(item.created_at).toLocaleString()} />
            </>
          )}
          {type === 'notifications' && (
            <>
              <DetailRow label="ID" value={item.id} />
              <DetailRow label="User ID" value={item.user_id} />
              <DetailRow label="Title" value={item.title} />
              <DetailRow label="Message" value={item.message} />
              <DetailRow label="Type" value={item.type} />
              <DetailRow label="Status" value={item.is_read ? 'Read' : 'Unread'} />
              <DetailRow label="Read At" value={item.read_at ? new Date(item.read_at).toLocaleString() : '-'} />
              <DetailRow label="Sent At" value={new Date(item.created_at).toLocaleString()} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: any; mono?: boolean; highlight?: 'green' | 'red' }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[60%] break-words ${
        mono ? 'font-mono text-xs' : ''
      } ${
        highlight === 'green' ? 'text-emerald-600' : highlight === 'red' ? 'text-red-500' : 'text-gray-900'
      }`}>
        {value || '-'}
      </span>
    </div>
  );
}
