'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, Edit2, X, Package, Upload, Search, Star, Crown } from 'lucide-react';

interface Platform {
  id: number; name: string; slug: string | null; image: string | null; description: string | null;
  commission: number; currency: string; start_price: number; end_price: number; vip_level: number;
  max_orders_per_day: number; min_orders: number; show_on_dashboard: number; allow_orders: number;
  featured: number; auto_approval: number; status: number; created_at: string;
  _count?: { products: number };
}

const EMPTY = { name: '', slug: '', image: '', description: '', commission: '4', currency: 'USDT', start_price: '20', end_price: '499', vip_level: 1, max_orders_per_day: '40', min_orders: '', show_on_dashboard: 1, allow_orders: 1, featured: 0, auto_approval: 0, status: 1 };

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMessage = (type: string, text: string) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (vipFilter) params.set('vip', vipFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/platforms/list?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success) setPlatforms(data.data);
    } catch {}
    setLoading(false);
  }, [search, vipFilter, statusFilter]);

  useEffect(() => { fetchPlatforms(); }, [fetchPlatforms]);

  const handleUpload = async (file: File): Promise<string> => {
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'gateway');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.success ? data.data.path : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showMessage('error', 'Name required'); return; }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const payload = { ...form, commission: form.commission === '' ? 0 : Number(form.commission), start_price: form.start_price === '' ? 0 : Number(form.start_price), end_price: form.end_price === '' ? 0 : Number(form.end_price), max_orders_per_day: form.max_orders_per_day === '' ? 0 : Number(form.max_orders_per_day), min_orders: form.min_orders === '' ? 0 : Number(form.min_orders) };
      const body = editing ? { id: editing.id, ...payload } : payload;
      const res = await fetch('/api/admin/platforms', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { showMessage('success', data.message); setShowForm(false); setEditing(null); setForm({ ...EMPTY }); fetchPlatforms(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  const handleEdit = (p: Platform) => {
    setEditing(p);
    setForm({ name: p.name, slug: p.slug || '', image: p.image || '', description: p.description || '', commission: String(p.commission), currency: p.currency, start_price: String(p.start_price), end_price: String(p.end_price), vip_level: p.vip_level, max_orders_per_day: String(p.max_orders_per_day), min_orders: String(p.min_orders || ''), show_on_dashboard: p.show_on_dashboard, allow_orders: p.allow_orders, featured: p.featured, auto_approval: p.auto_approval, status: p.status });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this platform?')) return;
    await fetch('/api/admin/platforms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchPlatforms();
  };

  const handleToggleStatus = async (platform: Platform) => {
    const newStatus = platform.status === 1 ? 0 : 1;
    try {
      const res = await fetch('/api/admin/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: platform.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlatforms(prev => prev.map(p => p.id === platform.id ? { ...p, status: newStatus } : p));
      } else {
        showMessage('error', data.message);
      }
    } catch {
      showMessage('error', 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Platforms</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY }); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700"><Plus size={16} /> Add Platform</button>
      </div>

      {msg.text && <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={vipFilter} onChange={(e) => setVipFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All VIP</option><option value="1">VIP 1</option><option value="2">VIP 2</option><option value="3">VIP 3</option><option value="4">VIP 4</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Status</option><option value="1">Active</option><option value="0">Inactive</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editing ? 'Edit Platform' : 'Add Platform'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Slug</label><input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500" /></div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Logo</label>
                  <div className="flex items-center gap-2">
                    {form.image && <img src={form.image} alt="" className="w-9 h-9 rounded-lg border object-cover" />}
                    <label className="flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-indigo-100">
                      <Upload size={12} /> {form.image ? 'Replace' : 'Upload'}
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const p = await handleUpload(f); if (p) setForm((prev) => ({ ...prev, image: p })); } }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Commission %</label><input type="number" step="0.1" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Currency</label><input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Start Price</label><input type="number" step="0.01" value={form.start_price} onChange={(e) => setForm({ ...form, start_price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">End Price</label><input type="number" step="0.01" value={form.end_price} onChange={(e) => setForm({ ...form, end_price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              </div>

              {/* VIP + Orders */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">VIP Level</label><select value={form.vip_level} onChange={(e) => setForm({ ...form, vip_level: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value={1}>VIP 1</option><option value={2}>VIP 2</option><option value={3}>VIP 3</option><option value={4}>VIP 4</option></select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Max Orders/Day</label><input type="number" value={form.max_orders_per_day} onChange={(e) => setForm({ ...form, max_orders_per_day: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Min Orders</label><input type="number" value={form.min_orders} onChange={(e) => setForm({ ...form, min_orders: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value={1}>Active</option><option value={0}>Inactive</option></select></div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'show_on_dashboard', label: 'Show on Dashboard' },
                  { key: 'allow_orders', label: 'Allow Orders' },
                  { key: 'featured', label: 'Featured' },
                  { key: 'auto_approval', label: 'Auto Approval' },
                ].map((t) => (
                  <label key={t.key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input type="checkbox" checked={(form as any)[t.key] === 1} onChange={(e) => setForm({ ...form, [t.key]: e.target.checked ? 1 : 0 })} className="rounded text-indigo-600" />
                    <span className="text-xs text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>

              <div><label className="block text-xs text-gray-500 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y" /></div>

              <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Platform'}</button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="py-0 px-0">
          {loading ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div> : platforms.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Package size={28} className="mx-auto mb-2" /><p className="text-sm">No platforms</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Platform</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Commission</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Price Range</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">VIP</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Products</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Action</th>
                </tr></thead>
                <tbody>
                  {platforms.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.image ? <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover border" /> : <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center"><Package size={16} className="text-indigo-600" /></div>}
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.currency}{p.featured ? ' · ⭐ Featured' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{p.commission}%</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{p.start_price} – {p.end_price} {p.currency}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium"><Crown size={10} className="inline mr-0.5" />VIP {p.vip_level}</span></td>
                      <td className="py-3 px-4 text-gray-600">{p._count?.products || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.status === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${p.status === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
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
    </div>
  );
}
