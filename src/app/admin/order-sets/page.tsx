'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, X, Layers, Edit2, Trash2, Settings, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderSet {
  id: number;
  name: string | null;
  platform_id: number | null;
  total_profit: number;
  status: number;
  platform?: { id: number; name: string } | null;
  _count?: { orders: number; orderSetAssigns: number };
}

interface Platform {
  id: number;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminOrderSetsPage() {
  const [orderSets, setOrderSets] = useState<OrderSet[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OrderSet | null>(null);
  const [form, setForm] = useState({ name: '', platform_id: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Pagination & search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [setsRes, platformsRes] = await Promise.all([
        fetch(`/api/admin/order-sets/list?page=${page}&limit=15&search=${encodeURIComponent(search)}`),
        fetch('/api/admin/order-sets/platforms'),
      ]);
      const setsData = await setsRes.json();
      const platformsData = await platformsRes.json();
      if (setsData.success) {
        setOrderSets(setsData.data);
        setPagination(setsData.pagination);
      }
      if (platformsData.success) setPlatforms(platformsData.data);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', platform_id: '' });
    setShowModal(true);
    setMsg({ type: '', text: '' });
  };

  const openEdit = (os: OrderSet) => {
    setEditing(os);
    setForm({ name: os.name || '', platform_id: String(os.platform_id || '') });
    setShowModal(true);
    setMsg({ type: '', text: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setMsg({ type: 'error', text: 'Name is required' }); return; }
    if (!form.platform_id) { setMsg({ type: 'error', text: 'Please select a platform' }); return; }

    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, name: form.name, platform_id: Number(form.platform_id) }
        : { name: form.name, platform_id: Number(form.platform_id), status: 1, total_profit: 0 };

      const res = await fetch('/api/admin/order-sets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ name: '', platform_id: '' });
        setEditing(null);
        fetchData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Something went wrong' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string | null) => {
    if (!confirm(`Delete order set "${name}"?`)) return;
    try {
      const res = await fetch('/api/admin/order-sets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.message || 'Failed to delete');
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Sets</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage order sets and assign to users</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or platform..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="px-3 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <Card>
        <CardContent className="py-0 px-0">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : orderSets.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Layers size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">{search ? 'No results found' : 'No order sets yet'}</p>
              {!search && <button onClick={openCreate} className="mt-3 text-xs text-indigo-600 hover:underline">Create your first order set</button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-gray-500">Order Set Name</th>
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-gray-500">Platform</th>
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-gray-500">Orders</th>
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-gray-500">Assigned</th>
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderSets.map((os) => (
                    <tr key={os.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-gray-900">{os.name || 'Untitled'}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">
                          <Package size={12} />
                          {os.platform?.name || 'No Platform'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">{os._count?.orders || 0}</td>
                      <td className="py-3.5 px-5 text-gray-600">{os._count?.orderSetAssigns || 0} users</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => window.location.href = `/admin/order-sets/${os.id}`} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                            <Settings size={12} /> Manage
                          </button>
                          <button onClick={() => openEdit(os)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(os.id, os.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 text-xs font-medium rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Order Set' : 'Add New Order Set'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {msg.text && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{msg.text}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter order set name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-gray-50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform *</label>
                <select
                  value={form.platform_id}
                  onChange={(e) => setForm({ ...form, platform_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-gray-50 appearance-none"
                >
                  <option value="">Select Platform...</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Order Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
