'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Edit2, Trash2, X, CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface Method {
  id: number; name: string; currency: string | null; min_limit: number; max_limit: number;
  fixed_charge: number; percent_charge: number; rate: number; description: string | null;
  user_data: any; status: number;
}

const EMPTY_FORM = { name: '', currency: 'USDT', min_limit: '', max_limit: '', fixed_charge: '', percent_charge: '', rate: '1', description: '', user_data: '', status: 1 };

export default function WithdrawalMethodsManager() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Method | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMessage = (type: string, text: string) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals/methods');
      const data = await res.json();
      if (data.success) setMethods(data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (m: Method) => {
    setEditing(m);
    setForm({
      name: m.name,
      currency: m.currency || 'USDT',
      min_limit: String(m.min_limit || ''),
      max_limit: String(m.max_limit || ''),
      fixed_charge: String(m.fixed_charge || ''),
      percent_charge: String(m.percent_charge || ''),
      rate: String(m.rate || '1'),
      description: m.description || '',
      user_data: m.user_data ? JSON.stringify(m.user_data) : '',
      status: m.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showMessage('error', 'Name is required'); return; }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const payload: any = {
        name: form.name,
        currency: form.currency,
        min_limit: form.min_limit === '' ? 0 : Number(form.min_limit),
        max_limit: form.max_limit === '' ? 0 : Number(form.max_limit),
        fixed_charge: form.fixed_charge === '' ? 0 : Number(form.fixed_charge),
        percent_charge: form.percent_charge === '' ? 0 : Number(form.percent_charge),
        rate: form.rate === '' ? 1 : Number(form.rate),
        description: form.description,
        status: form.status,
      };
      if (form.user_data.trim()) {
        try { payload.user_data = JSON.parse(form.user_data); } catch { payload.user_data = null; }
      }
      if (editing) payload.id = editing.id;

      const res = await fetch('/api/admin/withdrawals/methods', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { showMessage('success', data.message); setShowForm(false); setEditing(null); fetchMethods(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete withdrawal method "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/withdrawals/methods', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) { showMessage('success', 'Method deleted'); fetchMethods(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed to delete'); }
  };

  const handleToggleStatus = async (m: Method) => {
    const newStatus = m.status === 1 ? 0 : 1;
    await fetch('/api/admin/withdrawals/methods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, status: newStatus }) });
    fetchMethods();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Withdrawal Methods</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={16} /> Add Method
        </button>
      </div>

      {msg.text && <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Method' : 'Add New Method'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Method Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. USDT (TRC20)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Currency</label>
                  <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="e.g. USDT" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value={1}>Active</option>
                    <option value={0}>Disabled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Limit</label>
                  <input type="number" step="0.01" value={form.min_limit} onChange={(e) => setForm({ ...form, min_limit: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Limit</label>
                  <input type="number" step="0.01" value={form.max_limit} onChange={(e) => setForm({ ...form, max_limit: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fixed Charge</label>
                  <input type="number" step="0.01" value={form.fixed_charge} onChange={(e) => setForm({ ...form, fixed_charge: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Percent Charge (%)</label>
                  <input type="number" step="0.01" value={form.percent_charge} onChange={(e) => setForm({ ...form, percent_charge: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Exchange Rate</label>
                  <input type="number" step="0.0001" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">User Required Fields</label>
                <p className="text-[10px] text-gray-400 mb-2">Fields users must fill when withdrawing (e.g. wallet address, network)</p>
                <UserFieldsBuilder value={form.user_data} onChange={(val) => setForm({ ...form, user_data: val })} />
              </div>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Method'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Methods Table */}
      <Card>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : methods.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CreditCard size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No withdrawal methods yet</p>
              <button onClick={openAdd} className="mt-3 text-xs text-indigo-600 hover:underline">Add your first method</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Currency</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Limits</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Charges</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rate</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{m.name}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{m.currency || '-'}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <span>${m.min_limit}</span> – <span>${m.max_limit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {m.fixed_charge > 0 && <span>${m.fixed_charge} + </span>}
                        <span>{m.percent_charge}%</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">{m.rate}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleStatus(m)} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${m.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {m.status === 1 ? <><CheckCircle size={10} /> Active</> : <><XCircle size={10} /> Disabled</>}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(m)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(m.id, m.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={13} /></button>
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

/* ===== USER FIELDS BUILDER ===== */
function UserFieldsBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Parse existing JSON string into field array
  const parseFields = (val: string): { name: string; type: string; options: string }[] => {
    try {
      const parsed = JSON.parse(val || '{}');
      return Object.entries(parsed).map(([name, type]) => {
        const typeStr = String(type);
        if (typeStr.startsWith('select:')) {
          return { name, type: 'select', options: typeStr.replace('select:', '') };
        }
        return { name, type: typeStr, options: '' };
      });
    } catch { return []; }
  };

  const [fields, setFields] = useState(parseFields(value));

  const syncToParent = (newFields: typeof fields) => {
    const obj: Record<string, string> = {};
    newFields.forEach((f) => {
      if (f.name.trim()) {
        obj[f.name.trim()] = f.type === 'select' && f.options ? `select:${f.options}` : f.type;
      }
    });
    onChange(Object.keys(obj).length > 0 ? JSON.stringify(obj) : '');
  };

  const addField = () => {
    const newFields = [...fields, { name: '', type: 'text', options: '' }];
    setFields(newFields);
  };

  const removeField = (idx: number) => {
    const newFields = fields.filter((_, i) => i !== idx);
    setFields(newFields);
    syncToParent(newFields);
  };

  const changeField = (idx: number, key: string, val: string) => {
    const newFields = [...fields];
    (newFields[idx] as any)[key] = val;
    setFields(newFields);
    syncToParent(newFields);
  };

  return (
    <div className="space-y-2">
      {fields.map((f, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={f.name}
            onChange={(e) => changeField(idx, 'name', e.target.value)}
            placeholder="Field name (e.g. wallet_address)"
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
          />
          <select
            value={f.type}
            onChange={(e) => changeField(idx, 'type', e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="select">Dropdown</option>
          </select>
          {f.type === 'select' && (
            <input
              type="text"
              value={f.options}
              onChange={(e) => changeField(idx, 'options', e.target.value)}
              placeholder="opt1,opt2,opt3"
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
            />
          )}
          <button type="button" onClick={() => removeField(idx)} className="p-1 text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addField} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
        <Plus size={12} /> Add Field
      </button>
    </div>
  );
}
