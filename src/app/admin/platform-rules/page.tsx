'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Image as ImageIcon, X, Bold, Italic, List, AlertTriangle, Quote, Heading2 } from 'lucide-react';

interface Rule {
  id: number;
  title: string | null;
  description: string | null;
  content: string | null;
  image: string | null;
  sort_order: number;
  status: number;
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value;
      initialized.current = true;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-gray-200 rounded" title="Bold"><Bold size={14} /></button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-gray-200 rounded" title="Italic"><Italic size={14} /></button>
        <button type="button" onClick={() => exec('formatBlock', '<h2>')} className="p-1.5 hover:bg-gray-200 rounded" title="Heading"><Heading2 size={14} /></button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded" title="Bullet List"><List size={14} /></button>
        <button type="button" onClick={() => exec('formatBlock', '<blockquote>')} className="p-1.5 hover:bg-gray-200 rounded" title="Quote"><Quote size={14} /></button>
        <button type="button" onClick={() => { if (editorRef.current) { const html = editorRef.current.innerHTML; const newHtml = html + '<div class="warning" data-warning>⚠️ Warning text here</div>'; editorRef.current.innerHTML = newHtml; onChange(newHtml); } }} className="p-1.5 hover:bg-gray-200 rounded text-amber-600" title="Warning Box"><AlertTriangle size={14} /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 text-sm focus:outline-none prose prose-sm max-w-none"
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
      />
    </div>
  );
}

export default function AdminPlatformRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState({ title: '', description: '', content: '', image: '', sort_order: 0, status: 1 });
  const [uploading, setUploading] = useState(false);

  const fetchRules = async () => {
    const res = await fetch('/api/admin/platform-rules');
    const data = await res.json();
    if (data.success) setRules(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', content: '', image: '', sort_order: rules.length + 1, status: 1 });
    setShowForm(true);
  };

  const openEdit = (rule: Rule) => {
    setEditing(rule);
    setForm({ title: rule.title || '', description: rule.description || '', content: rule.content || '', image: rule.image || '', sort_order: rule.sort_order, status: rule.status });
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'platform-rules');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) setForm((f) => ({ ...f, image: data.data.path }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, id: editing.id } : form;
    await fetch('/api/admin/platform-rules', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowForm(false);
    fetchRules();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this rule?')) return;
    await fetch(`/api/admin/platform-rules?id=${id}`, { method: 'DELETE' });
    fetchRules();
  };

  const toggleStatus = async (rule: Rule) => {
    await fetch('/api/admin/platform-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, status: rule.status === 1 ? 0 : 1 }),
    });
    fetchRules();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Rules</h1>
          <p className="text-sm text-gray-500 mt-1">Manage dashboard guidance cards & detailed content</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No platform rules yet. Click &quot;Add Rule&quot; to create one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Image</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Content</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400"><GripVertical size={14} /></td>
                  <td className="px-4 py-3">
                    {rule.image ? (
                      <img src={rule.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{rule.title}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{rule.description}</td>
                  <td className="px-4 py-3">
                    {rule.content ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Has content</span> : <span className="text-xs text-gray-400">Empty</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{rule.sort_order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(rule)} className={`px-2 py-1 rounded-full text-xs font-medium ${rule.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rule.status === 1 ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(rule)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Rule' : 'Add Rule'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (shown on card)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Details Content (shown in detail view)</label>
                <RichEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} />
                <p className="text-xs text-gray-400 mt-1">Use toolbar for formatting. Add paragraphs, lists, warnings, and highlighted notices.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image / Icon</label>
                {form.image && <img src={form.image} alt="" className="w-16 h-16 rounded-lg object-cover mb-2" />}
                <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={handleUpload} className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                {uploading && <p className="text-xs text-indigo-600 mt-1">Uploading...</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                {editing ? 'Update Rule' : 'Create Rule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
