'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Headphones, Type, Save, Check, Mail } from 'lucide-react';

export default function AdminSupportSettingsPage() {
  const [form, setForm] = useState({ support_telegram: '', support_whatsapp: '', support_livechat: '', support_livechat_label: '', support_header: '', support_email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings?group=support').then(r => r.json()).then(data => {
      if (data.success && data.data) {
        const map: Record<string, string> = {};
        data.data.forEach((s: any) => { map[s.key] = s.value || ''; });
        setForm({ support_telegram: map.support_telegram || '', support_whatsapp: map.support_whatsapp || '', support_livechat: map.support_livechat || '', support_livechat_label: map.support_livechat_label || '', support_header: map.support_header || '', support_email: map.support_email || '' });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: Object.entries(form).map(([key, value]) => ({ key, value })) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support Settings</h2>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Type size={14} className="text-gray-400" /> Support Header Text
          </label>
          <input value={form.support_header} onChange={(e) => setForm({ ...form, support_header: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" placeholder="Need Help? Contact Us" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Send size={14} className="text-blue-500" /> Telegram Link
          </label>
          <input value={form.support_telegram} onChange={(e) => setForm({ ...form, support_telegram: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" placeholder="https://t.me/yourusername" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MessageCircle size={14} className="text-green-500" /> WhatsApp Link
          </label>
          <input value={form.support_whatsapp} onChange={(e) => setForm({ ...form, support_whatsapp: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" placeholder="https://wa.me/1234567890" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Headphones size={14} className="text-purple-500" /> Live Chat Link
          </label>
          <input value={form.support_livechat} onChange={(e) => setForm({ ...form, support_livechat: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" placeholder="https://tawk.to/chat/xxx" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail size={14} className="text-orange-500" /> Support Email
          </label>
          <input type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" placeholder="support@yourdomain.com" />
        </div>
      </div>
    </div>
  );
}
