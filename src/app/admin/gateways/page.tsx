'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, Plus, Trash2, Edit2, X, CreditCard, CheckCircle, XCircle, Settings, Save } from 'lucide-react';

interface GatewayField { id: number; label: string; field_name: string; placeholder: string | null; type: string; options: any; required: number; sort_order: number; status: number; }
interface Gateway { id: number; name: string; currency: string | null; country: string | null; exchange_rate: number; min_amount: number; max_amount: number; fixed_charge: number; percent_charge: number; instructions: string | null; qr_code: string | null; wallet_address: string | null; logo: string | null; category: string | null; status: number; show_qr: number; show_wallet: number; show_copy_btn: number; show_charge: number; show_instructions: number; show_proof: number; proof_types: string | null; proof_max_size: number; fields: GatewayField[]; _count: { fields: number }; }

const EMPTY_FORM = { name: '', currency: 'USD', country: '', exchange_rate: 1, min_amount: 10, max_amount: 100000, fixed_charge: 0, percent_charge: 0, instructions: '', qr_code: '', wallet_address: '', logo: '', category: '', status: 1, show_qr: 1, show_wallet: 1, show_copy_btn: 1, show_charge: 0, show_instructions: 1, show_proof: 1, proof_types: 'jpg,png,webp', proof_max_size: 5 };

export default function AdminGatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Gateway | null>(null);
  const [showFields, setShowFields] = useState<Gateway | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [fieldForm, setFieldForm] = useState({ label: '', field_name: '', placeholder: '', type: 'text', required: 1, options: '' });
  const [fieldSaving, setFieldSaving] = useState(false);

  const showMessage = (type: string, text: string) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 5000); };

  const fetchGateways = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/gateways?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setGateways(json.data);
    } catch {} 
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchGateways(); }, [fetchGateways]);

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'gateway');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) return data.data.path;
    throw new Error(data.message || 'Upload failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showMessage('error', 'Gateway name is required'); return; }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { id: editing.id, ...form } : form;
      const res = await fetch('/api/admin/gateways', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Save failed'); }
      const data = await res.json();
      if (data.success) { showMessage('success', data.message); setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM }); fetchGateways(); }
      else { showMessage('error', data.message); }
    } catch (err: any) { showMessage('error', err.message || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    try {
      const res = await fetch('/api/admin/gateways', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) { showMessage('success', data.message); fetchGateways(); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Delete failed'); }
  };

  const handleEdit = (gw: Gateway) => {
    setEditing(gw);
    setForm({ name: gw.name, currency: gw.currency || 'USD', country: gw.country || '', exchange_rate: gw.exchange_rate, min_amount: gw.min_amount, max_amount: gw.max_amount, fixed_charge: gw.fixed_charge, percent_charge: gw.percent_charge, instructions: gw.instructions || '', qr_code: gw.qr_code || '', wallet_address: gw.wallet_address || '', logo: gw.logo || '', category: gw.category || '', status: gw.status, show_qr: gw.show_qr ?? 1, show_wallet: gw.show_wallet ?? 1, show_copy_btn: gw.show_copy_btn ?? 1, show_charge: gw.show_charge ?? 0, show_instructions: gw.show_instructions ?? 1, show_proof: gw.show_proof ?? 1, proof_types: gw.proof_types || 'jpg,png,webp', proof_max_size: gw.proof_max_size ?? 5 });
    setShowForm(true);
    setShowFields(null);
  };

  const handleToggleStatus = async (gw: Gateway) => {
    try {
      await fetch('/api/admin/gateways', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: gw.id, status: gw.status === 1 ? 0 : 1 }) });
      fetchGateways();
    } catch {}
  };

  // Fields
  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFields || !fieldForm.label || !fieldForm.field_name) return;
    setFieldSaving(true);
    try {
      const res = await fetch('/api/admin/gateways/fields', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gateway_id: showFields.id, ...fieldForm, options: fieldForm.options ? fieldForm.options.split(',').map((o: string) => o.trim()).filter(Boolean) : null }) });
      const data = await res.json();
      if (data.success) { setFieldForm({ label: '', field_name: '', placeholder: '', type: 'text', required: 1, options: '' }); fetchGateways(); showMessage('success', 'Field added'); }
      else showMessage('error', data.message);
    } catch { showMessage('error', 'Failed to add field'); }
    setFieldSaving(false);
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm('Delete this field?')) return;
    await fetch('/api/admin/gateways/fields', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fieldId }) });
    fetchGateways();
    if (showFields) setShowFields({ ...showFields, fields: showFields.fields.filter((f) => f.id !== fieldId) });
  };

  // Keep showFields in sync
  useEffect(() => {
    if (showFields) {
      const updated = gateways.find((g) => g.id === showFields.id);
      if (updated) setShowFields(updated);
    }
  }, [gateways, showFields]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Payment Gateways</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY_FORM }); setShowFields(null); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"><Plus size={16} /> Add Gateway</button>
      </div>

      {msg.text && <div className={`p-3 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gateways..." className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? `Edit: ${editing.name}` : 'Create Gateway'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Gateway Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
                <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                <Field label="Exchange Rate" type="number" value={form.exchange_rate} onChange={(v) => setForm({ ...form, exchange_rate: Number(v) })} />
                <Field label="Min Amount" type="number" value={form.min_amount} onChange={(v) => setForm({ ...form, min_amount: Number(v) })} />
                <Field label="Max Amount" type="number" value={form.max_amount} onChange={(v) => setForm({ ...form, max_amount: Number(v) })} />
                <Field label="Fixed Charge" type="number" value={form.fixed_charge} onChange={(v) => setForm({ ...form, fixed_charge: Number(v) })} />
                <Field label="Percent Charge (%)" type="number" value={form.percent_charge} onChange={(v) => setForm({ ...form, percent_charge: Number(v) })} />
                <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Crypto, Bank" />
                <Field label="Wallet Address" value={form.wallet_address} onChange={(v) => setForm({ ...form, wallet_address: v })} />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">QR Code</label>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { const path = await uploadFile(f); setForm((prev) => ({ ...prev, qr_code: path })); showMessage('success', 'QR uploaded'); } catch (err: any) { showMessage('error', err.message || 'QR upload failed'); } } }} className="w-full text-xs file:mr-2 file:px-3 file:py-1.5 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:rounded file:font-medium" />
                  {form.qr_code && <img src={form.qr_code} alt="QR" className="mt-1 w-14 h-14 rounded border" />}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Logo</label>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { const path = await uploadFile(f); setForm((prev) => ({ ...prev, logo: path })); showMessage('success', 'Logo uploaded'); } catch (err: any) { showMessage('error', err.message || 'Logo upload failed'); } } }} className="w-full text-xs file:mr-2 file:px-3 file:py-1.5 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:rounded file:font-medium" />
                  {form.logo && <img src={form.logo} alt="Logo" className="mt-1 w-10 h-10 rounded border" />}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deposit Instructions</label>
                <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y" />
              </div>

              {/* Toggles */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">User Visibility Controls</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'show_qr', label: 'QR Code' },
                    { key: 'show_wallet', label: 'Wallet Address' },
                    { key: 'show_copy_btn', label: 'Copy Button' },
                    { key: 'show_charge', label: 'Show Charges' },
                    { key: 'show_instructions', label: 'Instructions' },
                    { key: 'show_proof', label: 'Proof Upload' },
                  ].map((t) => (
                    <label key={t.key} className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={(form as any)[t.key] === 1} onChange={(e) => setForm({ ...form, [t.key]: e.target.checked ? 1 : 0 })} className="rounded text-indigo-600" />
                      <span className="text-xs text-gray-700">{t.label}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="Proof File Types" value={form.proof_types} onChange={(v) => setForm({ ...form, proof_types: v })} placeholder="jpg,png,webp" />
                  <Field label="Max Size (MB)" type="number" value={form.proof_max_size} onChange={(v) => setForm({ ...form, proof_max_size: Number(v) })} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value={1}>Active</option><option value={0}>Disabled</option>
                </select>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Gateway'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Fields Manager */}
      {showFields && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Custom Fields — {showFields.name}</h3>
              <button onClick={() => setShowFields(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            {showFields.fields.length > 0 && (
              <div className="space-y-2 mb-4">
                {showFields.fields.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-400">{f.field_name} · {f.type} · {f.required ? 'Required' : 'Optional'}</p>
                    </div>
                    <button onClick={() => handleDeleteField(f.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddField} className="border-t pt-4 space-y-3">
              <p className="text-xs font-medium text-gray-600">Add Field</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value, field_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="Label *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                <input type="text" value={fieldForm.field_name} onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })} placeholder="field_name *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                <select value={fieldForm.type} onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="text">Text</option><option value="number">Number</option><option value="file">File Upload</option><option value="textarea">Textarea</option><option value="select">Select</option>
                </select>
                <select value={fieldForm.required} onChange={(e) => setFieldForm({ ...fieldForm, required: Number(e.target.value) })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value={1}>Required</option><option value={0}>Optional</option>
                </select>
              </div>
              {fieldForm.type === 'select' && <input type="text" value={fieldForm.options} onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })} placeholder="Options: Option1, Option2, Option3" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />}
              <button type="submit" disabled={fieldSaving} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">{fieldSaving ? 'Adding...' : 'Add Field'}</button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="py-0 px-0">
          {loading ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div> : gateways.length === 0 ? <div className="text-center py-12 text-gray-400"><CreditCard size={28} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No gateways</p></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Gateway</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Currency</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Limits</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Fields</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Action</th>
                </tr></thead>
                <tbody>
                  {gateways.map((gw) => (
                    <tr key={gw.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {gw.logo && <img src={gw.logo} alt="" className="w-7 h-7 rounded" />}
                          <div><p className="font-medium text-gray-900">{gw.name}</p><p className="text-xs text-gray-400">{gw.country || 'Global'}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{gw.currency}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">${gw.min_amount} - ${gw.max_amount}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded">{gw._count.fields}</span></td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleStatus(gw)}>
                          {gw.status === 1 ? <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle size={12} />Active</span> : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle size={12} />Off</span>}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => { setShowFields(gw); setShowForm(false); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Fields"><Settings size={14} /></button>
                          <button onClick={() => handleEdit(gw)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(gw.id, gw.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
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

function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
    </div>
  );
}
