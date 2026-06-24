'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, Save, RotateCcw, CheckCircle, GripVertical } from 'lucide-react';

interface KycField {
  key: string;
  label: string;
  type: string;
  options: string;
  enabled: number;
  required: number;
  sort: number;
}

export default function AdminKycSettingsPage() {
  const [fields, setFields] = useState<KycField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/kyc-settings')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (data.success) setFields(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/kyc-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const data = await res.json();
      setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    } catch { setMsg({ type: 'error', text: 'Failed to save' }); }
    setSaving(false);
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleReset = async () => {
    if (!confirm('Reset KYC fields to defaults?')) return;
    const res = await fetch('/api/admin/kyc-settings', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const r = await fetch('/api/admin/kyc-settings');
      const d = await r.json();
      if (d.success) setFields(d.data);
    }
    setMsg({ type: 'success', text: 'Reset to defaults' });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const toggleField = (index: number, key: 'enabled' | 'required') => {
    setFields((prev) => prev.map((f, i) => i === index ? { ...f, [key]: f[key] === 1 ? 0 : 1 } : f));
  };

  const updateField = (index: number, key: string, value: string) => {
    setFields((prev) => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KYC Field Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Control which fields users see during KYC verification</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <CheckCircle size={14} /> {msg.text}
        </div>
      )}

      <Card>
        <CardContent className="py-4">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />

                {/* Field Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{field.label}</p>
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded">{field.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Key: {field.key}</p>
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.enabled === 1}
                      onChange={() => toggleField(index, 'enabled')}
                      className="rounded text-indigo-600 border-gray-300"
                    />
                    <span className={`text-xs font-medium ${field.enabled === 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {field.enabled === 1 ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Required Toggle */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required === 1}
                      onChange={() => toggleField(index, 'required')}
                      disabled={field.enabled === 0}
                      className="rounded text-orange-600 border-gray-300 disabled:opacity-30"
                    />
                    <span className={`text-xs font-medium ${field.required === 1 && field.enabled === 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {field.required === 1 ? 'Required' : 'Optional'}
                    </span>
                  </label>
                </div>

                {/* Edit Label */}
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, 'label', e.target.value)}
                  className="w-48 px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">User Preview (Enabled fields only)</h3>
          <div className="space-y-2">
            {fields.filter((f) => f.enabled === 1).map((f) => (
              <div key={f.key} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg text-xs">
                <span className="text-gray-700">{f.label}</span>
                <div className="flex gap-2">
                  <span className={`px-1.5 py-0.5 rounded ${f.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {f.required ? 'Required' : 'Optional'}
                  </span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">{f.type}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
