'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Settings, Globe, Palette, Users, DollarSign, Mail, Search as SearchIcon,
  Shield, Wrench, Share2, FileText, Save, Check, History, Eye, Upload,
  Image, X, Trash2,
} from 'lucide-react';

interface Setting {
  id: number; key: string; value: string | null; group: string; type: string; label: string | null; hint: string | null; sort_order: number;
}

const GROUPS = [
  { key: 'branding', label: 'Branding', icon: Image },
  { key: 'general', label: 'General', icon: Settings },
  { key: 'theme', label: 'Theme', icon: Palette },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'financial', label: 'Financial', icon: DollarSign },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'seo', label: 'SEO & Analytics', icon: Globe },
  { key: 'social', label: 'Social Media', icon: Share2 },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
  { key: 'content', label: 'Content', icon: FileText },
];

export default function AdminSettingsPage() {
  const [activeGroup, setActiveGroup] = useState('branding');
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [modified, setModified] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setModified((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(modified).map(([key, value]) => ({ key, value }));
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });
      await fetch('/api/admin/clear-cache', { method: 'POST' });
      setSaved(true);
      setModified({});
      fetchSettings();
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleSeed = async () => {
    if (!confirm('Seed default settings? Existing values will NOT be overwritten.')) return;
    await fetch('/api/admin/settings?action=seed');
    fetchSettings();
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/admin/settings?action=audit');
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setAuditLogs(json.data);
    } catch {}
    setShowAudit(true);
  };

  const currentSettings = settings[activeGroup] || [];
  const filteredSettings = search
    ? Object.values(settings).flat().filter((s) =>
        s.key.toLowerCase().includes(search.toLowerCase()) ||
        s.label?.toLowerCase().includes(search.toLowerCase())
      )
    : currentSettings;

  const modifiedCount = Object.keys(modified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your platform configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAudit} className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><History size={13} /> Audit</button>
          <button onClick={handleSeed} className="px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Seed Defaults</button>
          <button onClick={handleSave} disabled={modifiedCount === 0 || saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : `Save${modifiedCount > 0 ? ` (${modifiedCount})` : ''}`}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search settings..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        {!search && (
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-0.5 sticky top-20">
              {GROUPS.map((g) => (
                <button key={g.key} onClick={() => setActiveGroup(g.key)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeGroup === g.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <g.icon size={14} />
                  {g.label}
                  {settings[g.key]?.length ? <span className="ml-auto text-[10px] text-gray-400">{settings[g.key].length}</span> : null}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredSettings.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-400"><Settings size={28} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No settings found. Click "Seed Defaults" to initialize.</p></CardContent></Card>
          ) : activeGroup === 'branding' && !search ? (
            <BrandingSection settings={filteredSettings} modified={modified} onChange={handleChange} />
          ) : (
            <Card>
              <CardContent className="py-5 space-y-4">
                {filteredSettings.map((s) => (
                  <SettingField key={s.key} setting={s} value={modified[s.key] ?? s.value ?? ''} onChange={(val) => handleChange(s.key, val)} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Audit Modal */}
      {showAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAudit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between"><h3 className="font-semibold">Audit Log</h3><button onClick={() => setShowAudit(false)} className="text-gray-400">✕</button></div>
            <div className="p-5">
              {auditLogs.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No changes yet</p> : (
                <div className="space-y-2">{auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-xs">
                    <div className="flex justify-between"><span className="font-mono text-indigo-600">{log.key}</span><span className="text-gray-400">{new Date(log.created_at).toLocaleString()}</span></div>
                    <div className="mt-1 flex gap-2"><span className="text-red-500 line-through truncate max-w-[40%]">{log.old_value || '(empty)'}</span><span>→</span><span className="text-emerald-600 truncate max-w-[40%]">{log.new_value || '(empty)'}</span></div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== BRANDING SECTION =====
function BrandingSection({ settings, modified, onChange }: { settings: Setting[]; modified: Record<string, string>; onChange: (key: string, val: string) => void }) {
  const imageFields = settings.filter((s) => s.type === 'image');
  const otherFields = settings.filter((s) => s.type !== 'image');

  return (
    <div className="space-y-6">
      {/* Image Uploads */}
      {imageFields.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-5">
              <Image size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Brand Images</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {imageFields.map((s) => (
                <ImageUploadCard key={s.key} setting={s} value={modified[s.key] ?? s.value ?? ''} onChange={(val) => onChange(s.key, val)} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other branding fields */}
      {otherFields.length > 0 && (
        <Card>
          <CardContent className="py-5 space-y-4">
            {otherFields.map((s) => (
              <SettingField key={s.key} setting={s} value={modified[s.key] ?? s.value ?? ''} onChange={(val) => onChange(s.key, val)} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== IMAGE UPLOAD CARD =====
function ImageUploadCard({ setting, value, onChange }: { setting: Setting; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'gateway');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        onChange(data.data.path);
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: [{ key: setting.key, value: data.data.path }] }),
        });
        await fetch('/api/admin/clear-cache', { method: 'POST' });
      }
    } catch {}
    setUploading(false);
  };

  const handleRemove = async () => {
    onChange('');
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: [{ key: setting.key, value: '' }] }),
    });
    await fetch('/api/admin/clear-cache', { method: 'POST' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-700">{setting.label || setting.key}</p>
        {value && (
          <button onClick={handleRemove} className="p-1 text-red-400 hover:text-red-600" title="Remove"><Trash2 size={12} /></button>
        )}
      </div>

      {value ? (
        <div className="relative group">
          <img src={value} alt={setting.label || ''} className="w-full h-28 object-contain rounded-lg bg-white border border-gray-200 p-2" />
          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => inputRef.current?.click()} className="px-3 py-1.5 bg-white text-gray-900 text-[10px] font-medium rounded-lg">Replace</button>
            <button onClick={handleRemove} className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-medium rounded-lg">Remove</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={20} className="text-gray-400" />
              <p className="text-[10px] text-gray-500">Click or drag to upload</p>
              <p className="text-[9px] text-gray-400">PNG, JPG, SVG, WEBP, ICO</p>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" className="hidden" accept="image/*,.ico,.svg" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      {setting.hint && <p className="text-[10px] text-gray-400 mt-2">{setting.hint}</p>}
    </div>
  );
}

// ===== SETTING FIELD RENDERER =====
function SettingField({ setting, value, onChange }: { setting: Setting; value: string; onChange: (v: string) => void }) {
  const { type, label, hint, key } = setting;

  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label || key}</label>
        <span className="text-[10px] font-mono text-gray-300">{key}</span>
      </div>

      {type === 'boolean' && (
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={value === '1' || value === 'true'} onChange={(e) => onChange(e.target.checked ? '1' : '0')} className="sr-only peer" />
          <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      )}

      {type === 'text' && <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-gray-50" />}
      {type === 'number' && <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-gray-50 max-w-xs" />}
      {type === 'textarea' && <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-gray-50 resize-y" />}
      {type === 'code' && <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500 bg-gray-900 text-green-400 resize-y" />}
      {type === 'color' && (
        <div className="flex items-center gap-3">
          <input type="color" value={value || '#6366f1'} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono w-28 focus:outline-none focus:border-indigo-500 bg-gray-50" />
        </div>
      )}
      {type === 'image' && (
        <ImageUploadInline value={value} onChange={onChange} />
      )}

      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// Inline image upload for non-branding sections
function ImageUploadInline({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'gateway');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) onChange(data.data.path);
    } catch {}
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-3">
      {value && <img src={value} alt="" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-1" />}
      <label className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors">
        {uploading ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
        {value ? 'Replace' : 'Upload'}
        <input type="file" className="hidden" accept="image/*,.ico,.svg" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </label>
      {value && <button onClick={() => onChange('')} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
    </div>
  );
}
