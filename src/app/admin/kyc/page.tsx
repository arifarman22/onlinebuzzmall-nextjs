'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, CheckCircle, Clock, XCircle, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function AdminKycPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filter) params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/kyc?${params}`);
    const json = await res.json();
    if (json.success) {
      setData(json.data);
      setStats(json.stats);
      setPagination(json.pagination);
    }
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleAction = async (action: string) => {
    if (!selected) return;
    setActionLoading(true);
    await fetch('/api/admin/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selected.id, action, reason: rejectReason }),
    });
    setActionLoading(false);
    setSelected(null);
    setRejectReason('');
    fetchData(pagination.page);
  };

  const kycStatusLabel = (kv: number) => {
    if (kv === 1) return { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' };
    if (kv === 2) return { label: 'Pending', color: 'bg-amber-100 text-amber-700' };
    if (kv === 3) return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
    return { label: 'None', color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">KYC Management</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-gray-900">{stats.pending}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle size={20} className="text-emerald-600" /></div>
            <div><p className="text-xs text-gray-500">Approved</p><p className="text-xl font-bold text-gray-900">{stats.approved}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><XCircle size={20} className="text-red-600" /></div>
            <div><p className="text-xs text-gray-500">Rejected</p><p className="text-xl font-bold text-gray-900">{stats.rejected}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[{ key: '', label: 'All' }, { key: '2', label: 'Pending' }, { key: '1', label: 'Approved' }, { key: '3', label: 'Rejected' }].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username or email..." className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="py-0 px-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Shield size={28} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No KYC submissions found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ID Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Submitted</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>
                  {data.map((u) => {
                    const kyc = u.kyc_data as any;
                    const s = kycStatusLabel(u.kv);
                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{u.firstname} {u.lastname}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </td>
                        <td className="py-3 px-4"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.color}`}>{s.label}</span></td>
                        <td className="py-3 px-4 text-gray-600 capitalize">{kyc?.id_type?.replace(/_/g, ' ') || '-'}</td>
                        <td className="py-3 px-4 text-xs text-gray-400">{kyc?.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => setSelected(u)} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"><Eye size={13} /> View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Page {pagination.page}/{pagination.totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => fetchData(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 border rounded disabled:opacity-30"><ChevronLeft size={14} /></button>
                <button onClick={() => fetchData(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-1.5 border rounded disabled:opacity-30"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail/Action Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">KYC Details — @{selected.username}</h3>
            </div>
            <div className="p-5 space-y-3">
              {selected.kyc_data && Object.entries(selected.kyc_data as Record<string, any>).filter(([k]) => !k.startsWith('rejected') && k !== 'submitted_at').map(([key, val]) => {
                const isImage = typeof val === 'string' && (val.startsWith('/uploads/') || val.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                const isFile = typeof val === 'string' && val.startsWith('/uploads/');
                return (
                  <div key={key} className="border-b border-gray-50 pb-3">
                    <p className="text-xs text-gray-500 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                    {isImage ? (
                      <a href={String(val)} target="_blank" rel="noopener noreferrer">
                        <img src={String(val)} alt={key} className="max-w-[250px] max-h-[200px] rounded-lg border border-gray-200 hover:opacity-90" />
                      </a>
                    ) : isFile ? (
                      <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline font-medium">View File →</a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{String(val)}</p>
                    )}
                  </div>
                );
              })}
              {(selected.kyc_data as any)?.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <p className="font-medium">Previous Rejection Reason:</p>
                  <p className="text-xs mt-1">{(selected.kyc_data as any).rejection_reason}</p>
                </div>
              )}

              {selected.kv === 2 && (
                <div className="pt-4 space-y-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button onClick={() => handleAction('approve')} disabled={actionLoading} className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                      Approve
                    </button>
                    <button onClick={() => document.getElementById('reject-section')?.classList.toggle('hidden')} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
                      Reject
                    </button>
                  </div>
                  <div id="reject-section" className="hidden space-y-2">
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none" rows={3} />
                    <button onClick={() => handleAction('reject')} disabled={actionLoading} className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
