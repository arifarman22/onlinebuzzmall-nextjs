'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function EditNotificationPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    name: '', subject: '', email_body: '', sms_body: '', email_status: 1, sms_status: 1,
  });

  useEffect(() => {
    fetch(`/api/admin/notifications?id=${params.id}`).then(r => r.json()).then(data => {
      if (data.success) setForm(data.data);
      setFetching(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await fetch('/api/admin/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(params.id), ...form }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
  };

  if (fetching) return <p className="text-gray-500 py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Edit Template: {form.name}</h2>

      {msg.text && <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Email Template</h3></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML)</label>
              <textarea
                value={form.email_body || ''}
                onChange={(e) => setForm({ ...form, email_body: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.email_status === 1} onChange={(e) => setForm({ ...form, email_status: e.target.checked ? 1 : 0 })} className="rounded" />
              <span className="text-sm">Email notification enabled</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">SMS Template</h3></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMS Body</label>
              <textarea
                value={form.sms_body || ''}
                onChange={(e) => setForm({ ...form, sms_body: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 min-h-[100px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.sms_status === 1} onChange={(e) => setForm({ ...form, sms_status: e.target.checked ? 1 : 0 })} className="rounded" />
              <span className="text-sm">SMS notification enabled</span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" loading={loading}>Save Template</Button>
      </form>
    </div>
  );
}
